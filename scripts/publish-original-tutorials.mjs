import dotenv from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const now = new Date().toISOString()

const articles = [
  {
    slug: 'debug-ai-api-streaming-sse',
    title: 'AI API 流式输出中断怎么办？SSE 调试与重试完整指南（2026）',
    summary: '从 curl、Node.js 和 Python 三个角度排查 AI API 流式输出中断，区分首字节超时、代理缓冲、连接断开和重复重试，附可直接运行的测试代码。',
    category: 'tutorial',
    tags: ['SSE', '流式输出', 'API调试', 'Node.js', 'Python'],
    content: `很多 AI API 使用 \`stream=true\` 后，会通过 SSE（Server-Sent Events）逐段返回内容。页面一直转圈、只收到半句话、或者 curl 能看到内容但程序收不到，通常不是模型本身故障，而是连接、代理或读取代码的问题。

## 一、先确认问题发生在哪一层

把链路拆成四层：客户端代码、反向代理、API 中转服务、上游模型。先用命令行绕过自己的业务代码测试：

\`\`\`bash
curl -N --http1.1 https://你的服务商地址/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"你的模型ID","messages":[{"role":"user","content":"请用三句话介绍 SSE"}],"stream":true}'
\`\`\`

\`-N\` 禁止 curl 缓冲输出，\`--http1.1\` 可以排除部分 HTTP/2 代理兼容问题。正常结果应该是一串以 \`data:\` 开头的事件，最后通常是 \`data: [DONE]\`。

## 二、首字节超时和中途断开不是一回事

首字节超时表示请求发出后迟迟没有任何数据，常见原因是模型排队、余额不足或服务商路由异常。可以重试，但要使用指数退避，例如 1 秒、2 秒、4 秒，最多 3 次。

中途断开表示已经收到部分内容后连接关闭。此时不要盲目把整条请求重放，否则用户可能收到重复答案，还会重复扣费。更稳妥的做法是保存已收到的文本，并在下一次请求中明确要求“从最后一句继续”，或者直接提示用户重新生成。

## 三、Node.js 正确读取 SSE

\`\`\`js
const response = await fetch(\`\${baseUrl}/v1/chat/completions\`, {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ model, messages, stream: true }),
  signal: AbortSignal.timeout(60000),
})

if (!response.ok || !response.body) {
  throw new Error(\`HTTP \${response.status}\`)
}

const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split('\\n\\n')
  buffer = events.pop() || ''
  for (const event of events) {
    const line = event.split('\\n').find(item => item.startsWith('data:'))
    if (!line) continue
    const payload = line.slice(5).trim()
    if (payload === '[DONE]') continue
    const json = JSON.parse(payload)
    process.stdout.write(json.choices?.[0]?.delta?.content || '')
  }
}
\`\`\`

关键点是保留未完成的 \`buffer\`。网络分片不一定刚好在换行处结束，直接对每次 \`read()\` 的结果执行 JSON.parse 会偶发报错。

## 四、Python 客户端的超时设置

\`\`\`python
import requests

with requests.post(
    f"{base_url}/v1/chat/completions",
    headers={"Authorization": f"Bearer {api_key}"},
    json={"model": model, "messages": messages, "stream": True},
    stream=True,
    timeout=(10, 120),  # 连接超时 10 秒，读取超时 120 秒
) as response:
    response.raise_for_status()
    for line in response.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        payload = line[5:].strip()
        if payload != "[DONE]":
            print(payload)
\`\`\`

不要把连接超时和读取超时设置成同一个很小的数字。模型已经开始输出时，只要持续有数据，就不应该因为单个 token 间隔稍长而被客户端取消。

## 五、反向代理的三个常见坑

1. Nginx 或 CDN 开启了响应缓冲，导致后端已经收到数据，浏览器却要等完整响应才显示。需要关闭该接口的 buffering。
2. 代理的 idle timeout 小于模型生成时间。长回答没有新数据的一段时间后，代理会主动断开。
3. gzip 或安全网关重写了 \`text/event-stream\`。SSE 接口应保持该 Content-Type，并尽量关闭压缩和缓存。

## 六、上线前测试清单

- curl 能否持续看到多个 \`data:\` 事件；
- 首个 token 是否在业务允许的时间内返回；
- 断网后客户端是否能停止读取并释放连接；
- 429、502、504 是否只在“尚未收到内容”时自动重试；
- 日志是否记录 request id、状态码和耗时，但不记录 API Key 与完整提示词；
- 同一请求重试后是否会重复扣费。

先用 curl 验证链路，再接入 Node.js/Python，最后才放到 CDN 或生产代理后面，定位问题会快很多。`,
    ru: {
      title: 'Почему прерывается потоковый вывод AI API? Полное руководство по отладке SSE (2026)',
      summary: 'Практическая диагностика потокового ответа AI API с curl, Node.js и Python: тайм-аут первого байта, буферизация прокси, разрыв соединения и безопасные повторы.',
      content: `Многие AI API при включённом параметре \`stream=true\` возвращают ответ частями через SSE (Server-Sent Events). Если интерфейс бесконечно показывает загрузку, приходит только половина фразы или curl видит данные, а приложение нет, причина обычно в соединении, прокси или обработчике потока.

## 1. Определите слой, где возникает ошибка

Разделите цепочку на клиентский код, обратный прокси, API-прокси и upstream-модель. Сначала проверьте запрос напрямую из терминала:

\`\`\`bash
curl -N --http1.1 https://адрес-провайдера/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"ID-модели","messages":[{"role":"user","content":"Объясни SSE в трёх предложениях"}],"stream":true}'
\`\`\`

Параметр \`-N\` отключает буферизацию curl, а \`--http1.1\` помогает исключить проблемы совместимости HTTP/2. Нормальный ответ состоит из событий \`data:\`, а в конце обычно приходит \`data: [DONE]\`.

## 2. Тайм-аут первого байта и разрыв потока

Тайм-аут первого байта означает, что после отправки запроса не пришло ни одного фрагмента. Причиной могут быть очередь модели, недостаточный баланс или сбой маршрута. Такой запрос допустимо повторить с экспоненциальной задержкой 1, 2 и 4 секунды, не более трёх раз.

Если соединение оборвалось после получения части текста, не повторяйте весь запрос автоматически: пользователь может получить дубликат, а баланс будет списан повторно. Сохраните уже полученный текст и предложите продолжение либо новую генерацию.

## 3. Чтение SSE в Node.js

Используйте \`ReadableStream\` и сохраняйте незавершённый буфер. Сетевой фрагмент не обязан заканчиваться на границе JSON или строки, поэтому нельзя выполнять JSON.parse над каждым результатом \`read()\`.

\`\`\`js
const response = await fetch(\`\${baseUrl}/v1/chat/completions\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${process.env.API_KEY}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages, stream: true }),
  signal: AbortSignal.timeout(60000),
})
if (!response.ok || !response.body) throw new Error(\`HTTP \${response.status}\`)
const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split('\\n\\n')
  buffer = events.pop() || ''
  for (const event of events) {
    const line = event.split('\\n').find(item => item.startsWith('data:'))
    if (!line) continue
    const payload = line.slice(5).trim()
    if (payload === '[DONE]') continue
    const json = JSON.parse(payload)
    process.stdout.write(json.choices?.[0]?.delta?.content || '')
  }
}
\`\`\`

## 4. Python 的超时设置

\`\`\`python
with requests.post(url, headers=headers, json=body, stream=True, timeout=(10, 120)) as response:
    response.raise_for_status()
    for line in response.iter_lines(decode_unicode=True):
        if line and line.startswith('data:') and line[5:].strip() != '[DONE]':
            print(line[5:].strip())
\`\`\`

连接超时和读取超时应分开设置。模型已经开始输出时，只要连接仍在产生数据，就不应因为两个 token 之间间隔稍长而取消请求。

## 5. 代理配置与上线检查

常见问题包括 Nginx/CDN 缓冲响应、代理 idle timeout 太短，以及 gzip 或安全网关改写 \`text/event-stream\`。SSE 接口应保持该 Content-Type，并关闭不必要的缓存和压缩。

上线前至少验证：curl 能看到连续事件；首 token 延迟可接受；客户端能在断网后释放连接；429/502/504 只在尚未收到内容时重试；日志不记录 API Key 和完整提示词；重试不会造成重复扣费。`,
    },
  },
  {
    slug: 'openai-compatible-vision-api-image-input',
    title: 'OpenAI 兼容 API 图片输入教程：Base64、图片 URL 与模型能力验证（2026）',
    summary: '用统一的 OpenAI 兼容格式发送图片，讲清图片 URL、Base64、MIME 类型、文件大小限制和模型能力验证，附 curl、Python、Node.js 示例。',
    category: 'tutorial',
    tags: ['多模态', '图片输入', 'OpenAI兼容', 'Base64', 'API配置'],
    content: `很多服务商宣称“兼容 OpenAI API”，但文本请求成功，不代表图片输入也可用。图片请求同时涉及消息格式、模型能力、文件大小和图片来源权限，最好单独做一次最小测试。

## 一、先确认三个条件

1. 服务商的 Base URL 确实提供 \`/v1/chat/completions\` 或文档中指定的兼容路径；
2. 当前模型支持视觉输入，而不是只支持文本；
3. 服务商允许使用远程图片 URL，或者允许传递 data URL。

不要直接把普通的 \`content: "请描述这张图"\` 和图片路径混在一起。多模态消息通常需要数组格式：

\`\`\`json
{
  "role": "user",
  "content": [
    {"type": "text", "text": "请用一句话描述图片"},
    {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
  ]
}
\`\`\`

## 二、用图片 URL 做第一次测试

图片 URL 必须能被服务商服务器访问，不能依赖你的本地电脑、内网地址或需要登录的网盘。使用 curl 时可以这样发送：

\`\`\`bash
curl https://你的服务商地址/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"支持视觉的模型","messages":[{"role":"user","content":[{"type":"text","text":"图片里有什么？"},{"type":"image_url","image_url":{"url":"https://example.com/photo.jpg"}}]}],"max_tokens":200}'
\`\`\`

如果返回 400，先检查 JSON 结构和 model id；如果返回下载失败，通常是 URL 不公开、证书异常、返回了 HTML，或者图片太大。

## 三、本地图片转 Base64

当图片不能公开访问时，可以转换为 data URL。注意 Base64 会让请求体变大，生产环境要设置大小上限。

\`\`\`python
import base64
import mimetypes
from pathlib import Path

path = Path('photo.jpg')
mime = mimetypes.guess_type(path.name)[0] or 'image/jpeg'
encoded = base64.b64encode(path.read_bytes()).decode('ascii')
image_url = f'data:{mime};base64,{encoded}'
body = {
    'model': '支持视觉的模型',
    'messages': [{'role': 'user', 'content': [
        {'type': 'text', 'text': '请描述这张图片'},
        {'type': 'image_url', 'image_url': {'url': image_url}},
    ]}],
}
\`\`\`

常见 MIME 类型是 \`image/jpeg\`、\`image/png\` 和 \`image/webp\`。不要只根据文件扩展名猜测，上传前最好读取文件头并拒绝不支持的格式。

## 四、Node.js 的最小请求

\`\`\`js
import { readFile } from 'node:fs/promises'

const bytes = await readFile('./photo.jpg')
const base64 = Buffer.from(bytes).toString('base64')
const response = await fetch(\`\${baseUrl}/v1/chat/completions\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: '支持视觉的模型',
    messages: [{ role: 'user', content: [
      { type: 'text', text: '请描述图片中的主要对象' },
      { type: 'image_url', image_url: { url: \`data:image/jpeg;base64,\${base64}\` } },
    ]}],
  }),
})
console.log(await response.json())
\`\`\`

## 五、为什么文本模型会返回“参数错误”

兼容协议只代表请求外形相近，不代表所有模型都实现视觉能力。用同一个 Base URL 逐项测试：文本模型、视觉模型、小尺寸图片、较大图片。把每次测试的 model id、HTTP 状态码和响应耗时记录下来，才能区分“模型不支持”和“服务商没有转发图片”。

## 六、安全和成本注意事项

- 图片可能包含身份证、合同或聊天截图，发送前先打码；
- Base64 会增加请求体体积，可能触发网关 413；
- 图片通常会计入输入 Token，不能只看文本价格；
- 不要把带签名、带用户隐私的图片 URL 写入日志；
- 失败重试前检查服务商是否已经成功接收图片，避免重复扣费。

推荐顺序是：公开小图片 URL → 本地小图片 Base64 → 生产环境加入尺寸、格式、超时和隐私检查。`,
    ru: {
      title: 'Изображения в OpenAI-совместимом API: URL, Base64 и проверка мультимодальной модели (2026)',
      summary: 'Как отправлять изображения в OpenAI-совместимый API: формат сообщения, публичный URL, Base64, MIME-типы, ограничения размера и проверка возможностей модели.',
      content: `Успешный текстовый запрос ещё не означает, что провайдер действительно поддерживает изображения. Мультимодальный запрос зависит от формата сообщения, возможностей модели, размера файла и доступности источника изображения.

## 1. Проверьте три условия

Убедитесь, что Base URL поддерживает совместимый путь, выбранная модель принимает изображения, а провайдер разрешает публичные URL или data URL. Обычно сообщение выглядит так:

\`\`\`json
{
  "role": "user",
  "content": [
    {"type": "text", "text": "Опиши изображение одним предложением"},
    {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}}
  ]
}
\`\`\`

## 2. Первый тест через публичный URL

URL должен быть доступен серверам провайдера. Локальный компьютер, внутренний адрес и закрытое облачное хранилище не подойдут. При ошибке 400 сначала проверьте JSON и ID модели; при ошибке загрузки проверьте публичность URL, сертификат, MIME-тип и размер файла.

## 3. Локальный файл в Base64

Если изображение нельзя открыть извне, передайте data URL. Base64 увеличивает размер тела запроса, поэтому в production нужно ограничить размер и формат файла.

\`\`\`python
import base64, mimetypes
from pathlib import Path
path = Path('photo.jpg')
mime = mimetypes.guess_type(path.name)[0] or 'image/jpeg'
encoded = base64.b64encode(path.read_bytes()).decode('ascii')
image_url = f'data:{mime};base64,{encoded}'
\`\`\`

Наиболее распространённые MIME-типы: \`image/jpeg\`, \`image/png\` и \`image/webp\`. Не полагайтесь только на расширение файла: перед отправкой проверьте сигнатуру файла и отклоняйте неподдерживаемые форматы.

## 4. Почему текстовая модель отвечает ошибкой параметров

OpenAI-совместимый протокол описывает форму запроса, но не гарантирует наличие vision-возможностей. Проверьте отдельно текстовую модель, vision-модель и изображения разных размеров. Записывайте ID модели, статус HTTP и задержку ответа: так можно отличить отсутствие поддержки модели от ошибки маршрутизации у провайдера.

## 5. Безопасность и стоимость

Перед отправкой замазывайте документы и персональные данные. Base64 может вызвать ошибку 413, а изображение обычно увеличивает стоимость входных токенов. Не записывайте в логи URL с приватными подписями и не повторяйте запрос автоматически, пока не убедились, что предыдущая попытка не была принята.

Начните с маленького публичного изображения, затем переходите к Base64 и добавляйте в production проверки размера, формата, тайм-аутов и конфиденциальности.`,
    },
  },
  {
    slug: 'ai-api-production-readiness-checklist',
    title: 'AI API 正式上线前检查清单：环境变量、限流、日志与成本告警（2026）',
    summary: '一份适合个人项目和小团队的 AI API 上线清单，覆盖密钥管理、超时重试、429 限流、日志脱敏、预算告警和故障回滚。',
    category: 'guide',
    tags: ['上线检查', 'API稳定性', '限流', '日志安全', '成本控制'],
    content: `开发环境里能成功调用 API，只说明“请求通了”，不代表可以直接承受真实用户流量。上线前建议按密钥、网络、错误处理、观测和成本五个方面逐项检查。

## 1. 密钥和环境变量

- API Key 只放在服务端环境变量，不写入前端代码、提交记录和截图；
- 为开发、测试、生产分别创建密钥，发现泄露时可以只撤销一把；
- 启动时检查变量是否存在，但错误日志不要打印变量值；
- 如果服务商支持权限范围，生产 Key 只保留调用所需权限；
- 轮换密钥时先配置新 Key，再撤销旧 Key，避免发布过程产生空窗。

## 2. 给每个请求设置边界

至少设置三类限制：连接超时、读取超时和最大输出 Token。没有上限的请求可能长期占用连接，也会让一次提示词失控地消耗余额。

建议同时生成自己的 request id，并把它传入日志。用户看到错误时，你可以通过 request id 找到对应的服务商响应，而不必记录完整对话内容。

## 3. 429 和 5xx 的处理规则

429 表示限流，不要立即高频重试。读取服务商返回的 Retry-After，或使用指数退避加随机抖动。502、503、504 可以在尚未收到正文时重试 1-2 次；如果已经收到流式内容，不能把整条请求静默重放。

重试必须设置总预算，例如单个用户请求最多 30 秒、最多 2 次。超过预算后返回清晰的错误信息，并提供切换备用服务商的入口。

## 4. 日志脱敏和告警

日志建议保留：request id、模型 ID、HTTP 状态码、首字节延迟、总耗时、输入输出 Token（如果服务商返回）。应删除或打码：API Key、Authorization 头、完整提示词、用户上传的图片和个人信息。

设置三类告警：5 分钟错误率、429 比例、单日费用。告警阈值不要照搬别人的数字，先观察一周基线，再设置“异常高于基线 2-3 倍”的阈值。

## 5. 成本控制的最小实现

给每个用户或项目设置月度预算，在数据库中记录 provider、model、input_tokens、output_tokens、amount 和 created_at。前端展示余额只能作为提示，真正的拦截必须在服务端完成。

无法取得 Token 用量时，不要假装精确计费。可以按请求次数或字符数做保守估算，并明确标注“估算值”，待服务商账单返回后再校正。

## 6. 健康检查和回滚

健康检查不要发送真实用户内容，使用最短提示词和低成本模型，周期也不要过于频繁。发布新配置前保留上一版 Base URL、模型和超时参数，出现连续错误时可以一键回滚。

## 7. 上线前最后一轮验收

- 新用户、余额不足、无效 Key、429、超时、上游 5xx 都有可读提示；
- 流式和非流式各成功测试一次；
- 重启应用后环境变量仍能正确加载；
- 日志中搜索不到完整 API Key；
- 超预算请求会在服务端被拒绝；
- 备用服务商切换后，模型 ID 和计费单位没有沿用错误配置。

先把这份清单变成发布前的固定流程，再逐步增加自动化监控。对小项目来说，能快速发现错误、控制损失，比一开始搭建复杂平台更重要。`,
    ru: {
      title: 'Чек-лист перед запуском AI API: переменные окружения, лимиты, логи и бюджет (2026)',
      summary: 'Практический чек-лист для запуска AI API в production: ключи, тайм-ауты, повторы, ошибки 429, безопасные логи, бюджет и откат конфигурации.',
      content: `Успешный запрос в разработке означает только то, что соединение работает. Перед реальным трафиком проверьте ключи, сетевые ограничения, обработку ошибок, наблюдаемость и расходы.

## 1. Ключи и переменные окружения

Храните API Key только на сервере, отдельно для разработки, теста и production. При старте проверяйте наличие переменной, но никогда не выводите её значение в лог. Если провайдер поддерживает права, оставьте production-ключу только необходимые разрешения. При ротации сначала добавьте новый ключ, затем отзовите старый.

## 2. Ограничьте каждый запрос

Задайте тайм-аут подключения, тайм-аут чтения и максимальный объём вывода. Без ограничений один запрос может надолго занять соединение и неожиданно израсходовать баланс. Создавайте собственный request id и связывайте его с логами, не записывая полный диалог.

## 3. Правила для 429 и 5xx

429 означает ограничение частоты. Не повторяйте запрос сразу: используйте Retry-After или экспоненциальную задержку со случайным интервалом. Ошибки 502/503/504 можно повторить 1–2 раза, если тело ответа ещё не начало поступать. Для потокового ответа нельзя молча отправлять весь запрос заново после частичного текста.

Ограничьте общий бюджет повтора: например, не более двух попыток и 30 секунд на пользовательский запрос. После этого покажите понятную ошибку или предложите резервного провайдера.

## 4. Безопасные логи и оповещения

Сохраняйте request id, ID модели, HTTP-статус, задержку первого байта, общее время и Token usage, если провайдер его возвращает. Удаляйте API Key, заголовок Authorization, полный prompt, изображения и персональные данные.

Настройте оповещения для доли ошибок, 429 и дневных расходов. Сначала соберите недельную базовую линию, затем используйте порог в 2–3 раза выше обычного уровня.

## 5. Минимальный контроль расходов

Храните provider, model, input_tokens, output_tokens, amount и время запроса. Лимит должен проверяться на сервере, а не только отображаться в браузере. Если Token usage недоступен, показывайте консервативную оценку по запросам или символам и явно называйте её оценкой.

## 6. Проверка доступности и откат

Health check должен использовать короткий недорогой запрос, а не пользовательские данные. Перед публикацией сохраняйте предыдущие Base URL, модель и тайм-ауты, чтобы быстро вернуть рабочую конфигурацию при серии ошибок.

Перед запуском проверьте успешный потоковый и обычный запрос, поведение при неверном ключе, нехватке баланса, 429, тайм-ауте и 5xx. После перезапуска переменные должны загрузиться снова, а в логах не должно находиться полного ключа.`,
    },
  },
]

for (const article of articles) {
  const { ru, ...base } = article
  const { data: existing, error: findError } = await supabase.from('articles').select('id').eq('slug', base.slug).maybeSingle()
  if (findError) throw findError
  let articleId = existing?.id
  if (articleId) {
    const { error } = await supabase.from('articles').update({ ...base, status: 'published', published_at: now, updated_at: now }).eq('id', articleId)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('articles').insert({ ...base, status: 'published', published_at: now, created_at: now, updated_at: now }).select('id').single()
    if (error) throw error
    articleId = data.id
  }
  const translationRows = [
    { resource_type: 'article', resource_id: articleId, locale: 'ru', field: 'title', value: ru.title },
    { resource_type: 'article', resource_id: articleId, locale: 'ru', field: 'summary', value: ru.summary },
    { resource_type: 'article', resource_id: articleId, locale: 'ru', field: 'content', value: ru.content },
  ]
  const { error: translationError } = await supabase.from('translations').upsert(translationRows, { onConflict: 'resource_type,resource_id,locale,field' })
  if (translationError) throw translationError
  console.log(`${base.slug}: ${articleId}`)
}
