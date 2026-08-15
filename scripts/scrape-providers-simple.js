const https = require('https');
const http = require('http');
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

// 获取页面 HTML
function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 简单的 HTML 解析辅助函数
function extractTableData(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  if (start === -1) return [];

  const end = html.indexOf(endMarker, start);
  const section = html.substring(start, end === -1 ? undefined : end);

  // 提取表格行
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = trRegex.exec(section)) !== null) {
    const rowHtml = match[1];
    const cells = [];
    const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = tdRegex.exec(rowHtml)) !== null) {
      const cellContent = cellMatch[1]
        .replace(/<[^>]+>/g, '') // 移除 HTML 标签
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      cells.push(cellContent);
    }

    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return rows;
}

// 提取链接
function extractLinks(html, pattern) {
  const links = [];
  const regex = new RegExp(`<a[^>]*href=["']([^"']+)["'][^>]*>(${pattern}[^<]*)<\/a>`, 'gi');
  let match;

  while ((match = regex.exec(html)) !== null) {
    links.push({ url: match[1], text: match[2].trim() });
  }

  return links;
}

// 抓取 apiranking.com
async function scrapeApiRanking() {
  console.log('\n=== 抓取 apiranking.com ===');

  try {
    const html = await fetchPage('https://www.apiranking.com');
    console.log(`✓ 获取页面成功 (${html.length} 字符)`);

    // 查找"通过检测"的服务商
    const providers = [];

    // 提取表格数据（需要根据实际页面结构调整）
    const rows = extractTableData(html, '<table', '</table>');

    console.log(`找到 ${rows.length} 行数据`);

    for (const row of rows) {
      // 假设格式: [序号, 名称, 网址, 状态, ...]
      if (row.length >= 4 && row[3].includes('通过')) {
        const name = row[1];
        const url = row[2];

        if (name && url && !name.includes('名称') && !name.includes('序号')) {
          providers.push({
            name,
            website_url: url.startsWith('http') ? url : `https://${url}`,
            description: null,
            source: 'apiranking.com'
          });
        }
      }
    }

    console.log(`✓ 找到 ${providers.length} 个通过检测的服务商`);
    return providers;

  } catch (error) {
    console.error('✗ 抓取失败:', error.message);
    return [];
  }
}

// 抓取 aiapirank.github.io (前3个)
async function scrapeAiapirank() {
  console.log('\n=== 抓取 aiapirank.github.io (前3) ===');

  try {
    const html = await fetchPage('https://aiapirank.github.io/');
    console.log(`✓ 获取页面成功 (${html.length} 字符)`);

    const providers = [];
    const rows = extractTableData(html, '<table', '</table>');

    console.log(`找到 ${rows.length} 行数据`);

    // 取前3个（跳过表头）
    let count = 0;
    for (const row of rows) {
      if (count >= 3) break;

      // 跳过表头
      if (row[0] && row[0].match(/^(排名|rank|#|序号)/i)) continue;

      if (row.length >= 2) {
        const name = row[1] || row[0]; // 名称可能在第0或第1列
        const urlMatch = html.match(new RegExp(`${name}[^<]*<a[^>]*href=["']([^"']+)["']`, 'i'));

        if (name && !name.match(/^(排名|名称|平台)/i)) {
          providers.push({
            name,
            website_url: urlMatch ? urlMatch[1] : null,
            description: null,
            source: 'aiapirank.github.io'
          });
          count++;
        }
      }
    }

    console.log(`✓ 提取前 ${providers.length} 个服务商`);
    return providers;

  } catch (error) {
    console.error('✗ 抓取失败:', error.message);
    return [];
  }
}

// 抓取 veridrop.org (前3个)
async function scrapeVeridrop() {
  console.log('\n=== 抓取 veridrop.org (前3) ===');

  try {
    const html = await fetchPage('https://veridrop.org/leaderboard');
    console.log(`✓ 获取页面成功 (${html.length} 字符)`);

    const providers = [];
    const rows = extractTableData(html, '<table', '</table>');

    console.log(`找到 ${rows.length} 行数据`);

    // 取前3个
    let count = 0;
    for (const row of rows) {
      if (count >= 3) break;

      // 跳过表头
      if (row[0] && row[0].match(/^(排名|rank|#)/i)) continue;

      if (row.length >= 2) {
        const name = row[1] || row[0];
        const urlMatch = html.match(new RegExp(`${name}[^<]*<a[^>]*href=["']([^"']+)["']`, 'i'));

        if (name && !name.match(/^(排名|名称|Provider)/i)) {
          providers.push({
            name,
            website_url: urlMatch ? urlMatch[1] : null,
            description: null,
            source: 'veridrop.org'
          });
          count++;
        }
      }
    }

    console.log(`✓ 提取前 ${providers.length} 个服务商`);
    return providers;

  } catch (error) {
    console.error('✗ 抓取失败:', error.message);
    return [];
  }
}

// 导入到数据库
async function importProviders(providers) {
  console.log(`\n=== 导入 ${providers.length} 个服务商到数据库 ===`);

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const provider of providers) {
    if (!provider.name) {
      console.log('⊘ 跳过: 名称为空');
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

// 主函数
async function main() {
  console.log('开始抓取服务商数据...\n');

  try {
    // 抓取三个来源
    const [apiranking, aiapirank, veridrop] = await Promise.all([
      scrapeApiRanking(),
      scrapeAiapirank(),
      scrapeVeridrop()
    ]);

    // 合并所有数据
    const allProviders = [...apiranking, ...aiapirank, ...veridrop];

    console.log(`\n总共抓取到 ${allProviders.length} 个服务商`);

    if (allProviders.length > 0) {
      await importProviders(allProviders);
    } else {
      console.log('\n⚠ 未抓取到任何数据，请检查网站结构是否变化');
    }

  } catch (error) {
    console.error('\n✗ 执行失败:', error);
  }
}

main();
