const puppeteer = require('puppeteer');

// 指定 Chrome 可执行文件路径
const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-152.0.7977.42\\chrome-win64\\chrome.exe';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 字段映射说明
const FIELD_MAPPING = {
  // apiranking.com 字段映射
  apiranking: {
    name: 'name',              // 服务商名称
    website: 'website_url',    // 官网地址
    description: 'description', // 描述
    // verification_status: 'verified' (通过检测的标记为 verified)
  },
  // aiapirank.github.io 字段映射
  aiapirank: {
    name: 'name',
    url: 'website_url',
    // verification_status: 'verified'
  },
  // veridrop.org 字段映射
  veridrop: {
    name: 'name',
    website: 'website_url',
    // verification_status: 'verified'
  }
};

// 生成 slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[一-龥]/g, '') // 移除中文
    .replace(/[^\w\s-]/g, '')        // 移除特殊字符
    .replace(/\s+/g, '-')            // 空格转连字符
    .replace(/-+/g, '-')             // 多个连字符合并
    .replace(/^-|-$/g, '')           // 移除首尾连字符
    || 'provider-' + Date.now();     // 兜底
}

// 1. 抓取 apiranking.com
async function scrapeApiRanking(browser) {
  console.log('\n=== 抓取 apiranking.com ===');
  const page = await browser.newPage();

  try {
    await page.goto('https://www.apiranking.com', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // 等待表格加载
    await page.waitForSelector('table', { timeout: 10000 });

    const providers = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows
        .map(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return null;

          // 检查模型真假检测列（通常在第4或第5列）
          const verificationCell = cells[3] || cells[4];
          const verificationText = verificationCell?.textContent?.trim() || '';

          // 只抓取"通过检测"的服务商
          if (!verificationText.includes('通过') && !verificationText.includes('✓') && !verificationText.includes('√')) {
            return null;
          }

          const nameCell = cells[0];
          const name = nameCell?.textContent?.trim() || '';
          const website = nameCell?.querySelector('a')?.href || '';

          return {
            name,
            website_url: website,
            description: null, // apiranking 没有描述字段
            source: 'apiranking.com'
          };
        })
        .filter(Boolean);
    });

    console.log(`✓ 抓取到 ${providers.length} 个通过检测的服务商`);
    return providers;

  } catch (error) {
    console.error('抓取 apiranking.com 失败:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

// 2. 抓取 aiapirank.github.io 前3个
async function scrapeAiapirank(browser) {
  console.log('\n=== 抓取 aiapirank.github.io 前3个 ===');
  const page = await browser.newPage();

  try {
    await page.goto('https://aiapirank.github.io/', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // 等待列表加载
    await page.waitForSelector('.provider-list, table, .ranking-list', { timeout: 10000 });

    const providers = await page.evaluate(() => {
      // 尝试多种选择器
      let items = Array.from(document.querySelectorAll('.provider-item, table tbody tr, .ranking-item'));

      // 只取前3个
      items = items.slice(0, 3);

      return items.map(item => {
        let name = '';
        let website_url = '';

        // 尝试多种提取方式
        const nameEl = item.querySelector('.name, .provider-name, td:first-child, h3, h4');
        name = nameEl?.textContent?.trim() || '';

        const linkEl = item.querySelector('a[href]');
        website_url = linkEl?.href || '';

        return {
          name,
          website_url,
          description: null,
          source: 'aiapirank.github.io'
        };
      }).filter(p => p.name);
    });

    console.log(`✓ 抓取到前 ${providers.length} 个服务商`);
    return providers;

  } catch (error) {
    console.error('抓取 aiapirank.github.io 失败:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

// 3. 抓取 veridrop.org 前3个
async function scrapeVeridrop(browser) {
  console.log('\n=== 抓取 veridrop.org 前3个 ===');
  const page = await browser.newPage();

  try {
    await page.goto('https://veridrop.org/leaderboard', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // 等待排行榜加载
    await page.waitForSelector('table, .leaderboard, .ranking', { timeout: 10000 });

    const providers = await page.evaluate(() => {
      let rows = Array.from(document.querySelectorAll('table tbody tr, .leaderboard-item, .provider-card'));

      // 只取前3个
      rows = rows.slice(0, 3);

      return rows.map(row => {
        let name = '';
        let website_url = '';

        // 表格形式
        if (row.tagName === 'TR') {
          const cells = row.querySelectorAll('td');
          name = cells[1]?.textContent?.trim() || cells[0]?.textContent?.trim() || '';
          const link = row.querySelector('a[href]');
          website_url = link?.href || '';
        } else {
          // 卡片形式
          const nameEl = row.querySelector('.name, .provider-name, h3, h4');
          name = nameEl?.textContent?.trim() || '';
          const link = row.querySelector('a[href]');
          website_url = link?.href || '';
        }

        return {
          name,
          website_url,
          description: null,
          source: 'veridrop.org'
        };
      }).filter(p => p.name);
    });

    console.log(`✓ 抓取到前 ${providers.length} 个服务商`);
    return providers;

  } catch (error) {
    console.error('抓取 veridrop.org 失败:', error.message);
    return [];
  } finally {
    await page.close();
  }
}

// 保存到数据库
async function saveProviders(providers) {
  console.log('\n=== 保存到数据库 ===');

  for (const provider of providers) {
    if (!provider.name) {
      console.log('⊘ 跳过无名称的服务商');
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
      // 更新已有服务商，标记为已核验
      const { error } = await supabase
        .from('providers')
        .update({
          name: provider.name,
          website_url: provider.website_url || existing.website_url,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`✗ 更新失败 [${provider.name}]:`, error.message);
      } else {
        console.log(`✓ 已更新 [${provider.name}] (${provider.source})`);
      }
    } else {
      // 插入新服务商
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
        console.log(`✓ 已添加 [${provider.name}] (${provider.source})`);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('开始抓取服务商数据...\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // 抓取三个来源
    const [apiranking, aiapirank, veridrop] = await Promise.all([
      scrapeApiRanking(browser),
      scrapeAiapirank(browser),
      scrapeVeridrop(browser)
    ]);

    // 合并所有数据
    const allProviders = [...apiranking, ...aiapirank, ...veridrop];

    console.log(`\n=== 汇总 ===`);
    console.log(`总计抓取: ${allProviders.length} 个服务商`);
    console.log(`- apiranking.com: ${apiranking.length}`);
    console.log(`- aiapirank.github.io: ${aiapirank.length}`);
    console.log(`- veridrop.org: ${veridrop.length}`);

    // 保存到数据库
    if (allProviders.length > 0) {
      await saveProviders(allProviders);
    }

    console.log('\n✅ 完成！');

  } catch (error) {
    console.error('\n❌ 执行失败:', error);
  } finally {
    await browser.close();
  }
}

main();
