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

// 手动填入的服务商数据
const PROVIDERS_DATA = [
  // apiranking.com - 通过检测的服务商（手动填入）
  {
    name: '示例服务商1',
    website_url: 'https://example1.com',
    description: null,
    source: 'apiranking.com'
  },

  // aiapirank.github.io - 前3个（手动填入）
  {
    name: '示例服务商2',
    website_url: 'https://example2.com',
    description: null,
    source: 'aiapirank.github.io'
  },

  // veridrop.org - 前3个（手动填入）
  {
    name: '示例服务商3',
    website_url: 'https://example3.com',
    description: null,
    source: 'veridrop.org'
  }
];

async function importProviders() {
  console.log('开始导入服务商...\n');

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const provider of PROVIDERS_DATA) {
    if (!provider.name || provider.name.includes('示例')) {
      console.log(`⊘ 跳过示例数据: ${provider.name}`);
      skipped++;
      continue;
    }

    const slug = generateSlug(provider.name);

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('providers')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('providers')
        .update({
          name: provider.name,
          website_url: provider.website_url,
          description: provider.description,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`✗ 更新失败 [${provider.name}]:`, error.message);
      } else {
        console.log(`✓ 已更新 [${provider.name}] - ${provider.source}`);
        updated++;
      }
    } else {
      // 插入
      const { error } = await supabase
        .from('providers')
        .insert({
          slug,
          name: provider.name,
          name_en: null,
          website_url: provider.website_url,
          description: provider.description,
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
}

importProviders();
