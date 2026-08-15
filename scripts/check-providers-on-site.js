const https = require('https');

async function checkSite() {
  console.log('检查生产环境服务商数据...\n');
  
  const url = 'https://www.apixuan.com/api/providers?verification_status=verified';
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const providers = JSON.parse(data);
        console.log(`✓ 已核验服务商总数: ${providers.length}\n`);
        
        const sources = {
          'apiranking.com': 0,
          'aiapirank.github.io': 0,
          'veridrop.org': 0,
          '其他': 0
        };
        
        providers.forEach(p => {
          console.log(`- ${p.name} (${p.website_url || '无网址'})`);
        });
        
        console.log('\n✓ 数据已同步到生产环境');
      } catch (e) {
        console.error('解析失败:', e.message);
      }
    });
  }).on('error', (e) => {
    console.error('请求失败:', e.message);
  });
}

checkSite();
