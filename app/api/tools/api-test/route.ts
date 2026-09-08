import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { SITE_URL } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20

const MAX_BODY_LENGTH = 4096
const MAX_RESPONSE_BYTES = 64 * 1024
const REQUEST_TIMEOUT_MS = 12_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 8

type RateRecord = { count: number; resetAt: number }
type Locale = 'zh' | 'ru'
type ApiPayload = { endpoint?: unknown; apiKey?: unknown; model?: unknown; locale?: unknown }

const russianMessages: Record<string, string> = {
  '请输入完整、有效的 HTTPS API 地址。': 'Введите полный и корректный HTTPS-адрес API.',
  '为了保护 API Key，只允许检测 HTTPS 地址。': 'Для защиты API-ключа разрешены только HTTPS-адреса.',
  'API 地址不能包含账号、密码、查询参数或锚点。': 'Адрес API не должен содержать логин, пароль, параметры запроса или якорь.',
  '仅允许使用标准 HTTPS 端口 443。': 'Разрешён только стандартный HTTPS-порт 443.',
  '不能检测本地或内网地址。': 'Нельзя проверять локальные или внутренние адреса.',
  '不能检测本地、保留或内网 IP 地址。': 'Нельзя проверять локальные, зарезервированные или внутренние IP-адреса.',
  '无法解析该 API 域名，请检查地址是否正确。': 'Не удалось определить IP-адрес домена API. Проверьте адрес.',
  '该域名解析到了不允许访问的网络地址。': 'Домен указывает на сетевой адрес, который нельзя проверять.',
  '请输入有效的 API 地址。': 'Введите корректный адрес API.',
  '请输入有效的临时 API Key。': 'Введите корректный временный API-ключ.',
  '模型名称格式不正确。': 'Некорректный формат идентификатора модели.',
  '检测次数过多，请稍后再试。': 'Слишком много проверок. Повторите попытку позже.',
  'API 地址校验失败。': 'Не удалось проверить адрес API.',
  'API Key 无效或未获得该接口授权。': 'API-ключ недействителен или не имеет доступа к этому интерфейсу.',
  '请求被服务商拒绝，请检查 Key 权限或访问限制。': 'Провайдер отклонил запрос. Проверьте права ключа и ограничения доступа.',
  '未找到接口或模型，请检查 API 地址和模型名称。': 'Интерфейс или модель не найдены. Проверьте адрес API и ID модели.',
  '请求受到限流，或账户额度不足。': 'Превышен лимит запросов или на счёте недостаточно средств.',
  '服务商接口暂时不可用，请稍后再试。': 'API провайдера временно недоступен. Повторите попытку позже.',
  '接口返回了跳转地址。为防止 Key 被转发到其他域名，本次检测已停止。': 'API вернул перенаправление. Проверка остановлена, чтобы ключ не был отправлен на другой домен.',
  '接口已连接，但返回内容不是标准的 OpenAI 对话格式。': 'Подключение установлено, но ответ не соответствует формату OpenAI Chat Completions.',
  '连接成功，接口返回了有效的对话响应。': 'Подключение успешно: API вернул корректный ответ чата.',
  '请求超过 12 秒仍未完成，请稍后重试或更换线路。': 'Запрос не завершился за 12 секунд. Повторите попытку позже или выберите другой маршрут.',
  '连接接口失败。': 'Не удалось подключиться к API.',
  '上游响应内容过大，已停止读取。': 'Ответ API слишком большой, чтение остановлено.',
}

function localize(value: string, locale: Locale) {
  if (locale === 'zh') return value
  if (value.startsWith('接口返回 HTTP ')) {
    const status = value.match(/\d+/)?.[0] || ''
    return `API вернул HTTP ${status}. Проверьте настройки провайдера.`
  }
  return russianMessages[value] || value
}

function localizedJson(
  data: Record<string, unknown>,
  locale: Locale,
  status = 200,
  extraHeaders?: HeadersInit
) {
  const localizedData = { ...data }
  if (typeof localizedData.error === 'string') localizedData.error = localize(localizedData.error, locale)
  if (typeof localizedData.message === 'string') localizedData.message = localize(localizedData.message, locale)
  return json(localizedData, status, extraHeaders)
}

const rateLimitGlobal = globalThis as typeof globalThis & {
  apiTestRateLimit?: Map<string, RateRecord>
}
const rateLimitStore = rateLimitGlobal.apiTestRateLimit ?? new Map<string, RateRecord>()
rateLimitGlobal.apiTestRateLimit = rateLimitStore

function json(data: object, status = 200, extraHeaders?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  })
}

