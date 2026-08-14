// 写入一组真实的测试记录,用于人工验收。
// 使用 service role key,仅在本地运行。
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path) {
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

const env = loadEnv('.env.local')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: profile } = await admin
  .from('profiles')
  .select('id')
  .eq('is_active', true)
  .limit(1)
  .single()

const adminId = profile.id
const stamp = { created_by: adminId, updated_by: adminId }

// rate 列是否可用(迁移 011 是否已执行)
const { error: rateErr } = await admin.from('prices').select('rate').limit(1)
const hasRate = !rateErr
console.log(`prices.rate 列:${hasRate ? '可用' : '不存在(迁移 011 未执行)'}\n`)

// ---------- 1. 服务商:一个已发布 + 一个草稿 ----------
const { data: pubProvider, error: e1 } = await admin
  .from('providers')
  .upsert(
    {
      slug: 'test-relay-published',
      name: '测试中转站(已发布)',
      name_en: 'Test Relay Published',
      website_url: 'https://example.com',
      description:
        '这是一条用于验收的测试记录。已发布状态,应当出现在前台首页和中转站列表中。简介长度超过 20 字,因此也会进入 sitemap。',
      features: ['支持 Claude', '支持 GPT', '按量计费'],
      is_recommended: true,
      status: 'published',
      sort_order: 100,
      verified_at: new Date().toISOString(),
      ...stamp,
    },
    { onConflict: 'slug' }
  )
  .select()
  .single()
if (e1) throw new Error(`服务商(已发布)写入失败: ${e1.message}`)
console.log(`✓ 服务商(已发布) ${pubProvider.name}  slug=${pubProvider.slug}`)

const { data: draftProvider, error: e2 } = await admin
  .from('providers')
  .upsert(
    {
      slug: 'test-relay-draft',
      name: '测试中转站(草稿)',
      description: '草稿状态的测试记录,前台不应该看到它。',
      status: 'draft',
      ...stamp,
    },
    { onConflict: 'slug' }
  )
  .select()
  .single()
if (e2) throw new Error(`服务商(草稿)写入失败: ${e2.message}`)
console.log(`✓ 服务商(草稿)   ${draftProvider.name}  slug=${draftProvider.slug}`)

// ---------- 2. 模型 ----------
const { data: model, error: e3 } = await admin
  .from('models')
  .upsert(
    {
      slug: 'test-model-sonnet',
      name: 'claude-sonnet-test',
      family: 'Claude',
      provider_official: 'Anthropic',
      description: '用于验收的测试模型记录。',
      official_price_input: 3.0,
      official_price_output: 15.0,
      status: 'published',
      ...stamp,
    },
    { onConflict: 'slug' }
  )
  .select()
  .single()
if (e3) throw new Error(`模型写入失败: ${e3.message}`)
console.log(`✓ 模型           ${model.name}`)

// ---------- 3. 渠道:主渠道 + 备用渠道 ----------
const { data: existingChannels } = await admin
  .from('channels')
  .select('id, name')
  .eq('provider_id', pubProvider.id)

const channelDefs = [
  { name: '官方直连', description: '主渠道,优先展示', is_primary: true, priority: 10 },
  { name: '备用线路', description: '第二条渠道,用于验证一个服务商挂多渠道', is_primary: false, priority: 5 },
]

const channels = []
for (const def of channelDefs) {
  const found = existingChannels?.find((c) => c.name === def.name)
  if (found) {
    channels.push(found)
    console.log(`· 渠道已存在     ${def.name}`)
    continue
  }
  const { data, error } = await admin
    .from('channels')
    .insert({ provider_id: pubProvider.id, status: 'active', ...def, ...stamp })
    .select()
    .single()
  if (error) throw new Error(`渠道 ${def.name} 写入失败: ${error.message}`)
  channels.push(data)
  console.log(`✓ 渠道           ${data.name}`)
}

// ---------- 4. 价格 ----------
const priceBase = {
  channel_id: channels[0].id,
  model_id: model.id,
  price_input: 1.5,
  price_output: 7.5,
  currency: 'CNY',
  effective_date: new Date().toISOString().slice(0, 10),
  notes: '验收测试报价,首充送 20%',
  status: 'active',
  verified_at: new Date().toISOString(),
  ...stamp,
}
if (hasRate) priceBase.rate = 0.5

