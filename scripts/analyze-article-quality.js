const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) acc[match[1].trim()] = match[2].trim();
    return acc;
  }, {});

// 分析单篇文章
function analyzeArticle(slug) {
  return new Promise((resolve, reject) => {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/articles');
    url.searchParams.set('select', 'title,content,summary,category');
    url.searchParams.set('slug', `eq.${slug}`);

    const options = {
      headers: { 'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const articles = JSON.parse(data);
        if (articles[0]) {
          const a = articles[0];

          console.log(`\n${'='.repeat(60)}`);
          console.log(`标题: ${a.title}`);
          console.log(`分类: ${a.category}`);
          console.log(`摘要: ${a.summary || '无'}`);
          console.log(`正文字数: ${a.content?.length || 0}`);

          if (a.content) {
            const lines = a.content.split('\n').filter(l => l.trim());
            console.log(`\n【开头分析】`);
            console.log(lines.slice(0, 3).join('\n'));

            console.log(`\n【结构检查】`);
            const h2Count = (a.content.match(/^## /gm) || []).length;
            const h3Count = (a.content.match(/^### /gm) || []).length;
            console.log(`- H2 标题数: ${h2Count}`);
            console.log(`- H3 标题数: ${h3Count}`);

            console.log(`\n【AI套话检测】`);
            const aiPhrases = [
              '在当今',
              '随着...的发展',
              '越来越多',
              '不容忽视',
              '至关重要',
              '总而言之',
              '综上所述'
            ];
            const found = aiPhrases.filter(p => a.content.includes(p));
            if (found.length > 0) {
              console.log(`⚠️  发现AI套话: ${found.join(', ')}`);
            } else {
              console.log(`✅ 未发现明显AI套话`);
            }
          }

          resolve();
        } else {
          reject(new Error('文章未找到'));
        }
      });
    }).on('error', reject);
  });
}

// 分析3篇代表性文章
(async () => {
  const samples = [
    'first-api-call-no-code',           // 教程
    'choose-api-relay-service-checklist', // 指南
    'api-relay-service-safe-or-not'    // 问答
  ];

  for (const slug of samples) {
    await analyzeArticle(slug);
  }

  console.log(`\n${'='.repeat(60)}\n`);
})();
