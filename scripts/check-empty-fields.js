const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmptyFields() {
  const { data: providers, error } = await supabase
    .from('providers')
    .select('*')
    .eq('verification_status', 'verified')
    .order('name');

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  console.log(`共 ${providers.length} 个已核验服务商\n`);

  // 统计字段完整度
  const fields = [
    'description',
    'features', 
    'min_topup',
    'trial_credit',
    'transaction_fee',
    'invoice_support'
  ];

  const stats = {};
  fields.forEach(f => {
    stats[f] = {
      filled: 0,
      empty: 0
    };
  });

  providers.forEach(p => {
    fields.forEach(f => {
      if (p[f] === null || p[f] === undefined || p[f] === '' || 
          (Array.isArray(p[f]) && p[f].length === 0)) {
        stats[f].empty++;
      } else {
        stats[f].filled++;
      }
    });
  });

  console.log('=== 字段完整度统计 ===\n');
  fields.forEach(f => {
    const percent = ((stats[f].filled / providers.length) * 100).toFixed(1);
    console.log(`${f}:`);
    console.log(`  已填写: ${stats[f].filled} (${percent}%)`);
    console.log(`  空白: ${stats[f].empty}\n`);
  });

  // 列出完全空白的服务商
  console.log('=== 数据完全空白的服务商 ===\n');
  providers.forEach(p => {
    const emptyCount = fields.filter(f => 
      p[f] === null || p[f] === undefined || p[f] === '' ||
      (Array.isArray(p[f]) && p[f].length === 0)
    ).length;
    
    if (emptyCount === fields.length) {
      console.log(`- ${p.name} (${p.website_url || '无网址'})`);
    }
  });
}

checkEmptyFields();
