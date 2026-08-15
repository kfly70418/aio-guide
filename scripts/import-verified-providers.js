const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 生成 slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'provider-' + Date.now();
}

// 三个来源的服务商数据
const providers = [
  // apiranking.com - 通过检测的10家
  { name: 'OpenOx', website_url: 'https://openox.run', source: 'apiranking.com' },
  { name: 'H API', website_url: null, source: 'apiranking.com' },
  { name: 'LinkAI', website_url: 'https://link-ai.tech', source: 'apiranking.com' },
  { name: 'AISKT', website_url: 'https://aiskt.com', source: 'apiranking.com' },
  { name: 'OpenAI-HK', website_url: 'https://openai-hk.com', source: 'apiranking.com' },
  { name: 'APIHub', website_url: 'https://apihub.bot', source: 'apiranking.com' },
  { name: 'API2D', website_url: 'https://api2d.com', source: 'apiranking.com' },
  { name: 'AceDataCloud', website_url: 'https://www.acedatcloud.com', source: 'apiranking.com' },
  { name: 'GPT-API', website_url: 'https://gpt-api.us', source: 'apiranking.com' },
  { name: 'AIchatOS', website_url: 'https://aichatos.cloud', source: 'apiranking.com' },

  // aiapirank.github.io - 前3
  { name: 'DuiAPI', website_url: 'https://duiapi.com', source: 'aiapirank.github.io' },
  { name: 'CUN.ai', website_url: 'https://cun.ai', source: 'aiapirank.github.io' },
  { name: 'Modelflare', website_url: 'https://modelflare.com', source: 'aiapirank.github.io' },

  // veridrop.org - 前3
  { name: 'api.koozhan.com', website_url: 'https://api.koozhan.com', source: 'veridrop.org' },
  { name: 'wawapi.top', website_url: 'https://wawapi.top', source: 'veridrop.org' },
  { name: 'api-top.com', website_url: 'https://api-top.com', source: 'veridrop.org' },
];

// 导入到数据库
async function importProviders() {
  console.log(`开始导入 ${providers.length} 个已核验服务商...\n`);

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const provider of providers) {
    const slug = generateSlug(provider.name);

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('providers')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      // 更新现有记录
      const { error } = await supabase
        .from('providers')
        .update({
          name: provider.name,
          website_url: provider.website_url,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`✗ 更新失败 [${provider.name}]:`, error.message);
        skipped++;
      } else {
        console.log(`✓ 已更新 [${provider.name}] - ${provider.source}`);
        updated++;
      }
    } else {
      // 插入新记录
      const { error } = await supabase
        .from('providers')
        .insert({
          slug,
          name: provider.name,
          name_en: null,
          website_url: provider.website_url,
          description: null,
          features: null,
          is_recommended: false,
          status: 'published',
          sort_order: 999,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          min_topup: null,
          trial_credit: null,
          transaction_fee: null,
          invoice_support: false
        });

      if (error) {
        console.error(`✗ 插入失败 [${provider.name}]:`, error.message);
        skipped++;
      } else {
        console.log(`✓ 已添加 [${provider.name}] - ${provider.source}`);
        added++;
      }
    }
  }

  console.log('\n=== 导入完成 ===');
  console.log(`新增: ${added}`);
  console.log(`更新: ${updated}`);
  console.log(`跳过: ${skipped}`);
  console.log(`总计: ${added + updated} 个服务商已标记为"已核验"`);
}

importProviders();
