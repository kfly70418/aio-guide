const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeProviders() {
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, website_url, verification_status, verified_at, created_at')
    .order('created_at');

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  console.log(`总共 ${providers.length} 个服务商\n`);
  
  // 按创建时间分组
  const today = new Date('2026-08-15').toDateString();
  const verifiedToday = providers.filter(p => {
    if (!p.verified_at) return false;
    return new Date(p.verified_at).toDateString() === today;
  });

  const oldProviders = providers.filter(p => {
    if (!p.verified_at) return false;
    return new Date(p.verified_at).toDateString() !== today;
  });

  const noVerified = providers.filter(p => !p.verified_at || p.verified_at === '1970-01-01T00:00:00+00:00');

  console.log('=== 今天新核验的（2026-08-15）===');
  console.log(`共 ${verifiedToday.length} 个\n`);
  verifiedToday.forEach(p => {
    const time = new Date(p.verified_at).toLocaleString('zh-CN');
    console.log(`- ${p.name} (${p.website_url || '无网址'}) - ${time}`);
  });

  console.log('\n=== 之前就核验的 ===');
  console.log(`共 ${oldProviders.length} 个\n`);
  oldProviders.forEach(p => {
    const time = new Date(p.verified_at).toLocaleString('zh-CN');
    console.log(`- ${p.name} (${p.website_url || '无网址'}) - ${time}`);
  });

  console.log('\n=== 未核验的 ===');
  console.log(`共 ${noVerified.length} 个\n`);
  noVerified.forEach(p => {
    console.log(`- ${p.name} (${p.website_url || '无网址'})`);
  });

  console.log('\n=== 统计 ===');
  console.log(`今天新增/更新: ${verifiedToday.length}`);
  console.log(`之前已有: ${oldProviders.length}`);
  console.log(`未核验: ${noVerified.length}`);
  console.log(`总计: ${providers.length}`);
  
  // 详细分析今天的操作
  console.log('\n=== 今天导入的详细时间线 ===');
  const todayByTime = verifiedToday.sort((a, b) => 
    new Date(a.verified_at) - new Date(b.verified_at)
  );
  todayByTime.forEach(p => {
    const time = new Date(p.verified_at).toLocaleTimeString('zh-CN');
    console.log(`${time} - ${p.name}`);
  });
}

analyzeProviders();
