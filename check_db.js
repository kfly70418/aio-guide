const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const env = {}
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const t = line.trim()
  if (!t || t.startsWith('#')) return
  const i = t.indexOf('=')
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data, error } = await supabase
    .from('providers')
    .select('name, slug, status, verified_at')
    .eq('status', 'published')
    .order('sort_order', { ascending: false })
    .limit(35)

  if (error) throw error

  console.log(`已发布的服务商 (共 ${data.length} 家):\n`)
  data.forEach((p, i) => {
    const verified = p.verified_at ? '✅' : '⚠️'
    console.log(`${i+1}. ${verified} ${p.name} (${p.slug})`)
  })

  const newOnes = ['Micu', 'SSSAiCode', 'CCTQ', '78 Code']
  console.log('\n新增的服务商状态:')
  newOnes.forEach(name => {
    const found = data.find(p => p.name === name)
    console.log(`  ${found ? '✅' : '❌'} ${name} ${found ? `(${found.slug})` : ''}`)
  })
}

main().catch(e => console.error('错误:', e.message))
