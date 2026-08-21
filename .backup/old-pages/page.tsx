import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'

export const metadata: Metadata = generateSEOMetadata({
  title: '关于我们',
  description: '了解 API 中转站精选导航的建站初衷、运营理念和团队介绍',
  path: '/about',
})

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">关于我们</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">建站初衷</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  随着 AI 大模型的普及，市场上出现了大量的 API 中转服务商。然而，这些服务商的价格、稳定性、服务质量参差不齐，
                  用户很难在短时间内找到适合自己的服务。
                </p>
                <p className="text-gray-700 leading-relaxed mt-4">
                  我们创建这个导航站，希望通过<strong>人工核验</strong>的方式，为用户提供真实、可靠的中转站信息，
                  帮助大家节省选择时间，降低试错成本。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">运营理念</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">人工核验，拒绝自动抓取</h3>
                    <p className="text-gray-600">
                      所有数据由人工录入和核验，并标注最后核验时间。我们不做实时监控或自动抓取，
                      确保每条信息都经过人工确认。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">价格透明，对比清晰</h3>
                    <p className="text-gray-600">
                      整理各家中转站的模型价格，方便用户横向对比，找到性价比最高的选择。
                      所有价格均标注核验时间，提醒用户以官网为准。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">内容为王，拒绝批量</h3>
                    <p className="text-gray-600">
                      我们不发布只有名称替换、没有新增价值的批量页面。每篇教程、每个评测都经过人工编写和审核，
                      确保内容质量。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">透明披露，独立立场</h3>
                    <p className="text-gray-600">
                      我们会明确披露与服务商的商业合作关系。有推广合作的服务商会在详情页标注，
                      保持评测的独立性和客观性。详见<a href="/disclosure" className="text-blue-600 hover:underline">商业合作披露</a>。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">数据来源</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  本站数据主要来源于：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
                  <li>服务商官网公开信息</li>
                  <li>实际注册和使用体验</li>
                  <li>用户反馈和建议</li>
                  <li>行业公开资料</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  所有数据定期核验更新，超过 30 天未核验的数据会在页面上提示过期。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">免责声明</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <ul className="text-sm text-yellow-900 space-y-2 leading-relaxed">
                  <li>• 本站仅提供信息整理和导航服务，不提供 API 中转服务本身</li>
                  <li>• 所有价格和服务信息仅供参考，请以服务商官网为准</li>
                  <li>• 使用第三方中转服务存在数据隐私风险，请谨慎选择</li>
                  <li>• 本站不对服务商的服务质量、稳定性、数据安全负责</li>
                  <li>• 充值前请了解退款政策，避免不必要的损失</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">联系我们</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  如果您有以下需求，欢迎联系我们：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-3">
                  <li>发现数据错误或过期信息</li>
                  <li>推荐优质中转站</li>
                  <li>商业合作咨询</li>
                  <li>其他建议和反馈</li>
                </ul>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>邮箱：</strong>
                    <a href="mailto:kfly70418@gmail.com" className="text-blue-600 hover:underline ml-2">
                      kfly70418@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
