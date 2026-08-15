const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importArticle(slug) {
  try {
    // 读取升级后的文章
    const filePath = path.join(__dirname, 'upgraded-articles', `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // 解析 frontmatter
    const lines = content.split('\n');
    const meta = {};
    let contentStart = 0;

    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();

      if (line.startsWith('**SEO Title**:')) {
        meta.seo_title = line.replace('**SEO Title**:', '').trim();
      } else if (line.startsWith('**SEO Description**:')) {
        meta.seo_description = line.replace('**SEO Description**:', '').trim();
      } else if (line.startsWith('**Slug**:')) {
        meta.slug = line.replace('**Slug**:', '').trim();
      } else if (line.startsWith('**Category**:')) {
        meta.category = line.replace('**Category**:', '').trim();
      } else if (line === '---' && i > 0) {
        contentStart = i + 1;
        break;
      }
    }

    const mainContent = lines.slice(contentStart).join('\n').trim();

    console.log(`\n📝 准备导入: ${slug}`);
    console.log(`   Title: ${meta.seo_title}`);
    console.log(`   Category: ${meta.category}`);
    console.log(`   Content Length: ${mainContent.length} chars`);

    // 更新数据库
    const { data, error } = await supabase
      .from('articles')
      .update({
        content: mainContent,
        title: meta.seo_title,
        summary: meta.seo_description,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select();

    if (error) {
      console.error(`❌ 导入失败: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.error(`❌ 未找到对应记录: ${slug}`);
      return;
    }

    console.log(`✅ 导入成功: ${slug}`);

  } catch (err) {
    console.error(`❌ 导入出错: ${err.message}`);
  }
}

// 批量导入
async function batchImport(slugs) {
  console.log(`\n🚀 开始批量导入 ${slugs.length} 篇文章...\n`);

  for (const slug of slugs) {
    await importArticle(slug);
    await new Promise(resolve => setTimeout(resolve, 500)); // 避免并发过快
  }

  console.log(`\n✅ 批量导入完成！\n`);
}

// 从命令行参数获取 slug 列表
const slugs = process.argv.slice(2);

if (slugs.length === 0) {
  console.error('❌ 请提供至少一个文章 slug');
  console.log('\n用法:');
  console.log('  node import-upgraded-article.js <slug1> <slug2> ...');
  console.log('\n或批量导入所有:');
  console.log('  node import-upgraded-article.js build-multi-provider-backup choose-api-relay-service-checklist ...');
  process.exit(1);
}

batchImport(slugs);
