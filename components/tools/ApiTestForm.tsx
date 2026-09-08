'use client'

import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Server,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'

type TestResult = {
  ok: boolean
  upstreamStatus?: number
  latencyMs?: number
  requestedModel?: string
  responseModel?: string
  modelMatched?: boolean | null
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  preview?: string
  message: string
  detail?: string
}

const copy = {
  zh: {
    endpoint: 'API 地址',
    endpointHint: '填写服务商提供的 Base URL，例如 https://api.example.com/v1',
    model: '模型名称',
    modelHint: '请使用服务商控制台显示的准确模型 ID',
    apiKey: '临时 API Key',
    showKey: '显示 API Key',
    hideKey: '隐藏 API Key',
    agreement: '我确认使用的是临时 Key，并同意发起一次最小测试请求',
    safety: 'Key 只用于本次检测，请求完成后会从输入框清除；本站不保存 Key 和请求内容。',
    submit: '开始检测',
    submitting: '正在检测',
    success: '连接正常',
    failed: '检测未通过',
    httpStatus: 'HTTP 状态',
    latency: '响应时间',
    requestedModel: '请求模型',
    responseModel: '返回模型',
    notReturned: '未返回',
    match: '名称基本一致',
    mismatch: '名称不一致',
    tokenUsage: '本次用量',
    tokens: 'tokens',
    responsePreview: '响应预览',
    networkError: '检测请求失败，请稍后重试。',
  },
  ru: {
    endpoint: 'Адрес API',
    endpointHint: 'Укажите Base URL сервиса, например https://api.example.com/v1',
    model: 'Идентификатор модели',
    modelHint: 'Введите точный ID модели из панели провайдера',
    apiKey: 'Временный API-ключ',
    showKey: 'Показать API-ключ',
    hideKey: 'Скрыть API-ключ',
    agreement: 'Я использую временный ключ и разрешаю выполнить один минимальный запрос',
    safety: 'Ключ используется только для этой проверки и удаляется из поля после запроса. Сайт не сохраняет ключ и содержимое запроса.',
    submit: 'Начать проверку',
    submitting: 'Проверяем',
    success: 'Подключение работает',
    failed: 'Проверка не пройдена',
    httpStatus: 'Статус HTTP',
    latency: 'Время ответа',
    requestedModel: 'Запрошенная модель',
    responseModel: 'Модель в ответе',
    notReturned: 'Не указана',
    match: 'Названия совпадают',
    mismatch: 'Названия различаются',
    tokenUsage: 'Расход запроса',
    tokens: 'токенов',
    responsePreview: 'Фрагмент ответа',
    networkError: 'Не удалось выполнить проверку. Повторите попытку позже.',
  },
} as const

export function ApiTestForm({ locale }: { locale: Locale }) {
  const text = copy[locale]
  const [endpoint, setEndpoint] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [formError, setFormError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setResult(null)
    setFormError('')

    try {
      const response = await fetch('/api/tools/api-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, model, apiKey, locale }),
      })
      const body = await response.json() as TestResult & { error?: string }

      if (!response.ok && body.error) {
        setFormError(body.error)
        return
      }

      setResult(body)
    } catch {
      setFormError(text.networkError)
    } finally {
      setApiKey('')
      setShowKey(false)
      setLoading(false)
    }
  }

  const inputClass = 'mt-1.5 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white" aria-labelledby="api-test-form-title">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="api-test-form-title" className="text-lg font-semibold text-gray-900">
              {locale === 'ru' ? 'Параметры подключения' : '填写检测参数'}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {locale === 'ru' ? 'Поддерживаются API, совместимые с OpenAI Chat Completions' : '支持 OpenAI Chat Completions 兼容接口'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 p-4 sm:p-6">
        <div>
          <label htmlFor="api-endpoint" className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Server className="h-4 w-4 text-gray-500" aria-hidden="true" />
            {text.endpoint}
          </label>
          <input
            id="api-endpoint"
            type="url"
            inputMode="url"
            required
            maxLength={300}
            autoComplete="url"
            value={endpoint}
            onChange={event => setEndpoint(event.target.value)}
            placeholder="https://api.example.com/v1"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-gray-500">{text.endpointHint}</p>
        </div>

        <div>
          <label htmlFor="api-model" className="text-sm font-medium text-gray-800">{text.model}</label>
          <input
            id="api-model"
            type="text"
            required
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
            value={model}
            onChange={event => setModel(event.target.value)}
            placeholder="gpt-4o-mini"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-gray-500">{text.modelHint}</p>
        </div>

        <div>
          <label htmlFor="api-key" className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <KeyRound className="h-4 w-4 text-gray-500" aria-hidden="true" />
            {text.apiKey}
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              required
              minLength={6}
              maxLength={1024}
              autoComplete="new-password"
              spellCheck={false}
              value={apiKey}
              onChange={event => setApiKey(event.target.value)}
              placeholder="sk-..."
              className={`${inputClass} pr-11 font-mono`}
            />
            <button
              type="button"
              onClick={() => setShowKey(value => !value)}
              className="absolute right-1 top-2.5 flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label={showKey ? text.hideKey : text.showKey}
              title={showKey ? text.hideKey : text.showKey}
            >
              {showKey ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="border-y border-gray-100 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{text.agreement}</span>
          </label>
          <p className="mt-2 pl-7 text-xs leading-5 text-gray-500">{text.safety}</p>
        </div>

        {formError && (
          <div role="alert" className="flex items-start gap-2 border-l-4 border-red-500 bg-red-50 px-3 py-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !confirmed}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Activity className="h-4 w-4" aria-hidden="true" />}
          {loading ? text.submitting : text.submit}
        </button>
      </form>

      {result && (
        <div className={`border-t px-4 py-5 sm:px-6 ${result.ok ? 'border-green-200 bg-green-50/60' : 'border-red-200 bg-red-50/60'}`} aria-live="polite">
          <div className="flex items-start gap-3">
            {result.ok
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
              : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold ${result.ok ? 'text-green-900' : 'text-red-900'}`}>
                {result.ok ? text.success : text.failed}
              </h3>
              <p className="mt-1 text-sm text-gray-700">{result.message}</p>
              {result.detail && <p className="mt-1 break-words text-xs text-gray-600">{result.detail}</p>}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-gray-200/70 pt-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500">{text.httpStatus}</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{result.upstreamStatus ?? '-'}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-gray-500"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{text.latency}</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{result.latencyMs !== undefined ? `${result.latencyMs} ms` : '-'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-gray-500">{text.requestedModel}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-gray-900" title={result.requestedModel}>{result.requestedModel || '-'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-gray-500">{text.responseModel}</dt>
              <dd className="mt-1 truncate text-sm font-semibold text-gray-900" title={result.responseModel}>{result.responseModel || text.notReturned}</dd>
              {result.modelMatched !== null && result.modelMatched !== undefined && (
                <p className={`mt-1 text-xs ${result.modelMatched ? 'text-green-700' : 'text-amber-700'}`}>
                  {result.modelMatched ? text.match : text.mismatch}
                </p>
              )}
            </div>
          </dl>

          {result.usage?.totalTokens !== undefined && (
            <p className="mt-4 text-xs text-gray-600">{text.tokenUsage}: {result.usage.totalTokens} {text.tokens}</p>
          )}
          {result.preview && (
            <div className="mt-4 border-t border-gray-200/70 pt-4">
              <p className="text-xs text-gray-500">{text.responsePreview}</p>
              <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-900 px-3 py-2 text-xs text-gray-100">{result.preview}</pre>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
