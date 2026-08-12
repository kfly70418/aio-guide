import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'
import { Header, Footer } from '@/components/layout/PublicLayout'

export const metadata: Metadata = generateSEOMetadata({
  title: '评测方法',
  description: '详细介绍本站的数据收集方法、核验流程和评价标准，保证信息的准确性和可靠性',
  path: '/methodology',
})

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">评测方法</h1>

          <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">核心原则</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  本站坚持<strong>人工核验</strong>原则，所有数据由人工录入和定期核验，不做自动抓取或实时监控。
                  我们相信，真实的人工体验比自动化数据更有参考价值。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">数据收集流程</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">服务商发现</h3>
                    <p className="text-gray-700 leading-relaxed">
                      通过以下渠道发现潜在服务商：
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                      <li>用户推荐和反馈</li>
                      <li>行业论坛和社群</li>
                      <li>搜索引擎调研</li>
                      <li>同行网站参考</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">基础信息收集</h3>
                    <p className="text-gray-700 leading-relaxed">
                      访问服务商官网，记录以下基础信息：
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                      <li>服务商名称（中英文）</li>
                      <li>官网地址</li>
                      <li>服务简介和特色</li>
                      <li>支持的模型列表</li>
                      <li>价格信息（输入价/输出价）</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">实际注册体验</h3>
                    <p className="text-gray-700 leading-relaxed">
                      对于重点服务商，我们会实际注册并测试：
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                      <li>注册流程的便捷性</li>
                      <li>最低充值门槛</li>
                      <li>是否有注册赠送</li>
                      <li>充值方式和手续费</li>
                      <li>是否支持开具发票</li>
                      <li>实际使用体验</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">信息录入和发布</h3>
                    <p className="text-gray-700 leading-relaxed">
                      将收集到的信息录入系统，并标注<strong>核验时间</strong>。
                      初次录入后，信息会经过内部审核才会发布。
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">定期核验更新</h3>
                    <p className="text-gray-700 leading-relaxed">
                      已发布的信息会定期回访核验：
                    </p>
                    <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                      <li>核验频率：通常 30 天一次</li>
                      <li>重点核验：价格变动、服务调整、网站状态</li>
                      <li>超过 30 天未核验的数据会在页面上标注"已过期"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">推荐标准</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  获得"推荐"标识的服务商需要满足以下条件：
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 价格合理</h4>
                    <p className="text-sm text-gray-600">
                      模型价格在市场平均水平或以下，性价比高
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 服务稳定</h4>
                    <p className="text-sm text-gray-600">
                      运营时间较长，用户反馈良好，无重大事故
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 支付便捷</h4>
                    <p className="text-sm text-gray-600">
                      充值门槛低，支持多种支付方式
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">✓ 信息透明</h4>
                    <p className="text-sm text-gray-600">
                      官网信息完整，价格公开，服务条款清晰
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">核验时间说明</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  每条信息都会标注<strong>最后人工核验时间</strong>，这是我们保证数据准确性的重要机制：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
                  <li>
                    <strong>核验时间</strong> = 最后一次人工确认该信息准确的时间
                  </li>
                  <li>
                    <strong>非实时监控</strong> = 我们不做自动化监控，所有核验都是人工进行
                  </li>
                  <li>
                    <strong>过期提醒</strong> = 超过 30 天未核验的数据会在页面上显示黄色警告
                  </li>
                  <li>
                    <strong>以官网为准</strong> = 价格和服务随时可能变动，使用前请访问官网确认
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">我们不做的事</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <ul className="text-sm text-red-900 space-y-2 leading-relaxed">
                  <li>• <strong>不做实时监控：</strong>我们不会自动抓取服务商数据或监控可用率</li>
                  <li>• <strong>不做性能测试：</strong>不提供速度、延迟等量化性能指标</li>
                  <li>• <strong>不做安全审计：</strong>不对服务商的技术架构和安全措施进行审计</li>
                  <li>• <strong>不做信用背书：</strong>推荐不代表担保，使用风险需自行评估</li>
                  <li>• <strong>不做批量内容：</strong>拒绝只改名称、无实际价值的批量生成页面</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">数据更新机制</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  为保证数据时效性，我们采用以下更新机制：
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong className="text-gray-900">主动更新：</strong>
                      <span className="text-gray-700">运营团队定期回访核验，更新价格和服务信息</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong className="text-gray-900">用户反馈：</strong>
                      <span className="text-gray-700">接受用户提交的信息更新和错误纠正</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <strong className="text-gray-900">服务商申请：</strong>
                      <span className="text-gray-700">服务商可主动联系我们更新信息</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">质量控制</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  为保证内容质量，我们设置了以下门槛：
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>服务商必须有完整的简介（至少 20 字），简介不足的不会出现在搜索引擎中</li>
                  <li>价格信息必须明确标注货币单位（CNY/USD）</li>
                  <li>所有外部链接都会标注 rel="sponsored" 或 rel="nofollow"</li>
                  <li>教程文章需要人工编写，标注作者和发布日期</li>
                </ul>
              </div>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">帮助我们改进</h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                如果您发现数据错误、过期信息，或者有更好的评测建议，欢迎通过
                <a href="/about" className="underline mx-1">联系方式</a>
                反馈给我们。您的反馈将帮助我们持续改进评测方法和数据质量。
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
