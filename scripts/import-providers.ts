/**
 * 从导出的 JSON 文件导入服务商数据到数据库
 *
 * 用法：
 *   npx tsx scripts/import-providers.ts path/to/providers_2026-08-13_xxx.json
 *   npx tsx scripts/import-providers.ts path/to/providers_2026-08-13_xxx.json --apply
 *   npx tsx scripts/import-providers.ts path/to/providers_2026-08-13_xxx.json --apply --no-new
 *
 * 不加 --apply 为预览模式。
 * --no-new 只更新已有记录，不新增草稿。
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
const NO_NEW = process.argv.includes('--no-new')
const filepath = process.argv.find(
  (a) => a.endsWith('.json') && !a.includes('node_modules')
)

if (!filepath) {
  console.error('用法: npx tsx scripts/import-providers.ts <文件路径> [--apply] [--no-new]')
  process.exit(1)
}

if (!fs.existsSync(filepath)) {
  console.error(`文件不存在: ${filepath}`)
  process.exit(1)
}

function slugify(name: string, domain: string | null) {
  const base = (domain ? domain.split('.')[0] : name)
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `provider-${Math.random().toString(36).slice(2, 7)}`
}

/** 将榜单数据转为数据库字段 */
function toPatch(p: any) {
  let refundPolicy = p.refund_policy
  if (refundPolicy && !/^✓/.test(refundPolicy)) {
    refundPolicy = `✓ 退款${refundPolicy}`
  }
  if (refundPolicy && /^✓\s*退款\s*[—\-–]?\s*$/.test(refundPolicy)) refundPolicy = null

  let invoicePolicy = p.invoice_policy
  if (invoicePolicy && !/不可开票|不支持/.test(invoicePolicy) && !/^✓/.test(invoicePolicy)) {
    invoicePolicy = `✓ ${invoicePolicy}`
  }
  if (invoicePolicy && /^✓\s*[—\-–]?\s*$/.test(invoicePolicy)) invoicePolicy = null

  const invoiceSupport = invoicePolicy ? !/不可开票|不支持/.test(invoicePolicy) : false

  let transactionFee: string | null = null
  if (p.refund_policy) {
    transactionFee = /无手续费/.test(p.refund_policy) ? '退款无手续费' : `退款${p.refund_policy}`
  }

  return {
    price_level: p.price_level,
    min_topup: p.min_topup,
    trial_credit: p.trial_credit?.replace(/^🎁\s*/, '') ?? null,
    refund_policy: refundPolicy,
    invoice_policy: invoicePolicy,
    invoice_support: invoiceSupport,
    transaction_fee: transactionFee,
    coupon_note: p.coupon_note,
    coupon_code: p.coupon_code,
    verification_status: 'verified' as const,
    website_url: p.website_url,
    domain: p.domain,
  }
}

async function main() {
  console.log(`读取文件: ${filepath}\n`)
  const raw = fs.readFileSync(filepath, 'utf8')
  const data = JSON.parse(raw)

  if (!data.meta || !Array.isArray(data.providers)) {
    console.error('文件格式不正确，缺少 meta 或 providers 字段')
    process.exit(1)
  }

  const { meta, providers } = data
  console.log('文件信息：')
  console.log(`  抓取时间: ${meta.scraped_at}`)
  console.log(`  服务商数: ${meta.total}`)
  console.log(`  只含通过检测: ${meta.verified_only ? '是' : '否'}\n`)

  if (providers.length === 0) {
    console.log('文件中没有服务商数据。')
    return
  }

  const { data: existing, error } = await supabase
    .from('providers')
    .select('id, slug, name, website_url, domain, status')
  if (error) throw error

  const byDomain = new Map<string, (typeof existing)[number]>()
  const byName = new Map<string, (typeof existing)[number]>()
  for (const r of existing ?? []) {
    const d =
      r.domain ??
      (r.website_url
        ? (() => {
            try {
              return new URL(r.website_url).hostname.replace(/^www\./, '')
            } catch {
              return null
            }
          })()
        : null)
    if (d) byDomain.set(d, r)
    if (r.name) byName.set(r.name.replace(/\s/g, ''), r)
  }

  const toUpdate: { row: any; p: any; patch: any }[] = []
  const toInsert: any[] = []

  for (const p of providers) {
    const hit = (p.domain ? byDomain.get(p.domain) : undefined) ?? byName.get(p.name.replace(/\s/g, ''))
    if (hit) toUpdate.push({ row: hit, p, patch: toPatch(p) })
    else toInsert.push(p)
  }

  console.log(`匹配结果：更新 ${toUpdate.length} 家，新增候选 ${toInsert.length} 家\n`)

  console.log('--- 将更新 ---')
  for (const u of toUpdate) {
    console.log(`#${String(u.p.rank).padStart(3)} ${u.p.name.padEnd(16)} (${u.row.slug})`)
    console.log(
      `      价格=${u.patch.price_level ?? '—'} | 起充=${u.patch.min_topup ?? '—'} | 赠送=${u.patch.trial_credit ?? '—'}`
    )
    console.log(`      退款=${u.patch.refund_policy ?? '—'} | 开票=${u.patch.invoice_policy ?? '—'}`)
  }

  if (toInsert.length > 0) {
    console.log('\n--- 新增候选（榜单有、库里没有）---')
    toInsert.slice(0, 40).forEach((p) =>
      console.log(`#${String(p.rank).padStart(3)} ${p.name.padEnd(16)} ${p.domain ?? '(无域名)'}`)
    )
    if (toInsert.length > 40) console.log(`  ...还有 ${toInsert.length - 40} 家`)
  }

  if (!APPLY) {
    console.log('\n预览模式，未写库。加 --apply 执行；加 --no-new 则只更新不新增。')
    return
  }

  console.log('\n写入数据库...')
  let updated = 0
  for (const u of toUpdate) {
    const { error: e } = await supabase
      .from('providers')
      .update({ ...u.patch, updated_at: new Date().toISOString() })
      .eq('id', u.row.id)
    if (e) console.log(`  ❌ ${u.p.name} — ${e.message}`)
    else {
      updated++
      console.log(`  ✅ 更新 ${u.p.name}`)
    }
  }

  let inserted = 0
  if (!NO_NEW && toInsert.length > 0) {
    for (const p of toInsert) {
      const patch = toPatch(p)
      const { error: e } = await supabase.from('providers').insert({
        ...patch,
        slug: slugify(p.name, p.domain),
        name: p.name,
        description: `${p.name}${p.domain ? `（${p.domain}）` : ''}是一家 AI API 中转站，第三方榜单排名第 ${p.rank} 位，模型真假检测通过。价格与政策以服务商官网为准。`,
        status: 'draft',
        is_recommended: false,
        sort_order: Math.max(0, 300 - p.rank),
      })
      if (e) console.log(`  ❌ 新增 ${p.name} — ${e.message}`)
      else {
        inserted++
        console.log(`  ➕ 新增 ${p.name}（草稿）`)
      }
    }
  }

  console.log(`\n完成：更新 ${updated} 家，新增 ${inserted} 家（草稿状态，需人工核验后发布）。`)
  console.log('注意：本次未改动 verified_at —— 数据导入不等于人工核验。')
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
