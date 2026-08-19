import { Metadata } from 'next';
import Link from 'next/link';
import { generateSEOMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';

// FAQ 数据结构
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'usage' | 'safety' | 'technical' | 'pricing' | 'comparison';
  keywords: string[];
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'how-to-use-api-relay',
    question: 'API 中转站怎么用？',
    answer: `使用 API 中转站的基本步骤：

1. **注册账号**：访问中转站官网，使用邮箱或手机号注册
2. **充值获取额度**：选择合适的充值金额，支持微信/支付宝/USDT
3. **获取 API Key**：在控制台创建 API 密钥
4. **配置应用**：将官方 API 地址替换为中转站地址，填入你的 Key
5. **开始使用**：像使用官方 API 一样调用即可

示例配置（以 OpenAI SDK 为例）：
\`\`\`python
from openai import OpenAI

client = OpenAI(
    api_key="your-relay-api-key",
    base_url="https://api.relay-provider.com/v1"  # 中转站地址
)
\`\`\``,
    category: 'usage',
    keywords: ['api中转站怎么用', 'api中转站使用教程', '如何使用中转站'],
  },
  {
    id: 'why-use-relay',
    question: '为什么要用 API 中转站？',
    answer: `使用 API 中转站的主要原因：

**1. 解决网络问题**
- 国内直连，无需魔法上网
- 低延迟，访问速度快

**2. 降低使用门槛**
- 无需国外信用卡
- 支持国内支付方式
- 最低充值 10 元起

**3. 成本优化**
- 多个项目共用一个账号
- 按需充值，不浪费
- 部分中转站有优惠倍率

**4. 稳定性保障**
- 多个上游备份
- 自动故障转移
- 专业运维团队`,
    category: 'comparison',
    keywords: ['为什么要用api中转站', 'api中转站有什么用', '中转站的优势'],
  },
  {
    id: 'is-relay-safe',
    question: 'API 中转站安全吗？',
    answer: `API 中转站的安全性取决于服务商的技术实力和信誉：

**✅ 相对安全的情况**
- 选择运营时间长（1年+）的服务商
- 有真实用户评价和社区反馈
- 提供技术文档和客服支持
- 明确的隐私政策

**⚠️ 潜在风险**
- 中转商可能记录你的 API 请求内容
- 小型服务商可能随时跑路
- API Key 泄露风险

**🛡️ 安全建议**
1. 不要传输敏感个人信息
2. 准备 2-3 个备用服务商
3. 定期更换 API Key
4. 关注余额变化
5. 使用支持的服务商（查看[推荐榜单](/rankings/stable)）`,
    category: 'safety',
    keywords: ['api中转站安全吗', '中转站会不会泄露数据', 'api中转站可靠吗'],
  },
  {
    id: 'relay-vs-official',
    question: 'API 中转站和官方 API 有什么区别？',
    answer: `中转站与官方 API 的对比：

| 对比项 | 官方 API | 中转站 |
|-------|---------|--------|
| **网络** | 需要魔法上网 | 国内直连 |
| **支付** | 需要外币信用卡 | 微信/支付宝 |
| **门槛** | 最低 $5 起充 | 10 元起充 |
| **价格** | 官方价格 | 0.8-1.5 倍 |
| **稳定性** | 官方保障 | 依赖服务商 |
| **隐私性** | 直连官方 | 经过第三方 |
| **功能** | 完整功能 | 大部分支持 |

**推荐使用场景**
- 个人开发、学习：中转站（低门槛）
- 企业生产环境：官方 API（稳定性）
- 临时测试：中转站（按需付费）
- 敏感数据处理：官方 API（隐私保护）`,
    category: 'comparison',
    keywords: ['中转站vs官方api', 'api中转站和官方的区别', '该选中转站还是官方'],
  },
  {
    id: 'relay-price',
    question: 'API 中转站价格怎么算？',
    answer: `API 中转站的价格计算方式：

**1. 价格倍率模式**（最常见）
- 官方价格 × 倍率 = 实际价格
- 例如：GPT-4o 官方 $2.5/$10，倍率 1.2 = 实际 $3/$12
- 不同模型倍率可能不同

**2. 包量套餐**
- 固定价格买固定额度
- 例如：99 元 = 100万 tokens
- 适合用量稳定的场景

**3. 计费单位**
- 按 token 计费（文本模型）
- 按次数计费（图像模型）
- 按时长计费（语音模型）

**💰 省钱技巧**
1. 对比各家倍率，选性价比高的
2. 关注新人优惠和充值活动
3. 使用便宜的模型（如 GPT-4o mini）
4. 优化 Prompt 减少 token 消耗

查看[便宜的中转站推荐](/rankings/cheap)`,
    category: 'pricing',
    keywords: ['api中转站价格', '中转站怎么收费', 'api中转站多少钱'],
  },
  {
    id: 'relay-not-working',
    question: 'API 中转站突然不能用了怎么办？',
    answer: `中转站不可用的排查步骤：

**🔍 快速诊断**
1. 检查余额是否充足
2. 检查 API Key 是否过期
3. 访问服务商官网，查看公告
4. 尝试切换到备用服务商

**🛠️ 常见问题解决**

**问题 1：429 Too Many Requests**
- 原因：请求频率过高
- 解决：降低请求频率，或联系客服提升限额

**问题 2：401 Unauthorized**
- 原因：API Key 错误或过期
- 解决：重新生成 Key

**问题 3：连接超时**
- 原因：服务商网络问题
- 解决：等待修复或切换服务商

**问题 4：服务商跑路**
- 预防：准备 2-3 个备用服务商
- 应对：立即切换到备用，保障业务连续性

查看[跑路预案指南](/articles/relay-shutdown-plan)`,
    category: 'technical',
    keywords: ['api中转站不能用', '中转站连不上', '中转站突然失效'],
  },
  {
    id: 'best-claude-relay',
    question: '哪个 Claude 中转站最好？',
    answer: `推荐的 Claude 中转站（2026年8月）：

**🏆 综合推荐**
1. **LinkAI** - 老牌稳定，支持全系列 Claude 模型
2. **Packy Code** - Claude Code 专家，96.81% 好评率
3. **聚星AI** - 多模型支持，价格透明

**📊 选择标准**
- ✅ 支持最新模型（Opus 5/Sonnet 5）
- ✅ 运营时间 > 1年
- ✅ 用户好评率 > 90%
- ✅ 有客服支持
- ✅ 价格合理（倍率 0.9-1.2）

**⚠️ 避坑指南**
- ❌ 新注册就要大额充值的
- ❌ 没有真实用户评价的
- ❌ 承诺"永久免费"的
- ❌ 无法提供发票的

查看完整[Claude 中转站排行榜](/rankings/claude-api)`,
    category: 'comparison',
    keywords: ['claude中转站推荐', '最好的claude中转站', 'claude api哪家好'],
  },
  {
    id: 'best-gpt-relay',
    question: '哪个 GPT 中转站最好？',
    answer: `推荐的 GPT 中转站（2026年8月）：

**🏆 综合推荐**
1. **聚星AI** - 支持 GPT-5.6，价格透明
2. **LinkAI** - 老牌服务商，稳定可靠
3. **OpenOx** - 新人优惠力度大

**🆕 GPT-5.6 支持**
OpenAI 已发布 GPT-5.6，支持该模型的中转站：
- 聚星AI（倍率 1.0）
- LinkAI（倍率 1.1）

**📊 价格对比**
| 服务商 | GPT-4o | GPT-5.6 | 最低充值 |
|--------|--------|---------|----------|
| 聚星AI | 1.0x | 1.0x | ¥10 |
| LinkAI | 1.1x | 1.1x | ¥20 |
| OpenOx | 0.9x | - | ¥10 |

查看完整[GPT 中转站排行榜](/rankings/gpt-api)`,
    category: 'comparison',
    keywords: ['gpt中转站推荐', '最好的gpt中转站', 'gpt5.6中转站'],
  },
  {
    id: 'relay-unstable',
    question: 'API 中转站不稳定怎么办？',
    answer: `提升中转站使用稳定性的方法：

**🔄 多服务商备份策略**
1. 主力服务商：日常使用
2. 备用服务商 1：故障切换
3. 备用服务商 2：应急备份

**⚙️ 代码层面优化**

\`\`\`python
# 实现自动重试和故障转移
import openai
from tenacity import retry, stop_after_attempt, wait_fixed

PROVIDERS = [
    {"base_url": "https://api.provider1.com/v1", "key": "key1"},
    {"base_url": "https://api.provider2.com/v1", "key": "key2"},
]

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def call_api_with_fallback(prompt):
    for provider in PROVIDERS:
        try:
            client = openai.OpenAI(
                api_key=provider["key"],
                base_url=provider["base_url"]
            )
            return client.chat.completions.create(...)
        except Exception as e:
            continue
    raise Exception("所有服务商都不可用")
\`\`\`

**📊 监控告警**
- 定期检查 API 可用性
- 余额低于阈值时告警
- 错误率超标时自动切换

查看[稳定的中转站推荐](/rankings/stable)`,
    category: 'technical',
    keywords: ['api中转站不稳定', '中转站经常掉线', '提升中转站稳定性'],
  },
  {
    id: 'domestic-relay',
    question: '有支持国内直连的 API 中转站吗？',
    answer: `支持国内网络直连的中转站推荐：

**🇨🇳 国内直连优势**
- ✅ 无需魔法上网
- ✅ 低延迟（< 100ms）
- ✅ 稳定性更好
- ✅ 合规性更强

**推荐服务商**
1. **LinkAI** - 国内 CDN 加速
2. **聚星AI** - 多节点部署
3. **OpenOx** - 电信/联通直连

**🔍 识别方法**
\`\`\`bash
# 测试是否需要代理
curl -I https://api.provider.com

# 国内直连：200 OK
# 需要代理：Connection timeout
\`\`\`

**⚠️ 注意事项**
- 国内直连不代表绝对稳定
- 建议仍准备备用方案
- 关注服务商的网络公告

查看[国内直连中转站排行](/rankings/domestic)`,
    category: 'technical',
    keywords: ['国内api中转站', '国内直连中转站', '不用翻墙的api'],
  },
  {
    id: 'relay-trial',
    question: 'API 中转站有免费试用吗？',
    answer: `API 中转站的免费试用政策：

**🎁 常见试用方式**

**1. 新人赠送额度**
- LinkAI：新用户送 ¥5
- OpenOx：注册送 10,000 tokens
- 通常需要完成实名认证

**2. 邀请返利**
- 邀请好友注册，双方都得优惠
- 通常返利 10-20%

**3. 活动赠送**
- 节假日充值活动
- 社群互动奖励

**⚠️ "永久免费"陷阱**
避免这些情况：
- ❌ 承诺完全免费的服务
- ❌ 要求大额充值才能提现的
- ❌ 来路不明的"破解"服务

**💡 省钱建议**
1. 先试用少量充值测试
2. 对比多家优惠政策
3. 关注服务商公众号/群组
4. 利用便宜模型降低成本

查看[性价比高的中转站](/rankings/cheap)`,
    category: 'pricing',
    keywords: ['api中转站免费试用', '中转站有没有免费的', '新人优惠'],
  },
  {
    id: 'relay-refund',
    question: 'API 中转站可以退款吗？',
    answer: `API 中转站的退款政策：

**📋 一般规则**
大多数中转站**不支持退款**，因为：
- 充值即消费（购买 tokens）
- 无法核实是否已使用
- 防止恶意套利

**✅ 可能退款的情况**
1. 充值后未使用，且服务商同意
2. 服务商服务故障导致无法使用
3. 充值错误（充到其他账号）
4. 7 天内未使用且有正当理由

**⚠️ 防止损失**
1. **小额测试**：首次充值 10-20 元测试
2. **按需充值**：不要一次充太多
3. **选择大平台**：运营时间长的更可靠
4. **保留记录**：截图聊天记录和充值凭证

**🛡️ 跑路预案**
- 准备 2-3 个备用服务商
- 单个服务商余额不超过 100 元
- 定期检查服务商动态

查看[如何应对中转站跑路](/articles/relay-shutdown-plan)`,
    category: 'pricing',
    keywords: ['api中转站能退款吗', '中转站退款政策', '充值能退吗'],
  },
  {
    id: 'relay-model-support',
    question: 'API 中转站支持哪些模型？',
    answer: `主流 API 中转站支持的模型：

**🤖 OpenAI 系列**
- GPT-5.6（最新）
- GPT-4o / GPT-4o mini
- GPT-4 Turbo
- GPT-3.5 Turbo
- DALL·E 3（图像生成）
- Whisper（语音转文本）
- TTS（文本转语音）

**🧠 Anthropic 系列**
- Claude Opus 5
- Claude Sonnet 5 / Sonnet 4
- Claude Haiku 4.5

**🌟 其他模型**
- DeepSeek Chat / Coder
- Gemini Pro
- Llama 3.1
- 通义千问
- 文心一言

**📊 服务商对比**
| 服务商 | OpenAI | Claude | 其他 |
|--------|--------|--------|------|
| LinkAI | ✅ 全系列 | ✅ 全系列 | ✅ 10+ |
| 聚星AI | ✅ 含 5.6 | ✅ 主流 | ✅ 5+ |
| Packy Code | ⚠️ 部分 | ✅ 全系列 | ❌ - |

查看[模型价格对比](/models)`,
    category: 'technical',
    keywords: ['中转站支持哪些模型', 'api中转站模型列表', 'gpt5.6中转站'],
  },
  {
    id: 'how-to-choose-relay',
    question: '如何选择合适的 API 中转站？',
    answer: `选择 API 中转站的 6 个关键标准：

**1. 📅 运营时间**
- ✅ 推荐：1 年以上
- ⚠️ 谨慎：半年以内
- ❌ 避免：新注册（< 3个月）

**2. ⭐ 用户口碑**
- 查看真实用户评价
- 搜索服务商名称 + "跑路/骗子"
- 加入用户交流群了解

**3. 💰 价格合理性**
- 倍率：0.8-1.5 属于正常
- 过低（< 0.5）可能不可持续
- 过高（> 2.0）性价比差

**4. 🛡️ 技术能力**
- 有完整的技术文档
- 响应速度快（< 2秒）
- 支持多种模型

**5. 💬 客服支持**
- 有客服联系方式
- 响应及时（< 1小时）
- 能解决实际问题

**6. 🔒 安全保障**
- 明确的隐私政策
- 不要求过度权限
- 支持发票

**🎯 快速决策表**
| 需求 | 推荐服务商 |
|------|-----------|
| Claude 开发 | [查看 Claude 榜单](/rankings/claude-api) |
| GPT 应用 | [查看 GPT 榜单](/rankings/gpt-api) |
| 预算有限 | [查看便宜榜单](/rankings/cheap) |
| 追求稳定 | [查看稳定榜单](/rankings/stable) |
| 国内直连 | [查看国内榜单](/rankings/domestic) |`,
    category: 'comparison',
    keywords: ['如何选择api中转站', '中转站选择标准', '怎么挑中转站'],
  },
  {
    id: 'relay-api-key-leaked',
    question: 'API Key 泄露了怎么办？',
    answer: `API Key 泄露的应急处理流程：

**🚨 立即行动（5分钟内）**
1. **删除旧 Key**：登录控制台立即删除泄露的 Key
2. **生成新 Key**：创建新的 API Key
3. **检查余额**：查看是否有异常消费
4. **修改密码**：更换账号密码

**🔍 排查影响范围**
- 检查 Git 提交历史
- 搜索代码仓库（GitHub/GitLab）
- 查看日志文件
- 检查已部署的服务

**🛡️ 预防措施**

**1. 使用环境变量**
\`\`\`python
# ❌ 错误：硬编码
api_key = "sk-abc123..."

# ✅ 正确：环境变量
import os
api_key = os.getenv("API_KEY")
\`\`\`

**2. 配置 .gitignore**
\`\`\`gitignore
.env
.env.local
config/secrets.yml
*.key
\`\`\`

**3. 使用密钥管理工具**
- GitHub Secrets
- AWS Secrets Manager
- HashiCorp Vault

**4. 定期轮换 Key**
- 每 3 个月更换一次
- 项目结束后立即删除

查看[API Key 安全完整指南](/articles/api-key-security)`,
    category: 'safety',
    keywords: ['api key泄露', 'api密钥泄露怎么办', 'key被盗用'],
  },
];

