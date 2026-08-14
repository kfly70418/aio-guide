import Link from 'next/link'
import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { generateSEOMetadata, generateBreadcrumbSchema, generateItemListSchema } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'

export const metadata: Metadata = generateSEOMetadata({
  title: '模型价格对比',
  description:
    '对比 GPT、Claude、Gemini、Grok 等主流 AI 大模型在各家 API 中转站的价格，同一模型逐条渠道直接比价，数据人工核验。',
  path: '/models',
})

export const revalidate = 300

const FAMILY_ORDER = ['GPT', 'Claude', 'Gemini', 'Grok']
const FAMILY_LABEL: Record<string, string> = {
  GPT: 'OpenAI · GPT 系列',
  Claude: 'Anthropic · Claude 系列',
  Gemini: 'Google · Gemini 系列',
  Grok: 'xAI · Grok 系列',
}

export default async function ModelsPage() {
  const supabase = createPublicClient()

  const { data: models } = await supabase
    .from('models')
    .select('id, slug, name, family, description, official_price_input, official_price_output')
    .eq('status', 'published')
    .order('sort_order', { ascending: false })

  // 统计每个模型有多少条在售报价，用于展示"N 家可用"
  const { data: priceRows } = await supabase
    .from('prices')
    .select('model_id')
    .eq('status', 'active')

  const priceCount = new Map<string, number>()
  for (const row of priceRows ?? []) {
    if (!row.model_id) continue
    priceCount.set(row.model_id, (priceCount.get(row.model_id) ?? 0) + 1)
  }

  const groups = FAMILY_ORDER.map((family) => ({
    family,
    label: FAMILY_LABEL[family] ?? family,
    items: (models ?? []).filter((m) => m.family === family),
  })).filter((g) => g.items.length > 0)

  // 其余未列入排序表的家族兜底
  const knownFamilies = new Set(FAMILY_ORDER)
  const others = (models ?? []).filter((m) => !knownFamilies.has(m.family ?? ''))
  if (others.length > 0) {
    groups.push({ family: 'other', label: '其他模型', items: others })
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '模型价格对比', url: '/models' },
  ])

  const itemListSchema = generateItemListSchema({
    name: '模型价格对比',
    description: '主流 AI 大模型在各家中转站的价格对比',
    url: '/models',
    items: (models ?? []).map((m) => ({
      name: m.name,
      url: `/models/${m.slug}`,
      description: m.description || undefined,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex mb-6 text-sm" aria-label="面包屑">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-blue-600">
                    首页
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400 mx-2">/</span>
                </li>
                <li className="text-gray-900">模型价格对比</li>
              </ol>
            </nav>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">模型价格对比</h1>
              <p className="text-gray-600">
                共收录 {models?.length ?? 0} 个模型。点击任一模型，查看它在各家中转站的逐条渠道报价。
                所有价格由人工录入并标注核验时间，以服务商官网实际计费为准。
              </p>
            </div>

            {groups.length > 0 ? (
              <div className="space-y-8">
                {groups.map((group) => (
                  <section key={group.family}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{group.label}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((model) => {
                        const count = priceCount.get(model.id) ?? 0
                        return (
                          <Link
                            key={model.id}
                            href={`/models/${model.slug}`}
                            className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {model.name}
                              </h3>
                              {count > 0 && (
                                <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                                  {count} 条报价
                                </span>
                              )}
                            </div>

                            {model.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {model.description}
                              </p>
                            )}

                            {(model.official_price_input != null ||
                              model.official_price_output != null) && (
                              <p className="text-xs text-gray-500">
                                官方价：
                                {model.official_price_input != null && (
                                  <span>输入 ${Number(model.official_price_input).toFixed(2)}</span>
                                )}
                                {model.official_price_input != null &&
                                  model.official_price_output != null && <span> · </span>}
                                {model.official_price_output != null && (
                                  <span>输出 ${Number(model.official_price_output).toFixed(2)}</span>
                                )}
                                <span className="text-gray-400"> /M tokens</span>
                              </p>
                            )}

                            <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600">
                              查看各家报价
                              <span aria-hidden="true">→</span>
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500">暂无已发布的模型</p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
