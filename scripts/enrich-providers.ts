/**
 * 用 apiranking 抓取的详情页 JSON 补全 providers 表字段
 *
 * 用法：
 *   npx tsx scripts/enrich-providers.ts            # 预览变更，不写库
 *   npx tsx scripts/enrich-providers.ts --apply    # 写入数据库
 *
 * 凭据从 .env.local 读取。
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR =
  'C:/Users/Administrator/Pictures/新建文件夹/API_Ranking_前10服务商_2026-08-11_170548/详情页JSON'

// ---------- env ----------
function loadEnv(): Record<string, string> {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) throw new Error('找不到 .env.local，请在项目根目录运行')
  const env: Record<string, string> = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('.env.local 缺少 Supabase 配置')
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const APPLY = process.argv.includes('--apply')

// ---------- 清洗 ----------
const clean = (s?: string) =>
  (s ?? '')
    .replace(/[🎁💬✓×—]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/** 「低 中 高」→「低-高」这类可读表述 */
function priceLevelText(raw?: string): string {
  const v = clean(raw)
  if (!v) return ''
  const parts = v.split(' ').filter(Boolean)
  if (parts.length === 1) return `价格${parts[0]}档`
  return `价格${parts[0]}到${parts[parts.length - 1]}档`
}

/** 从 metrics 生成 features 标签数组 */
function buildFeatures(j: any, rank: number): string[] {
  const m = j.metrics ?? {}
  const tags: string[] = []

  if (clean(m['真假检测']).includes('通过检测')) tags.push('通过模型检测')
  if (clean(m['稳定性'])) tags.push(`稳定性${clean(m['稳定性'])}`)

  const price = clean(m['价格水平'])
  if (price) {
    const parts = price.split(' ').filter(Boolean)
    if (parts.includes('低')) tags.push('有低价档')
    else if (parts[0]) tags.push(`价格${parts[0]}档`)
  }

  const topup = clean(m['最低起充'])
  if (topup) tags.push(`${topup}起充`)

  const bonus = clean(m['赠送额度'])
  if (bonus && bonus !== '-') tags.push('注册有赠送')

  const pay = clean(m['支付方式'])
  if (pay.includes('支')) tags.push('支付宝')
  if (pay.includes('微')) tags.push('微信支付')
  if (pay.includes('卡')) tags.push('信用卡')

  const invoice = clean(m['开票'])
  if (invoice && !invoice.includes('不可开票')) tags.push('可开发票')

  const refund = clean(m['退款政策'])
  if (refund.includes('无手续费')) tags.push('退款无手续费')

  if (clean(m['生图模型']).includes('支持')) tags.push('支持生图')

  const modelCount = (j.model_prices ?? []).length
  if (modelCount >= 10) tags.push(`${modelCount}+主流模型`)

  if (j.coupon_code) tags.push('有优惠码')
  if (rank <= 3) tags.push(`榜单第${rank}名`)

  // 去重并限制数量，前台卡片只展示前几个
  return [...new Set(tags)].slice(0, 10)
}

/** 组织详细描述：保证 >= 20 字，供 sitemap 质量门槛与 SEO 使用 */
function buildDescription(j: any, rank: number): string {
  const m = j.metrics ?? {}
  const base = clean(j.summary)
  const bits: string[] = []

  const stability = clean(m['稳定性'])
  if (stability) bits.push(`实测稳定性${stability}`)

  const modelCount = (j.model_prices ?? []).length
  if (modelCount) bits.push(`收录 ${modelCount} 个主流模型的渠道报价`)

  const invoice = clean(m['开票'])
  if (invoice && !invoice.includes('不可开票')) bits.push(`支持开票（${invoice}）`)

  const refund = clean(m['退款政策'])
  if (refund) bits.push(`退款政策：${refund}`)

  const tail = bits.length ? `第三方榜单排名第 ${rank} 位，${bits.join('，')}。` : ''
  return [base, tail].filter(Boolean).join(' ')
}

