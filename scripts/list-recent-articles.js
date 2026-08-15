const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) acc[match[1].trim()] = match[2].trim();
    return acc;
  }, {});

const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/articles');
url.searchParams.set('select', 'id,slug,title,category,published_at');
url.searchParams.set('status', 'eq.published');
url.searchParams.set('order', 'published_at.desc');
url.searchParams.set('limit', '30');

const options = {
  headers: {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const articles = JSON.parse(data);

    if (!Array.isArray(articles)) {
      console.error('数据格式错误:', articles);
      return;
    }

    console.log('=== 最新 30 篇文章 ===\n');

    const categoryMap = {
      tutorial: '教程',
      guide: '指南',
      news: '资讯',
      faq: '问答'
    };

    articles.forEach((a, i) => {
      const date = new Date(a.published_at).toLocaleDateString('zh-CN');
      const cat = categoryMap[a.category] || a.category || '未分类';

      console.log(`${i + 1}. [${cat}] ${a.title}`);
      console.log(`   slug: ${a.slug}`);
      console.log(`   发布: ${date}\n`);
    });

    console.log(`共 ${articles.length} 篇文章`);
  });
}).on('error', console.error);
