const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CONFIG = {
  'DuiAPI': 'core',
  'wawapi.top': 'core',
  'api-top.com': 'core',
  'api.koozhan.com': 'core',
  'API2D': 'full',
  'OpenAI-HK': 'full',
  'APIHub': 'full',
  'LinkAI': 'full',
  'CUN.ai': 'common',
  'Modelflare': 'common',
  'AIchatOS': 'common',
  'AISKT': 'common',
  'AceDataCloud': 'common',
  'GPT-API': 'common',
};

(async () => {
  const { data: models } = await supabase.from('models').select('id, name, family').eq('status', 'published');
  const { data: providers } = await supabase.from('providers').select('id, name, slug').eq('verification_status', 'verified');

  for (const p of providers) {
    const s = CONFIG[p.name];
    if (!s) continue;

    let ms = [];
    if (s === 'full') ms = models;
    else if (s === 'core') ms = models.filter(m => 
      (m.family === 'Claude' && (m.name.includes('Sonnet') || m.name.includes('Opus'))) ||
      (m.family === 'GPT' && (m.name.includes('o1') || m.name.includes('o3') || m.name.includes('4o'))) ||
      (m.family === 'Gemini' && (m.name.includes('2.0') || m.name.includes('1.5 Pro')))
    );
    else ms = models.filter(m =>
      (m.family === 'Claude' && (m.name.includes('Sonnet') || m.name.includes('Haiku'))) ||
      (m.family === 'GPT' && (m.name.includes('4o') || m.name.includes('3.5'))) ||
      (m.family === 'Gemini' && m.name.includes('1.5'))
    );

    let { data: ch } = await supabase.from('channels').select('id').eq('provider_id', p.id);
    let cid;
    if (ch && ch[0]) cid = ch[0].id;
    else {
      const { data: nc } = await supabase.from('channels').insert({provider_id: p.id, name: '默认渠道', slug: p.slug + '-default', status: 'active'}).select('id').single();
      cid = nc.id;
    }

    await supabase.from('prices').delete().eq('channel_id', cid);
    await supabase.from('prices').insert(ms.map(m => ({channel_id: cid, model_id: m.id, status: 'active', input_price: 0, output_price: 0, currency: 'CNY'})));
    
    console.log(`✅ ${p.name}: ${ms.length} 个模型`);
  }
})();
