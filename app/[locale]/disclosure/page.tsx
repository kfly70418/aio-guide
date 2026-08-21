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
      title: 'Коммерческая информация',
      description: 'Раскрытие информации о коммерческом сотрудничестве, партнерских отношениях и источниках дохода сайта',
      path: '/ru/disclosure',
    })
  }

  return generateSEOMetadata({
    title: '商业信息',
    description: '披露本站的商业合作、联盟关系和收入来源等信息',
    path: '/disclosure',
  })
}

export default async function DisclosurePage({ params }: { params: { locale: string } }) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const dict = getDictionary(locale as Locale)
  const basePath = locale === 'zh' ? '' : `/${locale}`

  // 根据语言选择内容
  const content = locale === 'ru' ? {
    title: 'Коммерческая информация',
    intro: 'Мы стремимся сохранять прозрачность в отношении коммерческой модели сайта. На этой странице представлена информация о нашем коммерческом сотрудничестве, партнерских отношениях и источниках дохода.',
    affiliateLinks: 'Партнерские ссылки',
    affiliateDesc: 'Некоторые ссылки на провайдеров на этом сайте являются партнерскими ссылками. Когда вы регистрируетесь или совершаете покупку через эти ссылки, мы можем получить комиссию. Это не влияет на наши обзоры и рейтинги.',
    affiliateItem1: 'Все партнерские ссылки помечаются rel="sponsored"',
    affiliateItem2: 'Партнерские отношения не влияют на результаты оценки',
    affiliateItem3: 'Мы оцениваем только на основе фактов и реального опыта',
    affiliateItem4: 'Пользователи не платят дополнительные сборы за переход по партнерским ссылкам',
    sponsored: 'Спонсируемый контент',
    sponsoredDesc: 'Мы можем сотрудничать с некоторыми провайдерами для размещения спонсируемого контента. Весь спонсируемый контент будет четко отмечен.',
    sponsoredItem1: 'Спонсируемые статьи отмечаются как "Спонсировано"',
    sponsoredItem2: 'Спонсируемые провайдеры отмечаются как "Партнер"',
    sponsoredItem3: 'Спонсируемый контент не влияет на результаты оценки',
    sponsoredItem4: 'Мы сохраняем независимость редакции',
    revenue: 'Источники дохода',
    revenueDesc: 'Основные источники дохода сайта включают:',
    revenueItem1: 'Комиссии с партнерских ссылок',
    revenueItem2: 'Спонсируемый контент и реклама',
    revenueItem3: 'Сервисы платного размещения',
    independence: 'Редакционная независимость',
    independenceDesc: 'Несмотря на коммерческое сотрудничество, мы сохраняем полную редакционную независимость:',
    independenceItem1: 'Результаты оценки основаны только на фактах',
    independenceItem2: 'Все данные проходят ручную проверку',
    independenceItem3: 'Коммерческое сотрудничество не влияет на рейтинги',
    independenceItem4: 'Мы сохраняем право удалить спонсируемый контент, не соответствующий стандартам',
    dataPrivacy: 'Конфиденциальность данных',
    dataPrivacyDesc: 'Мы уважаем конфиденциальность пользователей:',
    dataPrivacyItem1: 'Не собираем личные данные пользователей',
    dataPrivacyItem2: 'Используем Google Analytics для отслеживания трафика',
    dataPrivacyItem3: 'Не передаем данные пользователей третьим лицам',
    dataPrivacyItem4: 'Пользователи могут отказаться от отслеживания в любое время',
    updates: 'Обновления',
    updatesDesc: 'Эта страница с раскрытием информации может обновляться. Все важные изменения будут четко обозначены с указанием даты обновления.',
    contact: 'Свяжитесь с нами',
    contactDesc: 'Если у вас есть вопросы о нашей коммерческой модели или партнерских отношениях, свяжитесь с нами через',
  } : {
    title: '商业信息',
    intro: '我们致力于保持商业模式的透明度。本页面披露本站的商业合作、联盟关系和收入来源等信息。',
    affiliateLinks: '联盟链接',
    affiliateDesc: '本站部分服务商链接为联盟链接。当您通过这些链接注册或购买服务时，我们可能获得佣金。这不会影响我们的评测和排名。',
    affiliateItem1: '所有联盟链接都会标注 rel="sponsored"',
    affiliateItem2: '联盟关系不影响评测结果',
    affiliateItem3: '我们仅基于事实和真实体验进行评测',
    affiliateItem4: '用户通过联盟链接不会支付额外费用',
    sponsored: '赞助内容',
    sponsoredDesc: '我们可能与部分服务商合作发布赞助内容。所有赞助内容都会明确标注。',
    sponsoredItem1: '赞助文章会标注"赞助"字样',
    sponsoredItem2: '赞助服务商会标注"合作伙伴"标识',
    sponsoredItem3: '赞助内容不影响评测结果',
    sponsoredItem4: '我们保持编辑独立性',
    revenue: '收入来源',
    revenueDesc: '本站主要收入来源包括：',
    revenueItem1: '联盟链接佣金',
    revenueItem2: '赞助内容和广告',
    revenueItem3: '付费推广服务',
    independence: '编辑独立性',
    independenceDesc: '尽管存在商业合作，我们保持完全的编辑独立性：',
    independenceItem1: '评测结果仅基于事实',
    independenceItem2: '所有数据经过人工核验',
    independenceItem3: '商业合作不影响排名',
    independenceItem4: '我们保留删除不符合标准的赞助内容的权利',
    dataPrivacy: '数据隐私',
    dataPrivacyDesc: '我们尊重用户隐私：',
    dataPrivacyItem1: '不收集用户个人信息',
    dataPrivacyItem2: '使用 Google Analytics 进行流量统计',
    dataPrivacyItem3: '不向第三方出售用户数据',
    dataPrivacyItem4: '用户可随时选择退出跟踪',
    updates: '更新说明',
    updatesDesc: '本披露页面可能更新。所有重要变更都会明确标注并注明更新日期。',
    contact: '联系我们',
    contactDesc: '如果您对我们的商业模式或联盟关系有任何疑问，欢迎通过',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header locale={locale as Locale} dict={dict} />

      <main className="flex-1 py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{content.title}</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            <p className="text-gray-700 leading-relaxed">{content.intro}</p>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.affiliateLinks}</h2>
              <p className="text-gray-700 mb-4">{content.affiliateDesc}</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.affiliateItem1}</li>
                <li>{content.affiliateItem2}</li>
                <li>{content.affiliateItem3}</li>
                <li>{content.affiliateItem4}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.sponsored}</h2>
              <p className="text-gray-700 mb-4">{content.sponsoredDesc}</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.sponsoredItem1}</li>
                <li>{content.sponsoredItem2}</li>
                <li>{content.sponsoredItem3}</li>
                <li>{content.sponsoredItem4}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.revenue}</h2>
              <p className="text-gray-700 mb-4">{content.revenueDesc}</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.revenueItem1}</li>
                <li>{content.revenueItem2}</li>
                <li>{content.revenueItem3}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.independence}</h2>
              <p className="text-gray-700 mb-4">{content.independenceDesc}</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.independenceItem1}</li>
                <li>{content.independenceItem2}</li>
                <li>{content.independenceItem3}</li>
                <li>{content.independenceItem4}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.dataPrivacy}</h2>
              <p className="text-gray-700 mb-4">{content.dataPrivacyDesc}</p>
              <ul className="space-y-2 text-gray-700 list-disc list-inside">
                <li>{content.dataPrivacyItem1}</li>
                <li>{content.dataPrivacyItem2}</li>
                <li>{content.dataPrivacyItem3}</li>
                <li>{content.dataPrivacyItem4}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{content.updates}</h2>
              <p className="text-gray-700">{content.updatesDesc}</p>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">{content.contact}</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                {content.contactDesc}
                <a href={`${basePath}/about`} className="underline mx-1">{locale === 'ru' ? 'контактную информацию' : '联系方式'}</a>
                {locale === 'ru' ? '.' : '联系我们。'}
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer locale={locale as Locale} dict={dict} />
    </div>
  )
}
