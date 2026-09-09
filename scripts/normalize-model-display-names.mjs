// Preview by default. Use --apply with the project's dotenv configuration to update names.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const corrections = {
  'gpt-56-sol': ['GPT-5.6 Sol', 'OpenAI'],
  'gpt-56-terra': ['GPT-5.6 Terra', 'OpenAI'],
  'gpt-56-luna': ['GPT-5.6 Luna', 'OpenAI'],
  'gpt-55': ['GPT-5.5', 'OpenAI'],
  'claude-sonnet-5': ['Claude Sonnet 5', 'Anthropic'],
  'claude-opus-5': ['Claude Opus 5', 'Anthropic'],
  'claude-opus-47': ['Claude Opus 4.7', 'Anthropic'],
  'claude-sonnet-46': ['Claude Sonnet 4.6', 'Anthropic'],
  'gemini-31-pro': ['Gemini 3.1 Pro', 'Google'],
  'gemini-35-flash': ['Gemini 3.5 Flash', 'Google'],
  'grok-45': ['Grok 4.5', 'xAI'],
  'grok-46': ['Grok 4.6', 'xAI'],
  'gpt-image-2': ['GPT Image 2', 'OpenAI'],
  // This record has no exact model ID in the imported data. Do not invent one.
  'gemini-image': ['Gemini 图像（型号待核验）', 'Google', 'Gemini: изображения (модель не уточнена)'],
}
async function query(q) {
  const r = await q
  if (r.error) throw r.error
  return r.data
}
const before = await query(db.from('models').select('*').in('slug', Object.keys(corrections)))
assert.equal(before.length, Object.keys(corrections).length)
assert(before.every(m => m.status === 'published'))
const translations = await query(db.from('translations').select('resource_id,field,value')
  .eq('resource_type', 'model').eq('locale', 'ru').in('resource_id', before.map(m => m.id)))
console.log(JSON.stringify(before.map(m => ({ slug: m.slug, before: m.name, after: corrections[m.slug][0] })), null, 2))
if (process.argv.includes('--apply')) {
  for (const m of before) {
    const [name, provider, ruName = name] = corrections[m.slug]
    if (m.name !== name || m.provider_official !== provider) {
      const changed = await query(db.from('models').update({ name, provider_official: provider })
        .eq('id', m.id).eq('updated_at', m.updated_at).select('id'))
      assert.equal(changed.length, 1, `Concurrent model edit: ${m.slug}`)
    }
    if (!translations.some(t => t.resource_id === m.id && t.field === 'name' && t.value === ruName)) {
      await query(db.from('translations').upsert({ resource_type: 'model', resource_id: m.id,
        locale: 'ru', field: 'name', value: ruName }, { onConflict: 'resource_type,resource_id,locale,field' }))
    }
  }
  const after = await query(db.from('models').select('*').in('id', before.map(m => m.id)))
  const stable = record => Object.fromEntries(Object.entries(record)
    .filter(([key]) => !['name', 'provider_official', 'updated_at'].includes(key)))
  for (const m of after) {
    assert.equal(m.name, corrections[m.slug][0])
    assert.deepEqual(stable(m), stable(before.find(b => b.id === m.id)))
  }
  console.log(JSON.stringify({ verified: true, normalizedModels: after.length, slugsAndPricesUnchanged: true }))
}
