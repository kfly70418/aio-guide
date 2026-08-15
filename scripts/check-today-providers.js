const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTodayProviders() {
  // 今天批量导入的 16 个
  const names = [
    'OpenOx', 'H API', 'LinkAI', 'AISKT', 'OpenAI-HK',
    'APIHub', 'API2D', 'AceDataCloud', 'GPT-API', 'AIchatOS',
    'DuiAPI', 'CUN.ai', 'Modelflare',
    'api.koozhan.com', 'wawapi.top', 'api-top.com'
  ];

  const { data: providers, error } = await supabase
    .from('providers')
    .select('*')
    .in('name', names);

  if (error) {
    console.error('查询失败:', error);
    return;
  }

  console.log(`今天导入的 ${providers.length} 个服务商详细信息：\n`);

  providers.forEach(p => {
    console.log(`【${p.name}】`);
    console.log(`  网址: ${p.website_url || '(无)'}`);
    console.log(`  描述: ${p.description || '(空)'}`);
    console.log(`  特性: ${p.features ? JSON.stringify(p.features) : '(空)'}`);
    console.log(`  最低充值: ${p.min_topup || '(空)'}`);
    console.log(`  试用额度: ${p.trial_credit || '(空)'}`);
    console.log(`  手续费: ${p.transaction_fee || '(空)'}`);
    console.log(`  发票: ${p.invoice_support ? '支持' : '不支持'}`);
    console.log('');
  });
}

checkTodayProviders();
