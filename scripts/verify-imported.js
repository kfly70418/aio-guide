const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  const { data, error } = await supabase
    .from('providers')
    .select('name, website_url, verification_status, verified_at')
    .eq('verification_status', 'verified')
    .order('name');

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  console.log(`\n✓ 共 ${data.length} 个已核验服务商：\n`);
  data.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   网址: ${p.website_url || '(未提供)'}`);
    console.log(`   核验时间: ${new Date(p.verified_at).toLocaleString('zh-CN')}\n`);
  });
}

verify();
