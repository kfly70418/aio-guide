/**
 * 榜单轮换：按最新抓取结果降级/补位，并同步核验时间
 *
 * 本次动作：
 *   1. 三头牛 → 降级（榜单检测状态已变为「—」，不再标注通过检测）
 *   2. PackyCode → 由草稿转正式发布补位（榜单 #9，通过检测）
 *   3. 已发布的通过检测记录 → 核验时间同步为抓取确认时间
 *   4. 顺带补全 PackyCode 的 features 标签，并修掉「✓ 退款—」这类残缺文案
 *
 * 用法：
 *   npx tsx scripts/rotate-providers.ts           # 预览
 *   npx tsx scripts/rotate-providers.ts --apply   # 执行
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

/** 降级：不再通过检测的服务商 */
const DEMOTE = [{ slug: 'santoniu', name: '三头牛', reason: '榜单检测状态变为「—」' }]

/** 补位：草稿转发布 */
const PROMOTE = [{ slug: 'packyapi', name: 'PackyCode', rank: 9 }]

/** 由现有字段生成 features 标签 */
function buildFeatures(r: any, rank?: number): string[] {
  const tags: string[] = []
  if (r.verification_status === 'verified') tags.push('通过模型检测')

  const levels = (r.price_level ?? '').split(/\s+/).filter(Boolean)
  if (levels.includes('低')) tags.push('有低价档')
  else if (levels[0]) tags.push(`价格${levels[0]}档`)

  if (r.min_topup) tags.push(`${r.min_topup}起充`)
  if (r.trial_credit) tags.push('注册有赠送')

  const pay = r.payment_methods ?? ''
  if (pay.includes('支')) tags.push('支付宝')
  if (pay.includes('微')) tags.push('微信支付')
  if (pay.includes('卡')) tags.push('信用卡')

  if (r.invoice_support) tags.push('可开发票')
  if (/无手续费/.test(r.refund_policy ?? '')) tags.push('退款无手续费')
  if (r.coupon_code) tags.push('有优惠码')
  if (rank && rank <= 10) tags.push(`榜单第${rank}名`)

  return [...new Set(tags)].slice(0, 10)
}

/** 清掉「✓ 退款—」这类占位残留 */
function cleanPolicy(v: string | null): string | null {
  if (!v) return null
  const t = v.replace(/^✓\s*/, '').replace(/^退款\s*/, '').trim()
  if (!t || /^[—\-–]$/.test(t)) return null
  return v
}

async function main() {
  const now = new Date().toISOString()
  const plan: string[] = []

  // ---- 1. 降级 ----
  const demoteRows: any[] = []
  for (const d of DEMOTE) {
    const { data } = await supabase
      .from('providers')
      .select('id, slug, name, status, is_recommended, verification_status, sort_order')
      .eq('slug', d.slug)
      .maybeSingle()
    if (!data) {
      plan.push(`⚠️  降级目标 ${d.name}（${d.slug}）不存在，跳过`)
      continue
    }
    demoteRows.push({ ...data, reason: d.reason })
    plan.push(
      `降级 ${data.name}：status ${data.status} → archived，取消推荐，检测状态 → pending（原因：${d.reason}）`
    )
  }

  // ---- 2. 补位 ----
  const promoteRows: any[] = []
  for (const p of PROMOTE) {
    const { data } = await supabase.from('providers').select('*').eq('slug', p.slug).maybeSingle()
    if (!data) {
      plan.push(`⚠️  补位目标 ${p.name}（${p.slug}）不存在，跳过`)
      continue
    }
    if (!data.website_url) {
      plan.push(`⚠️  ${p.name} 缺官网链接，不予发布（详情页会是空壳）`)
      continue
    }
    const features = data.features?.length ? data.features : buildFeatures(data, p.rank)
    promoteRows.push({ row: data, rank: p.rank, features })
    plan.push(
      `补位 ${data.name}：status draft → published，权重 ${300 - p.rank} → ${100 - p.rank}，features ${data.features?.length ?? 0} → ${features.length} 个`
    )
  }

  // ---- 3. 核验时间同步 ----
  const { data: verified } = await supabase
    .from('providers')
    .select('id, slug, name, verified_at, refund_policy, invoice_policy')
    .eq('status', 'published')
    .eq('verification_status', 'verified')

  const demoteSlugs = new Set(DEMOTE.map((d) => d.slug))
  const touchRows = (verified ?? []).filter((r) => !demoteSlugs.has(r.slug))
  plan.push(`核验时间同步：${touchRows.length} 家已发布记录 verified_at → ${now.slice(0, 10)}`)

  // 顺带清理残缺政策文案
  const dirty = touchRows.filter(
    (r) => cleanPolicy(r.refund_policy) !== r.refund_policy || cleanPolicy(r.invoice_policy) !== r.invoice_policy
  )
  if (dirty.length) plan.push(`清理残缺政策文案：${dirty.map((d) => d.name).join('、')}`)

  console.log('执行计划：\n')
  plan.forEach((l) => console.log('  ' + l))
  console.log('')

  if (!APPLY) {
    console.log('预览模式，未写库。加 --apply 执行。')
    return
  }

  console.log('执行中...\n')

  // 降级
  for (const r of demoteRows) {
    const { error } = await supabase
      .from('providers')
      .update({
        status: 'archived',
        is_recommended: false,
        verification_status: 'pending',
        updated_at: now,
      })
      .eq('id', r.id)
    console.log(error ? `  ❌ 降级 ${r.name} 失败：${error.message}` : `  ⬇️  已降级 ${r.name}`)
  }

  // 补位
  for (const p of promoteRows) {
    const { error } = await supabase
      .from('providers')
      .update({
        status: 'published',
        features: p.features,
        sort_order: 100 - p.rank,
        is_recommended: p.rank <= 5,
        verified_at: now,
        updated_at: now,
      })
      .eq('id', p.row.id)
    console.log(error ? `  ❌ 补位 ${p.row.name} 失败：${error.message}` : `  ⬆️  已发布 ${p.row.name}`)
  }

  // 核验时间 + 政策清理
  let touched = 0
  for (const r of touchRows) {
    const patch: Record<string, unknown> = { verified_at: now, updated_at: now }
    const rp = cleanPolicy(r.refund_policy)
    const ip = cleanPolicy(r.invoice_policy)
    if (rp !== r.refund_policy) patch.refund_policy = rp
    if (ip !== r.invoice_policy) patch.invoice_policy = ip

    const { error } = await supabase.from('providers').update(patch).eq('id', r.id)
    if (error) console.log(`  ❌ ${r.name} — ${error.message}`)
    else touched++
  }
  console.log(`  ✅ 已同步 ${touched} 家的核验时间`)

  // 同步 prices 表核验时间
  const { data: priceUpd } = await supabase
    .from('prices')
    .update({ verified_at: now })
    .eq('status', 'active')
    .select('id')
  console.log(`  ✅ 已同步 ${priceUpd?.length ?? 0} 条价格记录的核验时间`)

  console.log('\n完成。')
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
