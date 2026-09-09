import Link from 'next/link'

export function Gpt6Availability({ features, locale = 'zh' }: {
  features?: unknown
  locale?: string
}) {
  const listed = Array.isArray(features) && features.some(
    (feature) => typeof feature === 'string' && /GPT-6 Astra/i.test(feature)
  )
  const ru = locale === 'ru'

  return (
    <div className="my-5 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-sm leading-6">
      <p className="font-medium text-gray-900">
        GPT-6 Astra · {listed
          ? (ru ? 'Есть в каталоге провайдера' : '官网已列出')
          : (ru ? 'Поддержка пока не проверена' : '支持情况待核验')}
      </p>
      <p className="mt-1 text-gray-600">
        {listed
          ? (ru
            ? 'Модель найдена в публичном каталоге провайдера. Это не подтверждает результат тестового вызова. Перед пополнением уточните идентификатор модели, доступ для вашего аккаунта и тариф.'
            : '已在服务商公开模型目录中查到该型号，尚不代表完成调用实测。充值前请确认模型 ID、账户可用渠道和实际计费。')
          : (ru
            ? 'Поддержка других моделей GPT не гарантирует доступ к GPT-6 Astra. Перед пополнением уточните наличие модели и условия доступа у провайдера.'
            : '支持其他 GPT 型号不代表已支持 GPT-6 Astra。充值前请向服务商确认该型号是否可用及接入条件。')}
      </p>
      <Link href={`${ru ? '/ru' : ''}/models/gpt-6-astra`} className="mt-2 inline-block text-blue-700 hover:underline">
        {ru ? 'О модели GPT-6 Astra и ценах →' : '查看 GPT-6 Astra 模型与价格信息 →'}
      </Link>
    </div>
  )
}
