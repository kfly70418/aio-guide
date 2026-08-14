// 探测数据库当前状态：表是否可访问、rate 列是否已存在
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
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const tables = [
  'profiles',
  'providers',
  'models',
  'channels',
  'prices',
  'price_history',
  'articles',
  'click_events',
  'audit_logs',
]

console.log('=== 表可访问性与行数 ===')
for (const t of tables) {
  const { count, error } = await supabase
    .from(t)
    .select('*', { count: 'exact', head: true })
  console.log(
    `${t.padEnd(16)} ${error ? `错误: ${error.message}` : `${count} 行`}`
  )
}

console.log('\n=== prices.rate 列是否存在 ===')
const { error: rateErr } = await supabase.from('prices').select('rate').limit(1)
console.log(rateErr ? `缺失: ${rateErr.message}` : '已存在')

console.log('\n=== price_history.rate_new 列是否存在 ===')
const { error: rnErr } = await supabase
  .from('price_history')
  .select('rate_new')
  .limit(1)
console.log(rnErr ? `缺失: ${rnErr.message}` : '已存在')

console.log('\n=== 管理员账号 ===')
const { data: profiles, error: pErr } = await supabase
  .from('profiles')
  .select('id, email, role, is_active')
console.log(pErr ? `错误: ${pErr.message}` : JSON.stringify(profiles, null, 2))
