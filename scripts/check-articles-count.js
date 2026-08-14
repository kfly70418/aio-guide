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
url.searchParams.set('select', '*');
url.searchParams.set('status', 'eq.published');

const options = {
  headers: {
    'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Prefer': 'count=exact'
  }
};

https.get(url, options, (res) => {
  const count = res.headers['content-range']?.split('/')[1];
  console.log('已发布文章总数:', count);
  console.log('每页显示数量: 10');
  console.log('总页数:', Math.ceil(Number(count || 0) / 10));
}).on('error', console.error);
