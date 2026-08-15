const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  console.log('检查服务商重复情况...\n');

  // 获取所有服务商
  const { data: providers, error } = await supabase
    .from('providers')
    .select('id, name, slug, website_url, status')
    .order('name');

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  console.log(`总共 ${providers.length} 个服务商\n`);

  // 按名称分组检查重复
  const nameMap = {};
  const slugMap = {};
  const urlMap = {};

  providers.forEach(p => {
    // 检查名称重复
    if (!nameMap[p.name]) nameMap[p.name] = [];
    nameMap[p.name].push(p);

    // 检查 slug 重复
    if (!slugMap[p.slug]) slugMap[p.slug] = [];
    slugMap[p.slug].push(p);

    // 检查网址重复
    if (p.website_url) {
      const cleanUrl = p.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!urlMap[cleanUrl]) urlMap[cleanUrl] = [];
      urlMap[cleanUrl].push(p);
    }
  });

  // 输出重复的名称
  console.log('=== 名称重复 ===');
  let nameCount = 0;
  for (const [name, items] of Object.entries(nameMap)) {
    if (items.length > 1) {
      console.log(`\n"${name}" - ${items.length} 个记录:`);
      items.forEach(p => {
        console.log(`  ID: ${p.id}, Slug: ${p.slug}, 状态: ${p.status}`);
        console.log(`  网址: ${p.website_url || '(无)'}`);
      });
      nameCount++;
    }
  }
  if (nameCount === 0) console.log('✓ 无重复');

  // 输出重复的 slug
  console.log('\n=== Slug 重复 ===');
  let slugCount = 0;
  for (const [slug, items] of Object.entries(slugMap)) {
    if (items.length > 1) {
      console.log(`\n"${slug}" - ${items.length} 个记录:`);
      items.forEach(p => {
        console.log(`  ID: ${p.id}, 名称: ${p.name}, 状态: ${p.status}`);
      });
      slugCount++;
    }
  }
  if (slugCount === 0) console.log('✓ 无重复');

  // 输出重复的网址
  console.log('\n=== 网址重复 ===');
  let urlCount = 0;
  for (const [url, items] of Object.entries(urlMap)) {
    if (items.length > 1) {
      console.log(`\n"${url}" - ${items.length} 个记录:`);
      items.forEach(p => {
        console.log(`  ID: ${p.id}, 名称: ${p.name}, 状态: ${p.status}`);
      });
      urlCount++;
    }
  }
  if (urlCount === 0) console.log('✓ 无重复');

  // 检查相似名称（可能是同一家）
  console.log('\n=== 可疑相似名称 ===');
  const names = Object.keys(nameMap);
  let similarCount = 0;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const n1 = names[i].toLowerCase().replace(/[^a-z0-9]/g, '');
      const n2 = names[j].toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (n1 && n2 && (n1.includes(n2) || n2.includes(n1))) {
        console.log(`\n"${names[i]}" vs "${names[j]}"`);
        nameMap[names[i]].forEach(p => console.log(`  [${names[i]}] ID: ${p.id}, ${p.website_url || '(无网址)'}`));
        nameMap[names[j]].forEach(p => console.log(`  [${names[j]}] ID: ${p.id}, ${p.website_url || '(无网址)'}`));
        similarCount++;
      }
    }
  }
  if (similarCount === 0) console.log('✓ 无可疑相似');

  console.log('\n=== 总结 ===');
  console.log(`名称完全重复: ${nameCount} 组`);
  console.log(`Slug 重复: ${slugCount} 组`);
  console.log(`网址重复: ${urlCount} 组`);
  console.log(`可疑相似: ${similarCount} 组`);
}

checkDuplicates();
