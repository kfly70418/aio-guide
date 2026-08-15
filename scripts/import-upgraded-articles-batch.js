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

// 解析 YAML frontmatter
function parseFrontmatter(content) {
  const lines = content.split('\n');

  // 找到 frontmatter 的开始和结束
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (startIndex === -1) {
        startIndex = i;
      } else {
        endIndex = i;
        break;
      }
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('无法解析 frontmatter');
  }

  // 解析 frontmatter
  const frontmatterLines = lines.slice(startIndex + 1, endIndex);
  const meta = {};

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // 去除引号
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // 处理数组（tags）
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    }

    meta[key] = value;
  }

  // 提取正文内容
  const mainContent = lines.slice(endIndex + 1).join('\n').trim();

  return { meta, content: mainContent };
}

async function importArticle(filePath) {
  try {
    const fileName = path.basename(filePath, '.md');

    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      return false;
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { meta, content } = parseFrontmatter(rawContent);

    console.log(`\n📝 准备导入: ${meta.slug}`);
    console.log(`   Title: ${meta.seo_title || meta.title}`);
    console.log(`   Category: ${meta.category}`);
    console.log(`   Status: ${meta.status}`);
    console.log(`   Content Length: ${content.length} chars`);

    // 准备更新数据
    const updateData = {
      content: content,
      title: meta.seo_title || meta.title,
      summary: meta.seo_description || meta.summary,
      updated_at: new Date().toISOString()
    };

    // 更新数据库
    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('slug', meta.slug)
      .select();

    if (error) {
      console.error(`❌ 导入失败: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      console.error(`❌ 未找到对应记录: ${meta.slug}`);
      return false;
    }

    console.log(`✅ 导入成功: ${meta.slug}`);
    return true;

  } catch (err) {
    console.error(`❌ 导入出错: ${err.message}`);
    console.error(err.stack);
    return false;
  }
}

// 批量导入 upgraded-articles 目录下的所有文章
async function batchImportAll() {
  const upgradeDir = path.join(__dirname, '..', 'upgraded-articles');

  if (!fs.existsSync(upgradeDir)) {
    console.error(`❌ 目录不存在: ${upgradeDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(upgradeDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(upgradeDir, f));

  console.log(`\n🚀 开始批量导入 ${files.length} 篇文章...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const success = await importArticle(file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 300)); // 避免并发过快
  }

  console.log(`\n📊 导入统计:`);
  console.log(`   ✅ 成功: ${successCount} 篇`);
  console.log(`   ❌ 失败: ${failCount} 篇`);
  console.log(`   📝 总计: ${files.length} 篇\n`);
}

batchImportAll();
