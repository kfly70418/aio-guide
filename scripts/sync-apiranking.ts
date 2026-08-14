/**
 * 从 apiranking.com 首页抓取「通过检测」的服务商，同步到 providers 表
 *
 * 用法：
 *   npx tsx scripts/sync-apiranking.ts                  # 预览，不写库
 *   npx tsx scripts/sync-apiranking.ts --apply          # 更新已有 + 新增
 *   npx tsx scripts/sync-apiranking.ts --apply --no-new # 只更新已有，不新增
 *   npx tsx scripts/sync-apiranking.ts --limit=30       # 只处理榜单前 30 家
 *
 * 匹配策略：官网域名优先，其次名称。域名是服务商的稳定标识。
 * 只同步「✓ 通过检测」的条目，其余（存疑/未通过/未检测）跳过。
 * 凭据从 .env.local 读取。
 */

import { createClient } from '@supabase/supabase-js'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'

// ---------- env ----------
function loadEnv(): Record<string, string> {
  const p = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(p)) return {}
  const env: Record<string, string> = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

const APPLY = process.argv.includes('--apply')
const NO_NEW = process.argv.includes('--no-new')
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0)
const FORCE = process.argv.includes('--force')
const EXPORT = process.argv.includes('--export')

if (APPLY && EXPORT) {
  console.error('❌ --apply 和 --export 不能同时使用')
  process.exit(1)
}

// 只有需要写库时才初始化 Supabase
let supabase: any = null
if (APPLY) {
  const env = loadEnv()
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ .env.local 缺少 Supabase 配置（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）')
    process.exit(1)
  }
  supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}

// ---------- 本地缓存：避免同一天重复请求对方服务器 ----------
const CACHE_DIR = path.join(process.cwd(), 'scripts', '.cache')
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12 小时

function cachePath(key: string) {
  return path.join(CACHE_DIR, `${key}.html`)
}

function readCache(key: string): string | null {
  if (FORCE) return null
  const p = cachePath(key)
  if (!fs.existsSync(p)) return null
  const age = Date.now() - fs.statSync(p).mtimeMs
  if (age > CACHE_TTL_MS) return null
  console.log(`使用本地缓存（${Math.round(age / 60000)} 分钟前抓取），未发起网络请求`)
  return fs.readFileSync(p, 'utf8')
}

function writeCache(key: string, html: string) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(cachePath(key), html, 'utf8')
}

/** 随机延迟，避免每天固定时刻整点请求 */
function jitter(minMs: number, maxMs: number) {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise((r) => setTimeout(r, ms))
}

// ---------- 抓取 ----------
function fetchHTML(url: string, depth = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('重定向过多'))
    const req = https.get(
      url,
      {
        headers: {
          // 如实标识来源与用途，便于对方站长在日志中识别、必要时联系
          'User-Agent':
            'Mozilla/5.0 (compatible; aio-guide/1.0; +https://aio-guide-six.vercel.app/about) price-reference-bot',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
        timeout: 45000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return fetchHTML(new URL(res.headers.location, url).toString(), depth + 1).then(resolve, reject)
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        let d = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (d += c))
        res.on('end', () => resolve(d))
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('请求超时')))
  })
}

// ---------- 解析 ----------
const strip = (s: string) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

interface Scraped {
  rank: number
  name: string
  domain: string | null
  tier: string
  verification: string
  priceLevels: string[]
  minTopup: string | null
  bonus: string | null
  refund: string | null
  invoice: string | null
  couponNote: string | null
  tags: string[]
  detailPath: string | null
}

