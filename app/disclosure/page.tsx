import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'

export const metadata: Metadata = generateSEOMetadata({
  title: '商业合作披露',
  description: '透明披露本站的商业合作关系、收入来源和利益冲突管理机制',
  path: '/disclosure',
})

export default function DisclosurePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">商业合作披露</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-900 leading-relaxed">
                <strong>透明原则：</strong>
                本站相信透明是建立信任的基础。我们在此完整披露所有商业合作关系和收入来源，
                帮助用户了解可能存在的利益冲突，并自行判断信息的客观性。
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">收入来源</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">1. 推广佣金</h3>
                  <p className="text-gray-700 leading-relaxed">
                    部分服务商与本站有推广合作关系。当用户通过本站的链接注册并充值后，
                    我们可能获得一定比例的推广佣金。
                  </p>
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>标识方式：</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>详情页会明确标注"本站与该服务商存在推广合作关系"</li>
                      <li>推广链接使用 rel="sponsored" 标记</li>
                      <li>有推广合作的服务商会在详情页侧边栏显示"商业合作"提示</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">2. 展示广告（计划中）</h3>
                  <p className="text-gray-700 leading-relaxed">
                    未来可能在网站上展示第三方广告，广告会明确标注"广告"字样，与正常内容区分。
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>当前状态：</strong>尚未启用
                  </p>
                </div>

                <div className="border-l-4 border-gray-400 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">3. 赞助和捐赠（计划中）</h3>
                  <p className="text-gray-700 leading-relaxed">
                    未来可能接受用户捐赠或企业赞助，用于支付服务器成本和运营费用。
                    所有赞助商会在本页面公开列出。
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>当前状态：</strong>尚未启用
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">合作服务商列表</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  以下服务商与本站存在推广合作关系（持续更新）：
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <p className="text-gray-600 text-sm">
                    当前暂无正式合作的服务商。本站刚刚上线，正在逐步建立合作关系。
                    一旦有合作服务商，会在此列表中公开披露。
                  </p>
                  <p className="text-gray-600 text-sm mt-3">
                    <strong>更新时间：</strong>2026年8月12日
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">独立性声明</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  尽管存在商业合作关系，本站承诺：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-3 mt-4">
                  <li>
                    <strong>评测独立：</strong>
                    不会因为推广合作而给予不实的好评，也不会因为没有合作而故意贬低
                  </li>
                  <li>
                    <strong>数据真实：</strong>
                    所有价格、服务信息均来自实际调研和核验，不会因利益关系而篡改
                  </li>
                  <li>
                    <strong>推荐客观：</strong>
                    "推荐"标识的评选标准公开透明，符合条件即可获得，不与商业合作挂钩
                  </li>
                  <li>
                    <strong>风险提示：</strong>
                    无论是否有合作关系，所有服务商的详情页都会展示风险提示
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">利益冲突管理</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">内容审核</h3>
                  <p className="text-gray-700 leading-relaxed">
                    所有内容在发布前都会经过审核，确保事实准确、描述客观，不夸大不隐瞒。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">用户反馈</h3>
                  <p className="text-gray-700 leading-relaxed">
                    接受用户对不实信息的举报和反馈，核实后会及时更正。
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">定期复核</h3>
                  <p className="text-gray-700 leading-relaxed">
                    定期回访所有服务商，更新信息，确保推广合作不影响数据准确性。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">合作政策</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  如果您是服务商，希望与本站合作，请注意：
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <ul className="text-sm text-yellow-900 space-y-2 leading-relaxed">
                    <li>• 合作不能影响评测的独立性和客观性</li>
                    <li>• 合作关系必须在网站上公开披露</li>
                    <li>• 不接受要求删除负面信息或只展示正面内容的合作</li>
                    <li>• 不接受要求保证排名或评价的合作</li>
                    <li>• 合作方的服务质量问题需要自行负责，本站不承担连带责任</li>
                  </ul>
                </div>
                <p className="text-gray-700 leading-relaxed mt-4">
                  如有合作意向，请通过<a href="/about" className="text-blue-600 hover:underline">联系方式</a>与我们沟通。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">费用说明</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  本站对用户完全免费，不收取任何费用。用户可以：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                  <li>免费浏览所有服务商信息</li>
                  <li>免费阅读所有教程和评测文章</li>
                  <li>免费使用搜索和筛选功能</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  如果您通过本站链接注册服务商，支付的费用完全归服务商所有，
                  本站仅可能从服务商处获得推广佣金，<strong>不会向用户额外收费</strong>。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">数据使用</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  本站收集的用户数据仅用于：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                  <li>改进网站功能和用户体验</li>
                  <li>统计访问量和使用习惯（匿名）</li>
                  <li>防止恶意行为和滥用</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  我们<strong>不会</strong>：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2">
                  <li>出售用户数据给第三方</li>
                  <li>与服务商分享用户的个人信息</li>
                  <li>发送营销邮件或广告推送</li>
                </ul>
              </div>
            </section>

            <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">更新说明</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                本页面会随着商业合作关系的变化而更新。每次更新都会在页面底部标注更新时间。
                如果您对商业合作有任何疑问，欢迎通过<a href="/about" className="text-blue-600 hover:underline">联系方式</a>与我们沟通。
              </p>
              <p className="text-sm text-gray-500 mt-4">
                <strong>最后更新时间：</strong>2026年8月12日
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
