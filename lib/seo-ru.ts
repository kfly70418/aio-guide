// 俄语SEO关键词和描述优化
export const ruKeywords = {
  home: {
    keywords: [
      'API сервисы',
      'API GPT',
      'API Claude',
      'OpenAI API',
      'Anthropic API',
      'сравнение API',
      'цены на API',
      'русский API',
      'нейросети API',
      'искусственный интеллект API'
    ],
    description: 'Сравнение цен и качества API сервисов для GPT, Claude, Gemini и других моделей ИИ. Проверенные данные, русскоязычная поддержка, актуальные тарифы.'
  },
  providers: {
    keywords: [
      'провайдеры API',
      'сервисы GPT',
      'реселлеры OpenAI',
      'Claude API русский',
      'где купить API',
      'дешевый GPT API',
      'надежный API сервис'
    ],
    description: 'Рейтинг и сравнение провайдеров API для моделей GPT, Claude, Gemini. Проверенные сервисы с русскоязычной поддержкой и выгодными тарифами.'
  },
  models: {
    keywords: [
      'модели GPT',
      'Claude модели',
      'Gemini API',
      'сравнение моделей',
      'GPT-5',
      'Claude Opus 5',
      'цены на модели',
      'характеристики моделей ИИ'
    ],
    description: 'Подробное сравнение моделей искусственного интеллекта: GPT-5, Claude Opus 5, Gemini и другие. Характеристики, цены, области применения.'
  },
  articles: {
    keywords: [
      'обучение API',
      'гайды GPT',
      'как использовать API',
      'интеграция ИИ',
      'примеры использования',
      'документация API',
      'туториалы нейросети'
    ],
    description: 'Статьи, руководства и новости о работе с API моделей искусственного интеллекта. Практические примеры, советы по интеграции, обзор возможностей.'
  }
}

// Yandex Metrica конфигурация
export const yandexMetricaConfig = {
  id: '', // Заполнить ID счетчика Yandex Metrica
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  ecommerce: 'dataLayer'
}

// Структурированные данные для русского языка
export function generateRuBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  }
}

export function generateRuServiceSchema(provider: {
  name: string
  description: string
  url: string
  features: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'name': provider.name,
    'description': provider.description,
    'url': provider.url,
    'serviceType': 'API Сервис',
    'provider': {
      '@type': 'Organization',
      'name': provider.name
    },
    'areaServed': {
      '@type': 'Country',
      'name': 'Россия'
    },
    'availableLanguage': ['ru', 'en'],
    'audience': {
      '@type': 'Audience',
      'audienceType': 'Разработчики'
    }
  }
}

export function generateRuFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  }
}

export function generateRuArticleSchema(article: {
  title: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified: string
  author?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.description,
    'url': article.url,
    'image': article.image,
    'datePublished': article.datePublished,
    'dateModified': article.dateModified,
    'author': {
      '@type': 'Person',
      'name': article.author || 'Редакция'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'API Guide',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.apixuan.com/logo.svg'
      }
    },
    'inLanguage': 'ru'
  }
}

export function generateRuWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Выбор API',
    'url': 'https://www.apixuan.com/ru',
    'description': 'Рейтинг и сравнение API-прокси для моделей ИИ, цены и практические руководства.',
    'inLanguage': 'ru-RU',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://www.apixuan.com/ru/providers?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  }
}

export function generateRuOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'API Guide',
    'alternateName': 'Гид по API сервисам',
    'url': 'https://www.apixuan.com/ru',
    'logo': 'https://www.apixuan.com/logo.svg',
    'description': 'Рейтинг и сравнение API-прокси для моделей искусственного интеллекта, цены и практические руководства.',
    'sameAs': [
      // Добавить ссылки на социальные сети
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Поддержка клиентов',
      'availableLanguage': ['ru', 'zh', 'en']
    }
  }
}