export const metadata: Metadata = generateSEOMetadata({
  title: 'API 中转站常见问题 - 使用教程、安全指南与选择建议',
  description: '15+ API 中转站常见问题解答，涵盖使用教程、安全性、价格计算、故障排查、服务商选择等。帮你快速上手 AI API 中转服务。',
  path: '/faq',
});

export default function FAQPage() {
  const categories = [
    { id: 'usage', name: '使用教程', icon: '📖', color: 'blue' },
    { id: 'safety', name: '安全指南', icon: '🛡️', color: 'green' },
    { id: 'technical', name: '技术问题', icon: '🔧', color: 'purple' },
    { id: 'pricing', name: '价格相关', icon: '💰', color: 'yellow' },
    { id: 'comparison', name: '选择对比', icon: '⚖️', color: 'red' },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <Breadcrumb
        items={[
          { label: '常见问题', href: '/faq' },
        ]}
      />

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">API 中转站常见问题</h1>
        <p className="text-lg text-gray-600">
          15+ 常见问题解答，帮你快速了解和使用 API 中转服务
        </p>
      </div>

      {/* 分类导航 */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((cat) => {
          const count = FAQ_DATA.filter((faq) => faq.category === cat.id).length;
          return (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className={`px-4 py-2 rounded-lg border-2 border-${cat.color}-200 bg-${cat.color}-50 hover:bg-${cat.color}-100 transition-colors`}
            >
              <span className="mr-2">{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
              <span className="ml-2 text-sm text-gray-500">({count})</span>
            </a>
          );
        })}
      </div>

      {/* FAQ 列表 */}
      {categories.map((cat) => {
        const faqs = FAQ_DATA.filter((faq) => faq.category === cat.id);
        if (faqs.length === 0) return null;

        return (
          <div key={cat.id} id={cat.id} className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </h2>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  id={faq.id}
                  className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold mb-4 text-blue-600">
                    {faq.question}
                  </h3>

                  <div
                    className="prose max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: faq.answer
                        .replace(/\n\n/g, '</p><p className="mb-4">')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code className="bg-gray-100 px-2 py-1 rounded">$1</code>')
                        .replace(/^(.+)$/gm, '<p className="mb-4">$1</p>'),
                    }}
                  />

                  {/* 关键词标签 */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {faq.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 相关推荐 - 内链模块 */}
      <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <h2 className="text-2xl font-bold mb-6 text-center">
          💡 根据你的需求，推荐这些榜单
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link
            href="/rankings/claude-api"
            className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-blue-300"
          >
            <div className="text-3xl mb-3">🤖</div>
            <div className="font-bold text-lg mb-2">Claude 中转站</div>
            <div className="text-sm text-gray-600">支持 Opus 5 / Sonnet 5</div>
          </Link>
          <Link
            href="/rankings/gpt-api"
            className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-blue-300"
          >
            <div className="text-3xl mb-3">💬</div>
            <div className="font-bold text-lg mb-2">GPT 中转站</div>
            <div className="text-sm text-gray-600">已支持 GPT-5.6 最新版</div>
          </Link>
          <Link
            href="/rankings/cheap"
            className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-blue-300"
          >
            <div className="text-3xl mb-3">💰</div>
            <div className="font-bold text-lg mb-2">便宜的中转站</div>
            <div className="text-sm text-gray-600">高性价比，最低 10 元起</div>
          </Link>
          <Link
            href="/rankings/stable"
            className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-blue-300"
          >
            <div className="text-3xl mb-3">🛡️</div>
            <div className="font-bold text-lg mb-2">稳定的中转站</div>
            <div className="text-sm text-gray-600">运营 1 年+，用户好评</div>
          </Link>
          <Link
            href="/rankings/domestic"
            className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-blue-300"
          >
            <div className="text-3xl mb-3">🇨🇳</div>
            <div className="font-bold text-lg mb-2">国内直连</div>
            <div className="text-sm text-gray-600">无需魔法，低延迟访问</div>
          </Link>
          <Link
            href="/articles"
            className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-blue-300"
          >
            <div className="text-3xl mb-3">📚</div>
            <div className="font-bold text-lg mb-2">使用教程</div>
            <div className="text-sm text-gray-600">21+ 篇深度实战指南</div>
          </Link>
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">
          还没找到答案？
        </h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <Link
            href="/rankings/stable"
            className="p-4 bg-white rounded-lg text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">🛡️</div>
            <div className="font-medium">查看稳定榜单</div>
          </Link>
          <Link
            href="/articles"
            className="p-4 bg-white rounded-lg text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-medium">阅读完整教程</div>
          </Link>
          <Link
            href="/providers"
            className="p-4 bg-white rounded-lg text-center hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-2">🔍</div>
            <div className="font-medium">浏览所有服务商</div>
          </Link>
        </div>
      </div>

      {/* Schema.org 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer.replace(/\*\*/g, '').replace(/`/g, ''),
              },
            })),
          }),
        }}
      />
    </div>
  );
}
