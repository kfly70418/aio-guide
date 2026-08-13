/**
 * 抓取 ainav.cn 的 AI 快讯（极客公园 / 机器之心）并导入 articles 表
 *
 * 数据源：https://www.ainav.cn/news/json/{source}_{YYYY-MM-DD}.json
 *   极客公园 → jikegongyuan_*.json
 *   机器之心 → jiqizhixing_*.json  （站方文件名拼写如此）
 *
 * 用法：
 *   npx tsx scripts/fetch-ai-news.ts              # 预览，不写库
 *   npx tsx scripts/fetch-ai-news.ts --import     # 写入数据库
 *   npx tsx scripts/fetch-ai-news.ts --date=2026-08-12 --import
 *
 * 凭据从 .env.local 读取，不写在代码里。
 */

import { createClient } from '@supabase/supabase-js'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'

// ---------- 读取 .env.local ----------
function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('找不到 .env.local，请在项目根目录运行此脚本')
  }
  const env: Record<string, string> = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('.env.local 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const DO_IMPORT = process.argv.includes('--import')
const dateArg = process.argv.find((a) => a.startsWith('--date='))?.split('=')[1]
const FORCE = process.argv.includes('--force')

// ---------- 本地缓存，避免调试时重复请求 ----------
const CACHE_DIR = path.join(process.cwd(), 'scripts', '.cache')
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 快讯更新较频繁，6 小时

function readCache(key: string): any | null {
  if (FORCE) return null
  const p = path.join(CACHE_DIR, `${key}.json`)
  if (!fs.existsSync(p)) return null
  if (Date.now() - fs.statSync(p).mtimeMs > CACHE_TTL_MS) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function writeCache(key: string, data: any) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data), 'utf8')
}

const LIMIT = 10

// ---------- 抓取 ----------
interface RawItem {
  title: string
  link: string
  pubDate?: string
  description?: string
}

interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string
  description?: string
}

const SOURCES = [
  { name: '极客公园', file: 'jikegongyuan' },
  { name: '机器之心', file: 'jiqizhixing' },
]

function fetchJSON(url: string, depth = 0): Promise<any> {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('重定向次数过多'))
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json,text/plain,*/*',
          Referer: 'https://www.ainav.cn/news/',
        },
        timeout: 30000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return fetchJSON(new URL(res.headers.location, url).toString(), depth + 1).then(resolve, reject)
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error('返回内容不是合法 JSON'))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error('请求超时')))
  })
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 今天没有就往前回溯几天，站点按天生成文件 */
async function fetchSource(file: string, name: string): Promise<NewsItem[]> {
  const dates = dateArg
    ? [dateArg]
    : Array.from({ length: 4 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return ymd(d)
      })

  for (const date of dates) {
    const cacheKey = `${file}_${date}`
    const url = `https://www.ainav.cn/news/json/${file}_${date}.json`
    try {
      const cached = readCache(cacheKey)
      const json = cached ?? (await fetchJSON(url))
      if (!cached && json?.items?.length) writeCache(cacheKey, json)
      else if (cached) console.log(`  ${name}：使用本地缓存（${date}）`)
      const items: RawItem[] = json?.items ?? []
      if (items.length === 0) continue
      console.log(`  ${name}：命中 ${date}，共 ${items.length} 条`)
      return items.slice(0, LIMIT).map((it) => ({
        title: (it.title || '').trim(),
        url: it.link,
        source: name,
        publishedAt: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
        description: it.description?.replace(/<[^>]*>/g, '').trim(),
      }))
    } catch (e: any) {
      console.log(`  ${name}：${date} 不可用（${e.message}）`)
    }
  }
  return []
}

// ---------- 入库 ----------
function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\w一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
  return `news-${base || 'item'}-${Math.random().toString(36).slice(2, 7)}`
}

function buildSummary(item: NewsItem) {
  const desc = item.description?.slice(0, 120)
  return desc && desc.length > 20 ? desc : `${item.source}报道：${item.title}`
}

async function importNews(items: NewsItem[]) {
  // 用标题去重，避免重复跑脚本时写入重复快讯
  const { data: existing } = await supabase
    .from('articles')
    .select('title')
    .eq('category', 'news')
  const seen = new Set((existing ?? []).map((r: { title: string }) => r.title))

  let ok = 0
  let skipped = 0
  for (const item of items) {
    if (seen.has(item.title)) {
      skipped++
      console.log(`  ⏭  已存在：${item.title.slice(0, 40)}`)
      continue
    }

    const { error } = await supabase.from('articles').insert({
      slug: slugify(item.title),
      title: item.title,
      summary: buildSummary(item),
      content: [
        `> 本条快讯转载自${item.source}，仅摘录标题与摘要，版权归原作者所有。`,
        '',
        item.description ? item.description : '',
        '',
        `原文链接：${item.url}`,
        '',
        `来源：${item.source}`,
      ]
        .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
        .join('\n'),
      category: 'news',
      status: 'published',
      published_at: item.publishedAt,
      sort_order: 0,
    })

    if (error) {
      console.log(`  ❌ ${item.title.slice(0, 40)} — ${error.message}`)
    } else {
      ok++
      seen.add(item.title)
      console.log(`  ✅ ${item.title.slice(0, 40)}`)
    }
  }
  return { ok, skipped }
}

// ---------- 主流程 ----------
async function main() {
  console.log('抓取 ainav.cn AI 快讯\n')

  const all: NewsItem[] = []
  for (const s of SOURCES) {
    const items = await fetchSource(s.file, s.name)
    all.push(...items)
  }

  console.log('')
  for (const s of SOURCES) {
    const list = all.filter((i) => i.source === s.name)
    console.log(`=== ${s.name}（${list.length} 条）===`)
    list.forEach((n, i) => console.log(`  ${i + 1}. ${n.title}`))
    console.log('')
  }

  if (all.length === 0) {
    console.log('⚠️ 两个源都没取到数据，可能是站点当天还未生成 JSON。可加 --date=YYYY-MM-DD 指定日期。')
    return
  }

  if (!DO_IMPORT) {
    console.log(`共 ${all.length} 条。预览模式未写库，确认无误后加 --import 再跑一次。`)
    return
  }

  console.log('写入数据库...')
  const { ok, skipped } = await importNews(all)
  console.log(`\n完成：新增 ${ok} 条，跳过重复 ${skipped} 条，共处理 ${all.length} 条。`)
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
