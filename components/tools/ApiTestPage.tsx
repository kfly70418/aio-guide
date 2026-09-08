import Link from 'next/link'
import { CheckCircle2, Gauge, ShieldCheck } from 'lucide-react'
import { Header, Footer } from '@/components/layout/PublicLayout'
import Breadcrumb from '@/components/Breadcrumb'
import { ApiTestForm } from '@/components/tools/ApiTestForm'
import { getDictionary } from '@/lib/i18n/utils'
import type { Locale } from '@/lib/i18n/config'
import { SITE_URL } from '@/lib/constants'

const pageCopy = {
  zh: {
    title: 'AI API 在线连通性检测',
    description: '用一次最小对话请求检查中转站 API 是否能够连接，并查看 HTTP 状态、响应时间和实际返回的模型名称。',
    breadcrumb: 'API 在线检测',
    readingTitle: '检测结果怎么看',
    readings: [
      ['连接状态', 'HTTP 200 且返回标准对话内容，表示接口当前能够正常响应。'],
      ['响应时间', '耗时受网络、模型负载和线路影响，单次结果只代表检测当时状态。'],
      ['模型名称', '名称一致只能说明接口声明相符，不能单独作为模型真伪的最终证明。'],
    ],
    safetyTitle: '使用临时 Key 更安全',
    safetyText: '建议在服务商后台新建一个低额度临时 Key，完成检测后立即删除。本站不会保存 Key，但服务商仍可能按正常请求计费。',
    guide: '查看 API 接入与错误排查教程',
    faqTitle: '常见问题',
    faqs: [
      ['这个检测会扣费吗？', '会向填写的接口发送一次很短的对话请求，通常只消耗少量 Token，实际费用以服务商计费规则为准。'],
      ['为什么地址正确仍然检测失败？', '常见原因包括 Key 权限不足、模型名称错误、额度不足、服务商限流，或接口不是 OpenAI Chat Completions 兼容格式。'],
      ['能通过结果判断模型真假吗？', '不能完全判断。本工具只显示接口返回的模型名称与基础响应，模型真实性还需要结合输出质量、上下文能力和服务商信誉综合判断。'],
    ],
  },
  ru: {
    title: 'Онлайн-проверка подключения к AI API',
    description: 'Проверьте доступность API-прокси одним минимальным запросом: HTTP-статус, время ответа и название модели в ответе.',
    breadcrumb: 'Проверка API',
    readingTitle: 'Как читать результат',
    readings: [
      ['Статус подключения', 'HTTP 200 и стандартный ответ чата означают, что API доступен в момент проверки.'],
      ['Время ответа', 'Задержка зависит от сети, нагрузки модели и маршрута. Один тест отражает только текущее состояние.'],
      ['Название модели', 'Совпадение названий подтверждает только данные ответа и само по себе не доказывает подлинность модели.'],
    ],
    safetyTitle: 'Используйте временный ключ',
    safetyText: 'Создайте отдельный ключ с небольшим лимитом и удалите его после проверки. Сайт не сохраняет ключ, но провайдер может списать обычную плату за запрос.',
    guide: 'Открыть руководства по настройке и ошибкам API',
    faqTitle: 'Частые вопросы',
    faqs: [
      ['Проверка платная?', 'Инструмент отправляет один короткий запрос и расходует небольшое число токенов. Итоговая стоимость зависит от тарифа провайдера.'],
      ['Почему проверка не проходит при правильном адресе?', 'Возможные причины: недостаточные права ключа, неверный ID модели, нулевой баланс, ограничение частоты или несовместимый формат API.'],
      ['Можно ли определить подлинность модели?', 'Не полностью. Инструмент показывает заявленное имя модели и базовый ответ; для оценки подлинности также нужны тесты качества, контекста и репутации сервиса.'],
    ],
  },
} as const

export function ApiTestPage({ locale }: { locale: Locale }) {
  const text = pageCopy[locale]
  const dict = getDictionary(locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`
  const pagePath = `${basePath}/tools/api-test`
  const applicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: text.title,
    description: text.description,
    url: `${SITE_URL}${pagePath}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    inLanguage: locale === 'ru' ? 'ru-RU' : 'zh-CN',
    offers: { '@type': 'Offer', price: '0', priceCurrency: locale === 'ru' ? 'RUB' : 'CNY' },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.nav.home, item: `${SITE_URL}${basePath || '/'}` },
      { '@type': 'ListItem', position: 2, name: text.breadcrumb, item: `${SITE_URL}${pagePath}` },
    ],
  }
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: text.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
  const schemaHtml = (value: object) => JSON.stringify(value).replace(/</g, '\\u003c')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaHtml(applicationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaHtml(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaHtml(faqSchema) }} />
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header locale={locale} dict={dict} />

        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
            <Breadcrumb items={[{ label: dict.nav.home, href: `${basePath}/` }, { label: text.breadcrumb }]} />

            <header className="mb-6 max-w-3xl">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{text.title}</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">{text.description}</p>
            </header>

            <ApiTestForm locale={locale} />

            <section className="mt-10" aria-labelledby="reading-title">
              <h2 id="reading-title" className="text-xl font-bold text-gray-900">{text.readingTitle}</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-3">
                {text.readings.map(([title, description], index) => {
                  const Icon = [CheckCircle2, Gauge, ShieldCheck][index]
                  return (
                    <div key={title} className="border-l-2 border-blue-200 pl-4">
                      <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="mt-10 border-y border-amber-200 bg-amber-50 px-4 py-5 sm:px-6" aria-labelledby="safety-title">
              <h2 id="safety-title" className="text-base font-semibold text-amber-950">{text.safetyTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">{text.safetyText}</p>
              <Link href={`${basePath}/articles`} className="mt-3 inline-flex text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline">
                {text.guide} →
              </Link>
            </section>

            <section className="mt-10" aria-labelledby="faq-title">
              <h2 id="faq-title" className="text-xl font-bold text-gray-900">{text.faqTitle}</h2>
              <div className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
                {text.faqs.map(([question, answer]) => (
                  <div key={question} className="py-5">
                    <h3 className="text-sm font-semibold text-gray-900">{question}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>

        <Footer locale={locale} dict={dict} />
      </div>
    </>
  )
}
