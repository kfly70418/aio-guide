import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateSEOMetadata } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'
import { getDictionary } from '@/lib/i18n/utils'
import { locales, type Locale } from '@/lib/i18n/config'

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = await params

  if (locale === 'ru') {
    return generateSEOMetadata({
      title: 'Методология оценки',
      description: 'Подробное описание методов сбора данных, процессов проверки и критериев оценки нашего сайта для обеспечения точности и надежности информации',
      path: '/ru/methodology',
    })
  }

  return generateSEOMetadata({
    title: '评测方法',
    description: '详细介绍本站的数据收集方法、核验流程和评价标准，保证信息的准确性和可靠性',
    path: '/methodology',
  })
}

export default async function MethodologyPage({ params }: { params: { locale: string } }) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  // 根据语言选择内容
  const content = locale === 'ru' ? {
    title: 'Методология оценки',
    corePrinciples: 'Основные принципы',
    principle1Title: 'Реальность',
    principle1Desc: 'Все данные должны быть основаны на реальных данных с официальных сайтов провайдеров или проверены вручную.',
    principle2Title: 'Своевременность',
    principle2Desc: 'Регулярное обновление данных для обеспечения актуальности и точности информации.',
    principle3Title: 'Объективность',
    principle3Desc: 'Сохранение независимой позиции в обзорах, коммерческое сотрудничество не влияет на результаты оценки.',
    dataCollection: 'Сбор данных',
    dataCollectionDesc: 'Мы собираем следующую информацию о провайдерах:',
    dataItem1: 'Основная информация: название, официальный сайт, дата основания',
    dataItem2: 'Тарифы: минимальное пополнение, комиссии за транзакции, поддержка пробных кредитов',
    dataItem3: 'Поддерживаемые модели: список моделей ИИ и стоимость каждой модели',
    dataItem4: 'Функции обслуживания: выставление счетов, политика возврата, способы оплаты',
    dataItem5: 'Статус проверки: ручная проверка и запись времени проверки',
    verificationProcess: 'Процесс проверки',
    verificationStep1: 'Регистрация аккаунта: регистрация реального тестового аккаунта',
    verificationStep2: 'Проверка функций: проверка всех заявленных функций по очереди',
    verificationStep3: 'Тестирование цен: подтверждение соответствия цен на официальном сайте',
    verificationStep4: 'Опыт обслуживания: оценка скорости реакции и качества обслуживания',
    verificationStep5: 'Запись результатов: документирование результатов проверки и отметка времени проверки',
    evaluationCriteria: 'Критерии оценки',
    priceScore: 'Оценка цен (40%): на основе минимального пополнения, комиссий за транзакции, цен на модели',
    featureScore: 'Полнота функций (30%): выставление счетов, возврат средств, способы оплаты',
    serviceScore: 'Качество обслуживания (20%): скорость реакции, скорость решения проблем',
    stabilityScore: 'Стабильность (10%): время работы, частота сбоев',
    updateFrequency: 'Частота обновлений',
    updateDaily: 'Ежедневные обновления: данные о ценах и доступности моделей',
    updateWeekly: 'Еженедельные обновления: информация о функциях обслуживания и методах оплаты',
    updateMonthly: 'Ежемесячные обновления: повторная проверка полных данных о провайдерах',
    transparencyCommitment: 'Обязательство по прозрачности',
    transparencyItem1: 'Весь коммерческий контент будет четко отмечен',
    transparencyItem2: 'Результаты оценки основаны только на фактах, не зависят от коммерческих факторов',
    transparencyItem3: 'Время проверки отображается на страницах провайдеров',
    transparencyItem4: 'Все цены отображаются в обеих валютах (CNY/USD)',
    transparencyItem5: 'Все внешние ссылки помечаются rel="sponsored" или rel="nofollow"',
    transparencyItem6: 'Статьи-руководства требуют ручного написания с указанием автора и даты публикации',
    helpImprove: 'Помогите нам улучшиться',
    helpImproveDesc: 'Если вы обнаружили ошибки в данных, устаревшую информацию или у вас есть предложения по улучшению оценки, пожалуйста, свяжитесь с нами через',
    helpImproveLink: 'контактную информацию',
    helpImproveEnd: '. Ваши отзывы помогут нам постоянно улучшать методы оценки и качество данных.',
  } : {
    title: '评测方法',
    corePrinciples: '核心原则',
    principle1Title: '真实性',
    principle1Desc: '所有数据必须基于服务商官网的真实数据，或经过人工核验。',
    principle2Title: '时效性',
    principle2Desc: '定期更新数据，确保信息的及时性和准确性。',
    principle3Title: '客观性',
    principle3Desc: '保持独立评测立场，商业合作不影响评测结果。',
    dataCollection: '数据收集',
    dataCollectionDesc: '我们收集以下服务商信息：',
    dataItem1: '基本信息：名称、官网、成立时间',
    dataItem2: '计费信息：最低充值、交易手续费、试用额度支持',
    dataItem3: '支持模型：AI 模型列表及每个模型的定价',
    dataItem4: '服务功能：开票支持、退款政策、支付方式',
    dataItem5: '核验状态：人工核验并记录核验时间',
    verificationProcess: '核验流程',
    verificationStep1: '账号注册：注册真实测试账号',
    verificationStep2: '功能验证：逐一验证所有宣传功能',
    verificationStep3: '价格测试：确认官网定价的准确性',
    verificationStep4: '服务体验：评估响应速度和服务质量',
    verificationStep5: '记录结果：记录核验结果并标注核验时间',
    evaluationCriteria: '评价标准',
    priceScore: '价格评分（40%）：基于最低充值、交易费用、模型定价',
    featureScore: '功能完善度（30%）：开票、退款、支付方式等',
    serviceScore: '服务质量（20%）：响应速度、问题解决效率',
    stabilityScore: '稳定性（10%）：运行时间、故障频率',
    updateFrequency: '更新频率',
    updateDaily: '每日更新：模型价格和可用性数据',
    updateWeekly: '每周更新：服务功能和支付方式信息',
    updateMonthly: '每月更新：重新核验服务商完整数据',
    transparencyCommitment: '透明度承诺',
    transparencyItem1: '所有商业内容都会明确标注',
    transparencyItem2: '评测结果仅基于事实，不受商业因素影响',
    transparencyItem3: '核验时间显示在服务商页面',
    transparencyItem4: '所有价格均显示双币种（CNY/USD）',
    transparencyItem5: '所有外部链接都会标注 rel="sponsored" 或 rel="nofollow"',
    transparencyItem6: '教程文章需要人工编写，标注作者和发布日期',
    helpImprove: '帮助我们改进',
    helpImproveDesc: '如果您发现数据错误、过期信息，或者有更好的评测建议，欢迎通过',
    helpImproveLink: '联系方式',
    helpImproveEnd: '反馈给我们。您的反馈将帮助我们持续改进评测方法和数据质量。',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header locale={locale as Locale} dict={dict} />

      <main className="flex-1 py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{content.title}</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.corePrinciples}</h2>
              <div className="prose prose-gray max-w-none">
                <ul className="space-y-4">
                  <li>
                    <strong>{content.principle1Title}：</strong>
                    {content.principle1Desc}
                  </li>
                  <li>
                    <strong>{content.principle2Title}：</strong>
                    {content.principle2Desc}
                  </li>
                  <li>
                    <strong>{content.principle3Title}：</strong>
                    {content.principle3Desc}
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.dataCollection}</h2>
              <p className="text-gray-700 mb-4">{content.dataCollectionDesc}</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.dataItem1}</li>
                <li>{content.dataItem2}</li>
                <li>{content.dataItem3}</li>
                <li>{content.dataItem4}</li>
                <li>{content.dataItem5}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.verificationProcess}</h2>
              <ol className="space-y-3 text-gray-700 list-decimal list-inside">
                <li>{content.verificationStep1}</li>
                <li>{content.verificationStep2}</li>
                <li>{content.verificationStep3}</li>
                <li>{content.verificationStep4}</li>
                <li>{content.verificationStep5}</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.evaluationCriteria}</h2>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.priceScore}</li>
                <li>{content.featureScore}</li>
                <li>{content.serviceScore}</li>
                <li>{content.stabilityScore}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.updateFrequency}</h2>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.updateDaily}</li>
                <li>{content.updateWeekly}</li>
                <li>{content.updateMonthly}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.transparencyCommitment}</h2>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.transparencyItem1}</li>
                <li>{content.transparencyItem2}</li>
                <li>{content.transparencyItem3}</li>
                <li>{content.transparencyItem4}</li>
                <li>{content.transparencyItem5}</li>
                <li>{content.transparencyItem6}</li>
              </ul>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">{content.helpImprove}</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {content.helpImproveDesc}
                <a href={`${basePath}/about`} className="underline mx-1">{content.helpImproveLink}</a>
                {content.helpImproveEnd}
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer locale={locale as Locale} dict={dict} />
    </div>
  )
}