function getClientId(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function checkRateLimit(clientId: string) {
  const now = Date.now()

  if (rateLimitStore.size > 5000) {
    for (const [key, record] of rateLimitStore) {
      if (record.resetAt <= now) rateLimitStore.delete(key)
    }
  }

  const current = rateLimitStore.get(clientId)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfter: 0 }
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  }

  current.count += 1
  return { allowed: true, retryAfter: 0 }
}

function isPrivateAddress(address: string) {
  const version = isIP(address)

  if (version === 4) {
    const [a, b, c] = address.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    )
  }

  if (version === 6) {
    const normalized = address.toLowerCase()
    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      /^fe[89ab]/.test(normalized) ||
      normalized.startsWith('ff') ||
      normalized.startsWith('2001:db8') ||
      normalized.startsWith('::ffff:')
    )
  }

  return true
}

async function validateAndBuildEndpoint(input: string) {
  let url: URL

  try {
    url = new URL(input)
  } catch {
    throw new Error('请输入完整、有效的 HTTPS API 地址。')
  }

  if (url.protocol !== 'https:') {
    throw new Error('为了保护 API Key，只允许检测 HTTPS 地址。')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('API 地址不能包含账号、密码、查询参数或锚点。')
  }
  if (url.port && url.port !== '443') {
    throw new Error('仅允许使用标准 HTTPS 端口 443。')
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('不能检测本地或内网地址。')
  }

  const directIpVersion = isIP(hostname)
  if (directIpVersion && isPrivateAddress(hostname)) {
    throw new Error('不能检测本地、保留或内网 IP 地址。')
  }

  if (!directIpVersion) {
    let addresses: Array<{ address: string; family: number }>
    try {
      addresses = await lookup(hostname, { all: true, verbatim: true })
    } catch {
      throw new Error('无法解析该 API 域名，请检查地址是否正确。')
    }

    if (!addresses.length || addresses.some(item => isPrivateAddress(item.address))) {
      throw new Error('该域名解析到了不允许访问的网络地址。')
    }
  }

  const pathname = url.pathname.replace(/\/+$/, '')
  if (pathname.endsWith('/chat/completions')) {
    url.pathname = pathname
  } else if (pathname.endsWith('/v1')) {
    url.pathname = `${pathname}/chat/completions`
  } else {
    url.pathname = `${pathname}/v1/chat/completions`.replace(/^\/\//, '/')
  }

  return url
}

async function readLimitedText(response: Response) {
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let output = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error('上游响应内容过大，已停止读取。')
    }
    output += decoder.decode(value, { stream: true })
  }

  return output + decoder.decode()
}

function getUpstreamMessage(status: number) {
  if (status === 401) return 'API Key 无效或未获得该接口授权。'
  if (status === 403) return '请求被服务商拒绝，请检查 Key 权限或访问限制。'
  if (status === 404) return '未找到接口或模型，请检查 API 地址和模型名称。'
  if (status === 429) return '请求受到限流，或账户额度不足。'
  if (status >= 500) return '服务商接口暂时不可用，请稍后再试。'
  return `接口返回 HTTP ${status}，请检查服务商配置。`
}

function sanitizeDetail(value: unknown, apiKey: string) {
  if (typeof value !== 'string') return undefined
  return value
    .replaceAll(apiKey, '[已隐藏]')
    .replace(/sk-[A-Za-z0-9_-]{6,}/g, '[已隐藏]')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, 240)
}

