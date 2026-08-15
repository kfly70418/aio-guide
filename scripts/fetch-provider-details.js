const https = require('https');
const http = require('http');
const { URL } = require('url');

const providers = [
  { name: 'OpenAI-HK', url: 'https://openai-hk.com' },
  { name: 'API2D', url: 'https://api2d.com' },
  { name: 'AIchatOS', url: 'https://aichatos.cloud' },
  { name: 'CUN.ai', url: 'https://cun.ai' },
  { name: 'wawapi.top', url: 'https://wawapi.top' },
  { name: 'AISKT', url: 'https://aiskt.com' },
  { name: 'APIHub', url: 'https://apihub.bot' },
  { name: 'AceDataCloud', url: 'https://www.acedatcloud.com' },
  { name: 'GPT-API', url: 'https://gpt-api.us' },
  { name: 'DuiAPI', url: 'https://duiapi.com' },
  { name: 'Modelflare', url: 'https://modelflare.com' },
  { name: 'api.koozhan.com', url: 'https://api.koozhan.com' },
  { name: 'api-top.com', url: 'https://api-top.com' }
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ status: res.statusCode, html: data });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function extractInfo(html, providerName) {
  const info = {
    description: '',
    min_topup: null,
    trial_credit: null,
    transaction_fee: null,
    features: []
  };

  // 转小写便于匹配
  const text = html.toLowerCase();
  
  // 提取最低充值 - 常见模式
  const topupPatterns = [
    /最低充值[：:]\s*[¥￥]?(\d+(?:\.\d+)?)[元]?/i,
    /起充[：:]\s*[¥￥]?(\d+(?:\.\d+)?)[元]?/i,
    /(\d+)[元]?起充/i,
    /minimum.*?[¥￥$](\d+)/i
  ];
  
  for (const pattern of topupPatterns) {
    const match = html.match(pattern);
    if (match) {
      info.min_topup = `¥${match[1]}`;
      break;
    }
  }

  // 提取试用额度
  const trialPatterns = [
    /赠送?\s*(\d+(?:\.\d+)?)\s*[美]?[刀元]/i,
    /免费\s*(\d+(?:\.\d+)?)\s*[$刀]/i,
    /trial.*?(\d+(?:\.\d+)?)/i,
    /新用户.*?(\d+(?:\.\d+)?)\s*[$美刀]/i
  ];
  
  for (const pattern of trialPatterns) {
    const match = html.match(pattern);
    if (match) {
      info.trial_credit = `$${match[1]}`;
      break;
    }
  }

  // 提取手续费信息
  if (text.includes('无手续费') || text.includes('0手续费')) {
    info.transaction_fee = '无手续费';
  } else if (text.includes('手续费')) {
    const feeMatch = html.match(/(\d+(?:\.\d+)?%?)[\s]*手续费/i);
    if (feeMatch) {
      info.transaction_fee = `${feeMatch[1]}手续费`;
    }
  }

  // 提取特性
  const featureKeywords = [
    '支持开票', '发票', '稳定', '24小时', '客服', 
    '多模型', 'GPT', 'Claude', 'Gemini'
  ];
  
  featureKeywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      if (!info.features.includes(keyword)) {
        info.features.push(keyword);
      }
    }
  });

  // 生成简单描述
  const desc = html.substring(0, 500);
  const titleMatch = desc.match(/<title>([^<]+)<\/title>/i);
  const h1Match = desc.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const metaMatch = desc.match(/<meta[^>]*description[^>]*content=["']([^"']+)["']/i);
  
  if (metaMatch && metaMatch[1]) {
    info.description = metaMatch[1].trim().substring(0, 200);
  } else if (h1Match && h1Match[1]) {
    info.description = h1Match[1].trim() + ' - AI API 中转服务';
  } else if (titleMatch && titleMatch[1]) {
    info.description = titleMatch[1].trim();
  }

  return info;
}

async function fetchAll() {
  console.log('开始抓取服务商详情...\n');
  
  for (const provider of providers) {
    console.log(`\n【${provider.name}】正在访问 ${provider.url}...`);
    
    try {
      const { status, html } = await fetchPage(provider.url);
      console.log(`  状态码: ${status}`);
      
      if (status === 200) {
        const info = extractInfo(html, provider.name);
        console.log(`  描述: ${info.description || '(未提取到)'}`);
        console.log(`  最低充值: ${info.min_topup || '(未找到)'}`);
        console.log(`  试用额度: ${info.trial_credit || '(未找到)'}`);
        console.log(`  手续费: ${info.transaction_fee || '(未找到)'}`);
        console.log(`  特性: ${info.features.join(', ') || '(未找到)'}`);
        
        // 保存到临时文件
        require('fs').appendFileSync('provider-details.txt', 
          `${provider.name}|${info.description}|${info.min_topup}|${info.trial_credit}|${info.transaction_fee}|${info.features.join(';')}\n`
        );
      } else {
        console.log(`  ⚠️ 非 200 状态码`);
      }
      
      // 延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.log(`  ❌ 访问失败: ${err.message}`);
    }
  }
  
  console.log('\n✓ 抓取完成，结果保存在 provider-details.txt');
}

fetchAll();
