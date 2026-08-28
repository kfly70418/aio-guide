import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateSEOMetadata, generateItemListSchema } from '@/lib/seo';
import Breadcrumb from '@/components/Breadcrumb';

interface RankingPageProps {
  params: Promise<{
    category: string;
  }>;
}

interface RankingCategory {
  title: string;
  fullTitle: string;
  description: string;
  keywords: string[];
  filter?: {
    models?: string[];
    tags?: string[];
    verified?: boolean;
    sortBy?: 'price' | 'rating';
  };
  icon: string;
}

// 定义长尾词分类
export const RANKING_CATEGORIES: Record<string, RankingCategory> = {
  'claude-api': {
    title: 'Claude 中转站推荐',
    fullTitle: 'Claude 中转站推荐 - 2026年最新Claude API中转站排行榜',
    description: '精选支持 Claude Opus 5/Sonnet 5 的 API 中转站，人工核验数据，对比价格、稳定性、速度。帮你找到最适合的 Claude API 服务商。',
    keywords: ['claude中转站', 'claude api', 'claude中转站推荐', 'claude code中转站'],
    filter: { models: ['claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-6', 'claude-sonnet-4'] },
    icon: '🤖',
  },
  'gpt-api': {
    title: 'GPT 中转站推荐',
    fullTitle: 'GPT 中转站推荐 - 支持 GPT-5.6 的 API 中转服务',
    description: '精选支持 GPT-5.6/GPT-4o/GPT-4o Mini 的 API 中转站，价格透明、稳定可靠。对比国内主流 ChatGPT API 服务商。',
    keywords: ['gpt中转站', 'chatgpt api', 'gpt5.6', 'gpt中转站推荐', 'gpt api中转'],
    filter: { models: ['gpt-56-sol', 'gpt-56-terra', 'gpt-56-luna', 'gpt-55'] },
    icon: '💬',
  },
  'cheap': {
    title: '便宜的 API 中转站',
    fullTitle: '便宜的 API 中转站推荐 - 高性价比 AI API 服务商',
    description: '精选价格实惠、性价比高的 API 中转站。对比各家价格倍率、新人优惠、充值门槛，帮你省钱。',
    keywords: ['便宜的api中转站', 'api中转站价格', '性价比中转站'],
    filter: { sortBy: 'price' },
    icon: '💰',
  },
  'stable': {
    title: '稳定的 API 中转站',
    fullTitle: '稳定的 API 中转站推荐 - 高可用 AI API 服务商',
    description: '精选运营时间长、口碑好、稳定性高的 API 中转站。查看真实用户评价和可用率数据。',
    keywords: ['稳定的api中转站', 'api中转站推荐', '可靠的中转站'],
    filter: { verified: true, sortBy: 'rating' },
    icon: '🛡️',
  },
  'domestic': {
    title: '国内 API 中转站',
    fullTitle: '国内 API 中转站推荐 - 支持国内支付和直连',
    description: '精选支持国内支付（微信/支付宝）、国内网络直连的 API 中转站，无需魔法上网。',
    keywords: ['国内api中转站', 'api中转站国内支付', '国内中转站'],
    filter: { tags: ['国内直连'] },
    icon: '🇨🇳',
  },
  'free': {
    title: '免费的 API 中转站',
    fullTitle: '免费的 API 中转站推荐 - 有免费额度的 AI API 服务商',
    description: '精选提供免费额度、试用额度的 API 中转站。新用户注册即送免费 Token，适合测试和小规模使用。',
    keywords: ['免费api中转站', '免费的中转站', 'api中转站免费额度', '免费试用中转站'],
    filter: { tags: ['注册有赠送'] },
    icon: '🎁',
  },
  'newbie': {
    title: '新人优惠中转站',
    fullTitle: '新人优惠中转站推荐 - 首充优惠最多的 API 服务商',
    description: '精选新人优惠力度大的 API 中转站。首充送余额、折扣码、免费额度，新手入门首选。',
    keywords: ['新人优惠中转站', '首充优惠', 'api中转站新人福利', '中转站优惠码'],
    filter: { tags: ['优惠折扣'] },
    icon: '🎉',
  },
  'enterprise': {
    title: '企业级 API 中转站',
    fullTitle: '企业级 API 中转站推荐 - 支持开票和合同的 AI API 服务商',
    description: '精选支持企业服务的 API 中转站。可开发票、签合同、专属客服、定制服务，适合企业用户。',
    keywords: ['企业级api中转站', 'api中转站开票', '企业中转站', '可开发票的中转站'],
    filter: { tags: ['可开发票'] },
    icon: '🏢',
  },
  'fast': {
    title: '速度快的 API 中转站',
    fullTitle: '速度快的 API 中转站推荐 - 低延迟高响应的 AI API 服务商',
    description: '精选响应速度快、延迟低的 API 中转站。国内节点优化，平均响应时间 <500ms，适合实时对话场景。',
    keywords: ['速度快的中转站', 'api中转站速度', '低延迟中转站', '快速响应中转站'],
    filter: { tags: ['极速响应'] },
    icon: '⚡',
  },
  'multimodel': {
    title: '多模型 API 中转站',
    fullTitle: '多模型 API 中转站推荐 - 支持 10+ AI 模型的服务商',
    description: '精选支持多种 AI 模型的 API 中转站。同时支持 Claude、GPT、Gemini、文心一言等 10+ 主流模型，一站式解决方案。',
    keywords: ['多模型中转站', 'api中转站多模型', '支持多模型的中转站', '全模型中转站'],
    filter: { tags: ['多模型支持'] },
    icon: '🎯',
  },
};

