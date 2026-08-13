/**
 * 清理 providers 重复记录 + 修正异常 slug
 *
 * 背景：同一服务商存在两条记录 —— 一条带完整渠道/价格数据但 slug 异常，
 * 另一条 slug 干净但没有关联数据。保留有数据的那条，修好它的 slug，
 * 把空壳记录改为 archived（不删除，可回滚）。
 *
 * 用法：
 *   npx tsx scripts/dedupe-providers.ts           # 预览
 *   npx tsx scripts/dedupe-providers.ts --apply   # 执行
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv(): Record<string, string> {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) throw new Error('找不到 .env.local')
  const env: Record<string, string> = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)
const APPLY = process.argv.includes('--apply')

/** 期望的最终 slug */
const TARGET_SLUG: Record<string, string> = {
  'LMU AI · 灵眸': 'lmu-ai',
  'UU API': 'uu-api',
  三头牛: 'santoniu',
}

async function countChannels(providerId: string) {
  const { count } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
  return count ?? 0
}

async function main() {
  const { data: rows, error } = await supabase
    .from('providers')
    .select('id, slug, name, website_url, status')
  if (error) throw error

  // 按名称分组找重复
  const groups: Record<string, typeof rows> = {}
  for (const r of rows!) {
    const key = r.name ?? ''
    ;(groups[key] = groups[key] ?? []).push(r)
  }

  const plan: {
    name: string
    keep: { id: string; slug: string; channels: number }
    archive: { id: string; slug: string; channels: number }[]
    newSlug: string
  }[] = []

  for (const [name, list] of Object.entries(groups)) {
    if (list.length < 2) continue

    // 统计每条的渠道数，渠道多的胜出
    const withCounts = []
    for (const r of list) {
      withCounts.push({ ...r, channels: await countChannels(r.id) })
    }
    withCounts.sort((a, b) => b.channels - a.channels)

    const keep = withCounts[0]
    const archive = withCounts.slice(1)
    const newSlug = TARGET_SLUG[name] ?? keep.slug ?? ''

    plan.push({
      name,
      keep: { id: keep.id, slug: keep.slug ?? '', channels: keep.channels },
      archive: archive.map((a) => ({ id: a.id, slug: a.slug ?? '', channels: a.channels })),
      newSlug,
    })
  }

  if (plan.length === 0) {
    console.log('没有发现重复记录。')
    return
  }

  console.log('清理计划：\n')
  for (const p of plan) {
    console.log(`【${p.name}】`)
    console.log(`  保留 → id=${p.keep.id.slice(0, 8)}… slug="${p.keep.slug}" (${p.keep.channels} 个渠道)`)
    console.log(`         slug 改为 "${p.newSlug}"`)
    for (const a of p.archive) {
      console.log(`  归档 → id=${a.id.slice(0, 8)}… slug="${a.slug}" (${a.channels} 个渠道) → status=archived, slug 加 -dup 后缀`)
    }
    console.log('')
  }

  if (!APPLY) {
    console.log('预览模式。确认无误后加 --apply 执行。')
    console.log('注意：归档不删除数据，可随时把 status 改回 published 回滚。')
    return
  }

  console.log('执行中...\n')
  for (const p of plan) {
    // 1) 先归档并腾出 slug，避免唯一约束冲突
    for (const a of p.archive) {
      const dupSlug = `${a.slug || 'unnamed'}-dup-${a.id.slice(0, 6)}`
      const { error: e1 } = await supabase
        .from('providers')
        .update({ status: 'archived', slug: dupSlug })
        .eq('id', a.id)
      console.log(e1 ? `  ❌ 归档 ${p.name} 失败：${e1.message}` : `  ✅ 已归档 ${p.name}（slug → ${dupSlug}）`)
    }

    // 2) 再把保留记录的 slug 改成目标值
    if (p.keep.slug !== p.newSlug) {
      const { error: e2 } = await supabase
        .from('providers')
        .update({ slug: p.newSlug })
        .eq('id', p.keep.id)
      console.log(e2 ? `  ❌ 改 slug 失败：${e2.message}` : `  ✅ ${p.name} slug → ${p.newSlug}`)
    }
  }

  console.log('\n完成。')
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
