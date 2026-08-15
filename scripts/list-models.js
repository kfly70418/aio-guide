const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: models, error } = await supabase
    .from('models')
    .select('id, slug, name, family')
    .eq('status', 'published')
    .order('family, name');

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  console.log('共有', models.length, '个已发布模型\n');

  // 按家族分组
  const grouped = {};
  models.forEach(m => {
    if (!grouped[m.family]) grouped[m.family] = [];
    grouped[m.family].push(m);
  });

  // 输出
  Object.entries(grouped).forEach(([family, list]) => {
    console.log(`\n${family}:`);
    list.forEach(m => {
      console.log(`  '${m.slug}',  // ${m.name}`);
    });
  });

  console.log('\n\n=== 所有 slug 列表（用于复制）===');
  console.log(models.map(m => `'${m.slug}'`).join(',\n'));
})();