type RankingCategoryKey = keyof typeof RANKING_CATEGORIES;

// 移除 generateStaticParams，改为完全动态路由
// export async function generateStaticParams() {
//   return Object.keys(RANKING_CATEGORIES).map((category) => ({
//     category,
//   }));
// }

export const dynamicParams = true;
export const revalidate = 300;

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { category } = await params;
  const config = RANKING_CATEGORIES[category as RankingCategoryKey];

  if (!config) {
    return { title: '页面不存在' };
  }

  return generateSEOMetadata({
    title: config.fullTitle,
    description: config.description,
    path: `/rankings/${category}`,
  });
}

export default async function RankingPage({ params }: RankingPageProps) {
  const { category } = await params;
  const config = RANKING_CATEGORIES[category as RankingCategoryKey];

  if (!config) {
    notFound();
  }

  const supabase = await createClient();

  // 根据分类筛选服务商
  let query = supabase
    .from('providers')
    .select(`
      *,
      channels!inner (
        id,
        status,
        prices!inner (
          id,
          model_id,
          models!inner (
            slug,
            name
          )
        )
      )
    `)
    .eq('status', 'published')
    .eq('channels.status', 'active')
    .eq('channels.prices.status', 'active');

  // 根据 config.filter 添加筛选条件
  const filter = config.filter;

  if (filter) {
    if (filter.models) {
      // 筛选支持特定模型的服务商
      query = query.in('channels.prices.models.slug', filter.models);
    }

    if (filter.tags) {
      // 多标签分类采用 OR 逻辑，避免要求同一服务商同时拥有所有同义标签。
      if (filter.tags.length === 1) {
        query = query.contains('features', filter.tags);
      } else {
        query = query.or(filter.tags.map(tag => `features.cs.{${tag}}`).join(','));
      }
    }

    if (filter.verified !== undefined) {
      // 筛选已核验的服务商
      if (filter.verified) {
        query = query.not('verified_at', 'is', null);
      }
    }
  }

  const { data: providersWithChannels, error } = await query;

  if (error) {
    console.error('获取服务商失败:', error);
    return <div>加载失败</div>;
  }

  // 数据去重和处理（因为 JOIN 会产生重复行）
  const providersMap = new Map();

  providersWithChannels?.forEach((item: any) => {
    if (!providersMap.has(item.id)) {
      providersMap.set(item.id, {
        ...item,
        channels: undefined, // 移除嵌套的 channels 数据，只保留 provider 基础信息
      });
    }
  });

  // 转为数组并排序
  let providers = Array.from(providersMap.values());

  // 根据 filter.sortBy 排序
  if (filter?.sortBy === 'price') {
    // 按价格排序（需要额外查询价格数据）
    providers.sort((a, b) => {
      // 暂时按推荐状态排序，后续可优化为实际价格排序
      if (a.is_recommended !== b.is_recommended) {
        return a.is_recommended ? -1 : 1;
      }
      return a.sort_order - b.sort_order;
    });
  } else if (filter?.sortBy === 'rating') {
    // 按评分排序（已核验的优先）
    providers.sort((a, b) => {
      const aVerified = !!a.verified_at;
      const bVerified = !!b.verified_at;
      if (aVerified !== bVerified) {
        return aVerified ? -1 : 1;
      }
      return b.sort_order - a.sort_order;
    });
  } else {
    // 默认按 sort_order 排序
    providers.sort((a, b) => b.sort_order - a.sort_order);
  }

  // 生成结构化数据
  const itemListSchema = generateItemListSchema({
    name: config.title,
    description: config.description,
    url: `/rankings/${category}`,
    items: providers?.map(p => ({
      name: p.name,
      url: `/providers/${p.slug}`,
      description: p.description || '',
    })) || [],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <Breadcrumb
          items={[
            { label: '中转站排行', href: '/providers' },
            { label: config.title },
          ]}
        />

        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{config.icon}</span>
            <h1 className="text-3xl font-bold">{config.title}</h1>
          </div>
          <p className="text-lg text-gray-600">{config.description}</p>

          {/* 关键词标签 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {config.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* 快速导航 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(RANKING_CATEGORIES).map(([key, cat]) => (
            <a
              key={key}
              href={`/rankings/${key}`}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                key === category
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="font-medium text-sm">{cat.title}</div>
            </a>
          ))}
        </div>

        {/* 服务商列表 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">
            {config.title}榜单（共 {providers?.length || 0} 家）
          </h2>

          {providers?.map((provider, index) => (
            <div
              key={provider.id}
              className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* 排名 */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>

                {/* Logo */}
                {provider.logo_url && (
                  <img
                    src={provider.logo_url}
                    alt={provider.name}
                    className="w-16 h-16 rounded object-contain"
                  />
                )}

                {/* 信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{provider.name}</h3>
                    {provider.verification_status === 'verified' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        ✓ 已核验
                      </span>
                    )}
                    {provider.is_recommended && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                        ⭐ 推荐
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-3">{provider.description}</p>

                  {/* 特色标签 */}
                  {provider.features && provider.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {provider.features.map((feature: string) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 优惠信息 */}
                  <div className="flex gap-4 text-sm text-gray-500 mb-3">
                    {provider.trial_credit && (
                      <span>🎁 {provider.trial_credit}</span>
                    )}
                    {provider.min_topup && (
                      <span>💳 最低充值：{provider.min_topup}</span>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <a
                      href={`/providers/${provider.slug}`}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      查看详情
                    </a>
                    {provider.website_url && (
                      <a
                        href={provider.website_url}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      >
                        访问官网 →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 使用指南 */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">如何选择{config.title.replace('推荐', '')}？</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              选择 API 中转站时，建议关注以下几点：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>查看服务商的运营时间和用户评价</li>
              <li>对比价格倍率和优惠活动</li>
              <li>测试连接速度和稳定性</li>
              <li>确认支持的模型和功能</li>
              <li>准备 2-3 个备用服务商</li>
            </ol>
          </div>
        </div>

        {/* 相关推荐 - 内链模块 */}
        <div className="mt-12 p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <h2 className="text-2xl font-bold mb-6 text-center">
            🔍 其他热门榜单推荐
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category !== 'claude-api' && (
              <Link
                href="/rankings/claude-api"
                className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-purple-300"
              >
                <div className="text-3xl mb-3">🤖</div>
                <div className="font-bold text-lg mb-2">Claude 中转站</div>
                <div className="text-sm text-gray-600">支持 Opus 5 / Sonnet 5</div>
              </Link>
            )}
            {category !== 'gpt-api' && (
              <Link
                href="/rankings/gpt-api"
                className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-purple-300"
              >
                <div className="text-3xl mb-3">💬</div>
                <div className="font-bold text-lg mb-2">GPT 中转站</div>
                <div className="text-sm text-gray-600">已支持 GPT-5.6 最新版</div>
              </Link>
            )}
            {category !== 'cheap' && (
              <Link
                href="/rankings/cheap"
                className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-purple-300"
              >
                <div className="text-3xl mb-3">💰</div>
                <div className="font-bold text-lg mb-2">便宜的中转站</div>
                <div className="text-sm text-gray-600">高性价比，最低 10 元起</div>
              </Link>
            )}
            {category !== 'stable' && (
              <Link
                href="/rankings/stable"
                className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-purple-300"
              >
                <div className="text-3xl mb-3">🛡️</div>
                <div className="font-bold text-lg mb-2">稳定的中转站</div>
                <div className="text-sm text-gray-600">运营 1 年+，用户好评</div>
              </Link>
            )}
            {category !== 'domestic' && (
              <Link
                href="/rankings/domestic"
                className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-purple-300"
              >
                <div className="text-3xl mb-3">🇨🇳</div>
                <div className="font-bold text-lg mb-2">国内直连</div>
                <div className="text-sm text-gray-600">无需魔法，低延迟访问</div>
              </Link>
            )}
            <Link
              href="/faq"
              className="p-5 bg-white rounded-lg hover:shadow-lg transition-all border border-transparent hover:border-purple-300"
            >
              <div className="text-3xl mb-3">❓</div>
              <div className="font-bold text-lg mb-2">常见问题</div>
              <div className="text-sm text-gray-600">15+ 问题快速解答</div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