function modelsMatch(requested: string, returned?: string) {
  if (!returned) return null
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const left = normalize(requested)
  const right = normalize(returned)
  return Boolean(left && right) && (left === right || left.includes(right) || right.includes(left))
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = new Set([request.url ? new URL(request.url).origin : '', new URL(SITE_URL).origin])
  if (origin && !allowedOrigins.has(origin)) {
    return json({ error: '请求来源不受信任。' }, 403)
  }

  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return json({ error: '请求格式不正确。' }, 415)
  }

  const contentLength = Number(request.headers.get('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_LENGTH) {
    return json({ error: '请求内容为空或过大。' }, 400)
  }

  const rawBody = await request.text()
  if (!rawBody || rawBody.length > MAX_BODY_LENGTH) {
    return json({ error: '请求内容为空或过大。' }, 400)
  }

  let payload: ApiPayload
  try {
    payload = JSON.parse(rawBody) as ApiPayload
  } catch {
    return json({ error: '请求内容不是有效的 JSON。' }, 400)
  }

  const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint.trim() : ''
  const apiKey = typeof payload.apiKey === 'string' ? payload.apiKey.trim() : ''
  const model = typeof payload.model === 'string' ? payload.model.trim() : ''
  const locale: Locale = payload.locale === 'ru' ? 'ru' : 'zh'

  if (!endpoint || endpoint.length > 300) return localizedJson({ error: '请输入有效的 API 地址。' }, locale, 400)
  if (apiKey.length < 6 || apiKey.length > 1024) return localizedJson({ error: '请输入有效的临时 API Key。' }, locale, 400)
  if (!model || model.length > 120 || !/[A-Za-z0-9]/.test(model) || !/^[A-Za-z0-9._:/-]+$/.test(model)) {
    return localizedJson({ error: '模型名称格式不正确。' }, locale, 400)
  }

  const rateLimit = checkRateLimit(getClientId(request))
  if (!rateLimit.allowed) {
    return localizedJson(
      { error: '检测次数过多，请稍后再试。', retryAfter: rateLimit.retryAfter },
      locale,
      429,
      { 'Retry-After': String(rateLimit.retryAfter) }
    )
  }

  let testUrl: URL
  try {
    testUrl = await validateAndBuildEndpoint(endpoint)
  } catch (error) {
    return localizedJson({ error: error instanceof Error ? error.message : 'API 地址校验失败。' }, locale, 400)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = performance.now()

  try {
    const upstream = await fetch(testUrl, {
      method: 'POST',
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'APIXuan-Connectivity-Test/1.0',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply only with API_OK' }],
        max_tokens: 16,
        stream: false,
      }),
    })

    const latencyMs = Math.round(performance.now() - startedAt)

    if (upstream.status >= 300 && upstream.status < 400) {
      return localizedJson({
        ok: false,
        upstreamStatus: upstream.status,
        latencyMs,
        requestedModel: model,
        message: '接口返回了跳转地址。为防止 Key 被转发到其他域名，本次检测已停止。',
      }, locale)
    }

    const rawResponse = await readLimitedText(upstream)
    let data: Record<string, unknown> = {}
    try {
      data = rawResponse ? JSON.parse(rawResponse) as Record<string, unknown> : {}
    } catch {
      data = {}
    }

    if (!upstream.ok) {
      const errorObject = typeof data.error === 'object' && data.error !== null
        ? data.error as Record<string, unknown>
        : undefined
      return localizedJson({
        ok: false,
        upstreamStatus: upstream.status,
        latencyMs,
        requestedModel: model,
        message: getUpstreamMessage(upstream.status),
        detail: sanitizeDetail(errorObject?.message, apiKey),
      }, locale)
    }

    const choices = Array.isArray(data.choices) ? data.choices : []
    const firstChoice = typeof choices[0] === 'object' && choices[0] !== null
      ? choices[0] as Record<string, unknown>
      : undefined
    const messageObject = typeof firstChoice?.message === 'object' && firstChoice.message !== null
      ? firstChoice.message as Record<string, unknown>
      : undefined
    const responseModel = typeof data.model === 'string' ? data.model : undefined
    const content = sanitizeDetail(messageObject?.content, apiKey)
    const usageObject = typeof data.usage === 'object' && data.usage !== null
      ? data.usage as Record<string, unknown>
      : undefined
    const usage = usageObject ? {
      promptTokens: typeof usageObject.prompt_tokens === 'number' ? usageObject.prompt_tokens : undefined,
      completionTokens: typeof usageObject.completion_tokens === 'number' ? usageObject.completion_tokens : undefined,
      totalTokens: typeof usageObject.total_tokens === 'number' ? usageObject.total_tokens : undefined,
    } : undefined

    if (!firstChoice || !messageObject) {
      return localizedJson({
        ok: false,
        upstreamStatus: upstream.status,
        latencyMs,
        requestedModel: model,
        responseModel,
        message: '接口已连接，但返回内容不是标准的 OpenAI 对话格式。',
      }, locale)
    }

    return localizedJson({
      ok: true,
      upstreamStatus: upstream.status,
      latencyMs,
      requestedModel: model,
      responseModel,
      modelMatched: modelsMatch(model, responseModel),
      usage,
      preview: content,
      message: '连接成功，接口返回了有效的对话响应。',
    }, locale)
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError'
    return localizedJson({
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      requestedModel: model,
      message: timedOut
        ? '请求超过 12 秒仍未完成，请稍后重试或更换线路。'
        : error instanceof Error
          ? sanitizeDetail(error.message, apiKey) || '连接接口失败。'
          : '连接接口失败。',
    }, locale)
  } finally {
    clearTimeout(timeout)
  }
}