function pickMinTopup(j: any) {
  return clean(j.metrics?.['最低起充']) || null
}

function pickTrialCredit(j: any) {
  const v = clean(j.metrics?.['赠送额度'])
  return v && v !== '-' ? v : null
}

function pickTransactionFee(j: any) {
  const refund = clean(j.metrics?.['退款政策'])
  if (!refund) return null
  if (refund.includes('无手续费')) return '退款无手续费'
  const mt = refund.match(/退款([\d.]+%)手续费/)
  return mt ? `退款收 ${mt[1]} 手续费` : refund
}

function pickInvoiceSupport(j: any) {
  const v = clean(j.metrics?.['开票'])
  if (!v) return null
  return !v.includes('不可开票')
}

// ---------- 主流程 ----------
async function main() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()

  const { data: rows, error } = await supabase
    .from('providers')
    .select('id, slug, name, description, features, is_recommended, sort_order, min_topup, trial_credit, transaction_fee, invoice_support, promo_code, verification_status, website_url')

  if (error) throw error
  console.log(`数据库现有 ${rows?.length ?? 0} 条 providers\n`)

  const updates: { id: string; name: string; patch: Record<string, unknown> }[] = []
  const missing: string[] = []

  for (const file of files) {
    const j = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'))
    const rank = parseInt(file.slice(0, 2), 10)
    const name: string = j.name

    // 按 name 或 domain 匹配数据库记录
    const row = (rows ?? []).find(
      (r) =>
        r.name === name ||
        r.name?.replace(/\s/g, '') === name.replace(/\s/g, '') ||
        (r.website_url && j.domain && r.website_url.includes(j.domain))
    )

    if (!row) {
      missing.push(`${name}（${j.domain}）`)
      continue
    }

    const patch: Record<string, unknown> = {
      description: buildDescription(j, rank),
      features: buildFeatures(j, rank),
      is_recommended: rank <= 5,
      sort_order: 100 - rank, // 排名越前 sort_order 越大
      min_topup: pickMinTopup(j),
      trial_credit: pickTrialCredit(j),
      transaction_fee: pickTransactionFee(j),
      invoice_support: pickInvoiceSupport(j),
      promo_code: j.coupon_code || null,
      verification_status: clean(j.metrics?.['真假检测']).includes('通过检测') ? 'verified' : 'pending',
      website_url: j.domain ? `https://${j.domain}` : row.website_url,
      verified_at: new Date().toISOString(),
      status: 'published',
    }

    updates.push({ id: row.id, name: `${name}（榜单#${rank} → slug=${row.slug}）`, patch })
  }

  // 打印预览
  for (const u of updates) {
    console.log(`--- ${u.name}`)
    console.log(`  description: ${String(u.patch.description).slice(0, 100)}...`)
    console.log(`  features: ${JSON.stringify(u.patch.features)}`)
    console.log(
      `  推荐=${u.patch.is_recommended} | 权重=${u.patch.sort_order} | 起充=${u.patch.min_topup} | 赠送=${u.patch.trial_credit}`
    )
    console.log(`  开票=${u.patch.invoice_support} | 优惠码=${u.patch.promo_code} | 退款=${u.patch.transaction_fee}`)
    console.log('')
  }

  if (missing.length) {
    console.log('⚠️ 以下服务商在数据库中未找到匹配记录，未处理：')
    missing.forEach((m) => console.log('  - ' + m))
    console.log('')
  }

  if (!APPLY) {
    console.log(`预览模式：将更新 ${updates.length} 条。确认无误后加 --apply 再跑。`)
    return
  }

  console.log('写入数据库...')
  let ok = 0
  for (const u of updates) {
    const { error: e } = await supabase.from('providers').update(u.patch).eq('id', u.id)
    if (e) {
      console.log(`  ❌ ${u.name} — ${e.message}`)
    } else {
      ok++
      console.log(`  ✅ ${u.name}`)
    }
  }
  console.log(`\n完成：更新 ${ok} / ${updates.length} 条。`)
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