/** 从 JSON-LD 取 排名 → 官网域名 映射 */
function parseDomainMap(html: string): Map<string, { domain: string; rank: number }> {
  const map = new Map<string, { domain: string; rank: number }>()
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const b of blocks) {
    try {
      const j = JSON.parse(b[1])
      if (j['@type'] !== 'ItemList' || !Array.isArray(j.itemListElement)) continue
      for (const el of j.itemListElement) {
        const name: string = el?.item?.name
        const url: string = el?.item?.provider?.url
        if (!name || !url) continue
        try {
          map.set(name, { domain: new URL(url).hostname.replace(/^www\./, ''), rank: el.position })
        } catch {
          /* 无效 URL 忽略 */
        }
      }
    } catch {
      /* 非 ItemList 块忽略 */
    }
  }
  return map
}

function parseCards(html: string): Scraped[] {
  const domainMap = parseDomainMap(html)
  const out: Scraped[] = []

  // 按 card 容器切片
  const parts = html.split(/<div class="card tier-/).slice(1)

  parts.forEach((raw, idx) => {
    const tier = (raw.match(/^([a-z0-9]+)/i)?.[1] ?? '').toLowerCase()
    const block = raw

    const name = strip(block.match(/<div class="provider-name">([\s\S]*?)<\/div>/)?.[1] ?? '')
    if (!name) return

    // 检测结论：只认「通过检测」
    const water = strip(block.match(/class="water-badge[^"]*"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '')

    // 价格档位：低/中/高
    const priceLevels = [...block.matchAll(/class="price-grade\s+(low|mid|high)[^"]*"[^>]*>([^<]*)</g)].map(
      (m) => strip(m[2])
    )

    const minTopup = strip(block.match(/class="topup-tag[^"]*"[^>]*>([^<]*)</)?.[1] ?? '') || null
    const bonus = strip(block.match(/class="bonus-tag"[^>]*>([^<]*)</)?.[1] ?? '') || null

    // 退款列：取 title 属性（比可见文本更完整）
    const refundCol = block.match(/<div class="refund-col">([\s\S]*?)<div class="invoice-col">/)?.[1] ?? ''
    const refund = strip(refundCol.match(/title="([^"]*)"/)?.[1] ?? strip(refundCol)) || null

    // 开票列：三种形态 —— invoice-yes(✓) / invoice-no(×) / invoice-note(如「200元起开」，属于支持)
    const invoiceCol = block.match(/<div class="invoice-col">([\s\S]*?)<div class="visit-col">/)?.[1] ?? ''
    const invoiceTitle = strip(invoiceCol.match(/title="([^"]*)"/)?.[1] ?? '')
    let invoice: string | null = null
    if (/invoice-no/.test(invoiceCol)) {
      invoice = invoiceTitle || '不可开票'
    } else if (/invoice-yes/.test(invoiceCol)) {
      invoice = invoiceTitle || '可开票'
    } else if (/invoice-note/.test(invoiceCol)) {
      // 有条件开票（如「200元起开」「对公支付6%税费」），算支持
      invoice = invoiceTitle || strip(invoiceCol) || null
    } else {
      const t = strip(invoiceCol)
      invoice = t && !/^[—\-–]$/.test(t) ? t : null
    }

    const couponNote = strip(block.match(/class="coupon-note">([\s\S]*?)<\/span>/)?.[1] ?? '') || null
    const tags = [...block.matchAll(/class="home-tag[^"]*">([\s\S]*?)<\/span>/g)]
      .map((m) => strip(m[1]))
      .filter(Boolean)

    const detailPath = block.match(/href="(\/p\/[^"?]+)/)?.[1] ?? null
    const meta = domainMap.get(name)

    out.push({
      rank: meta?.rank ?? idx + 1,
      name,
      domain: meta?.domain ?? null,
      tier,
      verification: water,
      priceLevels,
      minTopup,
      bonus,
      refund,
      invoice,
      couponNote,
      tags,
      detailPath,
    })
  })

  return out
}

// ---------- 映射到数据库字段 ----------
function toPatch(s: Scraped) {
  const priceLevel = s.priceLevels.join(' ') || null

  // transaction_fee 沿用现有语义：描述退款手续费
  let transactionFee: string | null = null
  if (s.refund) {
    transactionFee = /无手续费/.test(s.refund) ? '退款无手续费' : `退款${s.refund}`
  }

  const invoiceSupport = s.invoice ? !/不可开票|不支持/.test(s.invoice) : null

  return {
    price_level: priceLevel,
    min_topup: s.minTopup,
    trial_credit: s.bonus?.replace(/^🎁\s*/, '') ?? null,
    refund_policy: s.refund ? `✓ 退款${s.refund}` : null,
    invoice_policy: s.invoice ? (invoiceSupport ? `✓ ${s.invoice}` : s.invoice) : null,
    invoice_support: invoiceSupport,
    transaction_fee: transactionFee,
    coupon_note: s.couponNote,
    verification_status: 'verified' as const,
    website_url: s.domain ? `https://${s.domain}` : null,
  }
}

function slugify(name: string, domain: string | null) {
  const base = (domain ? domain.split('.')[0] : name)
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || `provider-${Math.random().toString(36).slice(2, 7)}`
}

// ---------- 主流程 ----------
async function main() {
  let html = readCache('apiranking')

  if (!html) {
    // 随机等待 0–20 秒，避免每天在同一秒发起请求
    const waitMs = Math.round(Math.random() * 20000)
    if (waitMs > 1500) {
      console.log(`随机延迟 ${(waitMs / 1000).toFixed(1)}s 后请求...`)
      await jitter(waitMs, waitMs)
    }
    console.log('抓取 https://apiranking.com/ ...')
    html = await fetchHTML('https://apiranking.com/')
    writeCache('apiranking', html)
  }

  console.log(`HTML ${html.length} 字符\n`)

  const all = parseCards(html)
  const passed = all.filter((s) => /通过检测/.test(s.verification))
  const scoped = LIMIT > 0 ? passed.slice(0, LIMIT) : passed

  console.log(`解析到 ${all.length} 家，其中「通过检测」${passed.length} 家`)
  if (LIMIT > 0) console.log(`按 --limit=${LIMIT} 只处理前 ${scoped.length} 家`)

  const skipped = all.length - passed.length
  if (skipped > 0) {
    const reasons = new Map<string, number>()
    all
      .filter((s) => !/通过检测/.test(s.verification))
      .forEach((s) => {
        const k = s.verification || '(无检测标记)'
        reasons.set(k, (reasons.get(k) ?? 0) + 1)
      })
    console.log(`跳过 ${skipped} 家：`)
    for (const [k, v] of reasons) console.log(`  ${k} × ${v}`)
  }
  console.log('')

  if (scoped.length === 0) {
    console.log('⚠️ 没有解析到「通过检测」的条目，页面结构可能已变化。')
    return
  }

  if (EXPORT) {
    const exportDir = path.join(process.cwd(), 'scripts', 'exports')
    fs.mkdirSync(exportDir, { recursive: true })
    const ts = Date.now()
    const filename = `providers_${new Date().toISOString().slice(0, 10)}_${ts}.json`
    const filepath = path.join(exportDir, filename)
    const payload = {
      meta: {
        scraped_at: new Date().toISOString(),
        total: scoped.length,
        verified_only: true,
      },
      providers: scoped.map((s) => ({
        rank: s.rank,
        name: s.name,
        domain: s.domain,
        website_url: s.domain ? `https://${s.domain}` : null,
        verification: s.verification,
        price_level: s.priceLevels.join(' ') || null,
        min_topup: s.minTopup,
        trial_credit: s.bonus,
        refund_policy: s.refund,
        invoice_policy: s.invoice,
        coupon_code: s.couponNote ? 'apixuan' : null,
        coupon_note: s.couponNote,
        tags: s.tags,
      })),
    }
    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8')
    console.log(`\n✅ 已导出到 ${filename}`)
    console.log(`   完整路径: ${filepath}`)
    console.log(`\n请将此文件发送给数据接收方。`)
    return
  }

  // 读取库内现有记录
  const { data: existing, error } = await supabase
    .from('providers')
    .select('id, slug, name, website_url, domain, status')
  if (error) throw error

  const byDomain = new Map<string, (typeof existing)[number]>()
  const byName = new Map<string, (typeof existing)[number]>()
  for (const r of existing ?? []) {
    const d =
      r.domain ??
      (r.website_url ? (() => { try { return new URL(r.website_url).hostname.replace(/^www\./, '') } catch { return null } })() : null)
    if (d) byDomain.set(d, r)
    if (r.name) byName.set(r.name.replace(/\s/g, ''), r)
  }

  const toUpdate: { row: any; s: Scraped; patch: any }[] = []
  const toInsert: Scraped[] = []

  for (const s of scoped) {
    const hit = (s.domain ? byDomain.get(s.domain) : undefined) ?? byName.get(s.name.replace(/\s/g, ''))
    if (hit) toUpdate.push({ row: hit, s, patch: toPatch(s) })
    else toInsert.push(s)
  }

  console.log(`匹配结果：更新 ${toUpdate.length} 家，新增候选 ${toInsert.length} 家\n`)

  console.log('--- 将更新 ---')
  for (const u of toUpdate) {
    console.log(`#${String(u.s.rank).padStart(3)} ${u.s.name.padEnd(16)} (${u.row.slug})`)
    console.log(
      `      价格=${u.patch.price_level ?? '—'} | 起充=${u.patch.min_topup ?? '—'} | 赠送=${u.patch.trial_credit ?? '—'}`
    )
    console.log(`      退款=${u.patch.refund_policy ?? '—'} | 开票=${u.patch.invoice_policy ?? '—'}`)
  }

  if (toInsert.length > 0) {
    console.log('\n--- 新增候选（榜单有、库里没有）---')
    toInsert.slice(0, 40).forEach((s) =>
      console.log(`#${String(s.rank).padStart(3)} ${s.name.padEnd(16)} ${s.domain ?? '(无域名)'}`)
    )
    if (toInsert.length > 40) console.log(`  ...还有 ${toInsert.length - 40} 家`)
  }

  if (!APPLY) {
    console.log('\n预览模式，未写库。加 --apply 执行；加 --export 导出本地文件；加 --no-new 则只更新不新增。')
    return
  }

  console.log('\n写入数据库...')
  let updated = 0
  for (const u of toUpdate) {
    const { error: e } = await supabase
      .from('providers')
      .update({ ...u.patch, updated_at: new Date().toISOString() })
      .eq('id', u.row.id)
    if (e) console.log(`  ❌ ${u.s.name} — ${e.message}`)
    else {
      updated++
      console.log(`  ✅ 更新 ${u.s.name}`)
    }
  }

  let inserted = 0
  if (!NO_NEW && toInsert.length > 0) {
    for (const s of toInsert) {
      const patch = toPatch(s)
      const { error: e } = await supabase.from('providers').insert({
        ...patch,
        // invoice_support 有非空约束，榜单未标注时按不支持处理（待人工核验修正）
        invoice_support: patch.invoice_support ?? false,
        slug: slugify(s.name, s.domain),
        name: s.name,
        domain: s.domain,
        description: `${s.name}${s.domain ? `（${s.domain}）` : ''}是一家 AI API 中转站，第三方榜单排名第 ${s.rank} 位，模型真假检测通过。价格与政策以服务商官网为准。`,
        // 新增的一律先存草稿，人工确认后再发布
        status: 'draft',
        is_recommended: false,
        sort_order: Math.max(0, 300 - s.rank),
      })
      if (e) console.log(`  ❌ 新增 ${s.name} — ${e.message}`)
      else {
        inserted++
        console.log(`  ➕ 新增 ${s.name}（草稿）`)
      }
    }
  }

  console.log(`\n完成：更新 ${updated} 家，新增 ${inserted} 家（草稿状态，需人工核验后发布）。`)
  console.log('注意：本次未改动 verified_at —— 抓取不等于人工核验。')
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
