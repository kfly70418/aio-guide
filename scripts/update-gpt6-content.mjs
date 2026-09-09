// Run with dotenv; default is a read-only preview. --apply updates only GPT-6 content.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const apply = process.argv.includes('--apply')
const checkedOn = '2026-09-09'
const sources = {
  'h-api': 'https://hapiopen.cc/api/public/pricing',
  openox: 'https://openox.tech/',
  apinebula: 'https://apinebula.ai/api/pricing',
  aitunnel: 'https://aitunnel.ru/',
  bothub: 'https://bothub.chat/ru/models',
}
const model = {
  slug: 'gpt-6-astra', name: 'GPT-6 Astra', family: 'GPT', provider_official: 'OpenAI',
  description: 'GPT-6 Astra 是 OpenAI 面向复杂推理、编程、研究和文档任务的模型，支持文本与图片输入、文本输出。官方标准文本价格为输入 $10、输出 $50 / 百万 token；超过 272K 输入 token 的长上下文请求另有计费规则。中转站的可用渠道与实际价格需单独确认。资料查阅日期：2026-09-09。',
  official_price_input: 10, official_price_output: 50, sort_order: 1010,
}
const ruDescription = 'GPT-6 Astra — модель OpenAI для сложных задач рассуждения, программирования, исследований и работы с документами. Принимает текст и изображения, возвращает текст. Стандартная цена текстовых токенов у OpenAI: $10 за 1 млн входных и $50 за 1 млн выходных токенов; для запросов с более чем 272 тыс. входных токенов действуют другие ставки. Доступность и тарифы API-посредников нужно проверять отдельно. Данные проверены по документации 9 сентября 2026 года.'
async function query(q) {
  const r = await q
  if (r.error) throw r.error
  return r.data
}
const before = await query(db.from('providers').select('*').in('slug', Object.keys(sources)))
assert.equal(before.length, Object.keys(sources).length)
assert(before.every(p => p.status === 'published'))
const translations = await query(db.from('translations').select('*')
  .eq('resource_type', 'provider').eq('locale', 'ru').in('resource_id', before.map(p => p.id)))
const planned = before.map(p => {
  const ru = translations.filter(t => t.resource_id === p.id)
  const description = ru.find(t => t.field === 'description')
  const features = ru.find(t => t.field === 'features')
  assert(description?.value?.trim(), `Missing Russian description: ${p.slug}`)
  const ruFeatures = features ? JSON.parse(features.value) : []
  assert(Array.isArray(p.features) && Array.isArray(ruFeatures))
  const zhNote = `官网公开模型目录已列出 GPT-6 Astra（${checkedOn} 查阅），尚未进行调用实测；具体渠道、权限与计费以服务商为准。`
  const ruNote = 'GPT-6 Astra есть в публичном каталоге провайдера на 9 сентября 2026 года. Тестовый вызов не проводился; доступ для конкретного аккаунта и тариф следует уточнить у провайдера.'
  const zhBase = p.description?.trim() || ''
  const zhSeparator = !zhBase || /[。！？.!?]$/.test(zhBase) ? ' ' : '。'
  return {
    before: p,
    description: p.description?.includes(zhNote) ? p.description : `${zhBase}${zhSeparator}${zhNote}`.trim(),
    features: ['GPT-6 Astra（官网已列出）', ...p.features.filter(f => !/GPT-6 Astra/i.test(f))],
    ruDescription: description.value.includes(ruNote) ? description.value : `${description.value.trim()} ${ruNote}`,
    ruFeatures: ['GPT-6 Astra — есть в каталоге', ...ruFeatures.filter(f => !/GPT-6 Astra/i.test(f))],
  }
})
console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', model, sources, providers: planned.map(p => ({ slug: p.before.slug, description: p.description, features: p.features })) }, null, 2))
if (apply) {
  let existing = await query(db.from('models').select('id,status').eq('slug', model.slug).maybeSingle())
  if (!existing) existing = await query(db.from('models').insert({ ...model, status: 'draft' }).select('id,status').single())
  else await query(db.from('models').update(model).eq('id', existing.id))
  await query(db.from('translations').upsert([
    { resource_type: 'model', resource_id: existing.id, locale: 'ru', field: 'name', value: model.name },
    { resource_type: 'model', resource_id: existing.id, locale: 'ru', field: 'description', value: ruDescription },
  ], { onConflict: 'resource_type,resource_id,locale,field' }))
  await query(db.from('models').update({ status: 'published' }).eq('id', existing.id))
  for (const p of planned) {
    const changed = await query(db.from('providers').update({ description: p.description, features: p.features })
      .eq('id', p.before.id).eq('updated_at', p.before.updated_at).select('id'))
    assert.equal(changed.length, 1, `Concurrent provider edit: ${p.before.slug}`)
    await query(db.from('translations').upsert([
      { resource_type: 'provider', resource_id: p.before.id, locale: 'ru', field: 'description', value: p.ruDescription },
      { resource_type: 'provider', resource_id: p.before.id, locale: 'ru', field: 'features', value: JSON.stringify(p.ruFeatures) },
    ], { onConflict: 'resource_type,resource_id,locale,field' }))
  }
  const after = await query(db.from('providers').select('*').in('id', before.map(p => p.id)))
  for (const p of after) {
    const original = before.find(b => b.id === p.id)
    const omit = (record) => Object.fromEntries(Object.entries(record)
      .filter(([key]) => !['description', 'features', 'updated_at'].includes(key)))
    assert.deepEqual(omit(p), omit(original), `Unrelated fields changed: ${p.slug}`)
    assert(p.features.includes('GPT-6 Astra（官网已列出）'))
  }
  const published = await query(db.from('models').select('id,name,status').eq('id', existing.id).single())
  assert.equal(published.status, 'published')
  console.log(JSON.stringify({ verified: true, model: published, providers: after.map(p => p.slug), pricesAdded: 0 }))
}