const { data: price, error: e4 } = await admin
  .from('prices')
  .upsert(priceBase, { onConflict: 'channel_id,model_id' })
  .select()
  .single()
if (e4) throw new Error(`价格写入失败: ${e4.message}`)
console.log(
  `✓ 价格           输入 ${price.price_input} / 输出 ${price.price_output}` +
    (hasRate ? ` / 倍率 ${price.rate}` : ' (无倍率列)')
)

// 第二条渠道也挂一条价格,方便看多渠道效果
const price2Base = {
  channel_id: channels[1].id,
  model_id: model.id,
  price_input: 1.8,
  price_output: 9.0,
  currency: 'CNY',
  effective_date: new Date().toISOString().slice(0, 10),
  status: 'active',
  verified_at: new Date().toISOString(),
  ...stamp,
}
if (hasRate) price2Base.rate = 0.6

const { error: e4b } = await admin
  .from('prices')
  .upsert(price2Base, { onConflict: 'channel_id,model_id' })
if (e4b) throw new Error(`第二条价格写入失败: ${e4b.message}`)
console.log('✓ 价格(备用渠道) 输入 1.8 / 输出 9.0')

// ---------- 5. 改一次价格,验证历史记录触发器 ----------
const newInput = Number(price.price_input) === 1.6 ? 1.5 : 1.6
const { error: e5 } = await admin
  .from('prices')
  .update({ price_input: newInput, updated_by: adminId })
  .eq('id', price.id)
if (e5) throw new Error(`价格改动失败: ${e5.message}`)

const { data: history, error: e6 } = await admin
  .from('price_history')
  .select('change_type, price_input_old, price_input_new, changed_at')
  .eq('price_id', price.id)
  .order('changed_at', { ascending: false })
if (e6) throw new Error(`读取价格历史失败: ${e6.message}`)
console.log(`✓ 价格历史       共 ${history.length} 条`)
for (const h of history) {
  console.log(
    `    ${h.change_type}: ${h.price_input_old ?? '—'} → ${h.price_input_new}`
  )
}

// ---------- 6. 文章:一个已发布 + 一个草稿 ----------
const { data: pubArticle, error: e7 } = await admin
  .from('articles')
  .upsert(
    {
      slug: 'test-article-published',
      title: '测试教程:如何接入中转站 API(已发布)',
      summary: '这是一条用于验收的已发布文章,前台教程列表应当能看到。',
      content: '## 这是测试文章\n\n用于验证 Markdown 渲染与发布流程。\n\n### 步骤\n\n1. 注册账号并充值\n2. 在后台创建 API Key\n3. 把 base_url 换成中转站地址\n\n```bash\ncurl https://example.com/v1/chat/completions \\n  -H "Authorization: Bearer YOUR_KEY"\n```\n\n> 价格以服务商官网实际计费为准。\n',
      category: 'tutorial',
      tags: ['测试', '接入教程'],
      related_provider_id: pubProvider.id,
      status: 'published',
      published_at: new Date().toISOString(),
      ...stamp,
    },
    { onConflict: 'slug' }
  )
  .select()
  .single()
if (e7) throw new Error(`文章(已发布)写入失败: ${e7.message}`)
console.log(`✓ 文章(已发布)   ${pubArticle.title}`)

const { error: e8 } = await admin.from('articles').upsert(
  {
    slug: 'test-article-draft',
    title: '测试草稿文章(前台不可见)',
    content: '草稿内容,前台不应该出现。',
    category: 'guide',
    status: 'draft',
    ...stamp,
  },
  { onConflict: 'slug' }
)
if (e8) throw new Error(`文章(草稿)写入失败: ${e8.message}`)
console.log('✓ 文章(草稿)     测试草稿文章(前台不可见)')

// ---------- 7. 用匿名 key 验证 RLS ----------
console.log('\n=== 用匿名 key 验证 RLS(模拟未登录访客)===')
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const checks = [
  ['已发布服务商可见'
