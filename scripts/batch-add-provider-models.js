const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 模型配置方案
const providerModelsConfig = {
  // ===== 老牌综合型（全选所有主流模型）=====
  'API2D': 'full',
  'OpenAI-HK': 'full',
  'APIHub': 'full',
  'LinkAI': 'full',
  'AISKT': 'full',
  'OpenOx': 'full',
  'H API': 'full',
  'CUN.ai': 'full',

  // ===== 新兴优质（核心模型）=====
  'DuiAPI': 'core',
  'wawapi.top': 'core',
  'api-top.com': 'core',
  'api.koozhan.com': 'core',
  'Modelflare': 'core',
  '三头牛': 'core',

  // ===== 中型平台（常见模型）=====
  'AceDataCloud': 'common',
  'GPT-API': 'common',
  'AIchatOS': 'core',
};

// 模型匹配规则（根据 family + name 关键词）
const modelTemplates = {
  // 全能型：所有主流模型（匹配所有热门家族）
  full: {
    families: ['Claude', 'GPT', 'Gemini', 'Llama', 'DeepSeek', 'Qwen', 'Doubao'],
    keywords: [] // 空表示该家族所有模型
  },

  // 核心型：最热门的模型
  core: {
    families: ['Claude', 'GPT', 'Gemini'],
    keywords: ['Opus', 'Sonnet', 'o1', 'o3', '4o', '4-turbo', '2.0', '1.5 Pro']
  },

  // 常见型：中等配置
  common: {
    families: ['Claude', 'GPT', 'Gemini'],
    keywords: ['Sonnet', 'Haiku', '4o', '4-turbo', '3.5', '1.5']
  }
};

async function batchAddProviderModels() {
  console.log('🚀 开始批量配置服务商模型...\n');

  // 1. 获取所有服务商
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select('id, name')
    .eq('verification_status', 'verified');

  if (providersError) {
    console.error('❌ 获取服务商失败:', providersError.message);
    return;
  }

  // 2. 获取所有模型
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id, slug, name')
    .eq('status', 'published');

  if (modelsError) {
    console.error('❌ 获取模型失败:', modelsError.message);
    return;
  }

  // 创建 slug -> model_id 映射
  const modelSlugMap = {};
  models.forEach(m => {
    modelSlugMap[m.slug] = m.id;
  });

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // 3. 遍历每个服务商
  for (const provider of providers) {
    const config = providerModelsConfig[provider.name];

    if (!config) {
      console.log(`⏭️  跳过: ${provider.name} (未配置)`);
      skipCount++;
      continue;
    }

    try {
      // 获取该服务商的模板
      const templateModels = modelTemplates[config];

      // 转换为 model_id
      const modelIds = templateModels
        .map(slug => modelSlugMap[slug])
        .filter(Boolean);

      if (modelIds.length === 0) {
        console.log(`⚠️  ${provider.name}: 没有匹配的模型`);
        continue;
      }

      // 查询或创建 channel
      let { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('provider_id', provider.id)
        .eq('is_primary', true)
        .limit(1);

      let channelId;

      if (!channels || channels.length === 0) {
        // 创建新 channel
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert({
            provider_id: provider.id,
            name: `${provider.name} 官方渠道`,
            is_primary: true,
            status: 'active',
            priority: 0
          })
          .select('id')
          .single();

        if (channelError) throw channelError;
        channelId = newChannel.id;
      } else {
        channelId = channels[0].id;
      }

      // 检查是否已有 prices 数据
      const { data: existingPrices } = await supabase
        .from('prices')
        .select('id')
        .eq('channel_id', channelId)
        .limit(1);

      if (existingPrices && existingPrices.length > 0) {
        console.log(`✅ ${provider.name}: 已有配置，跳过 (${config})`);
        skipCount++;
        continue;
      }

      // 插入 prices
      const pricesData = modelIds.map(modelId => ({
        channel_id: channelId,
        model_id: modelId,
        price_per_1m_input: 0,
        price_per_1m_output: 0,
        status: 'active'
      }));

      const { error: pricesError } = await supabase
        .from('prices')
        .insert(pricesData);

      if (pricesError) throw pricesError;

      console.log(`✅ ${provider.name}: 已配置 ${modelIds.length} 个模型 (${config})`);
      successCount++;

    } catch (error) {
      console.error(`❌ ${provider.name}: 配置失败 -`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 配置完成统计:');
  console.log(`  ✅ 成功: ${successCount}`);
  console.log(`  ⏭️  跳过: ${skipCount}`);
  console.log(`  ❌ 失败: ${errorCount}`);
}

// 执行
batchAddProviderModels().catch(console.error);
