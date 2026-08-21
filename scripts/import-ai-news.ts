/**
 * 从导出的 JSON 文件导入 AI 快讯到数据库
 *
 * 用法：
 *   npx tsx scripts/import-ai-news.ts path/to/ai-news_2026-08-13_xxx.json
 *   npx tsx scripts/import-ai-news.ts path/to/ai-news_2026-08-13_xxx.json --apply
 *
 * 不加 --apply 为预览模式，只显示将导入的内容。
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
const filepath = process.argv.find(
  (a) => a.endsWith('.json') && !a.includes('node_modules')
)

if (!filepath) {
  console.error('用法: npx tsx scripts/import-ai-news.ts <文件路径> [--apply]')
  process.exit(1)
}

if (!fs.existsSync(filepath)) {
  console.error(`文件不存在: ${filepath}`)
  process.exit(1)
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w一-龥-]+/g, '')
    .slice(0, 100)
}

function buildSummary(item: any): string {
  if (item.description) {
    const clean = item.description.replace(/<[^>]*>/g, '').trim()
    return clean.slice(0, 200)
  }
  return item.title.slice(0, 100)
}

async function main() {
  console.log(`读取文件: ${filepath}\n`)
  const raw = fs.readFileSync(filepath!, 'utf8')
  const data = JSON.parse(raw)

  if (!data.meta || !Array.isArray(data.items)) {
    console.error('文件格式不正确，缺少 meta 或 items 字段')
    process.exit(1)
  }

  const { meta, items } = data
  console.log('文件信息：')
  console.log(`  日期: ${meta.date}`)
  console.log(`  来源: ${meta.sources?.join(', ') ?? '—'}`)
  console.log(`  条数: ${meta.total}`)
  console.log(`  导出时间: ${meta.exported_at}\n`)

  if (items.length === 0) {
    console.log('文件中没有快讯数据。')
    return
  }

  // 查询已有标题，按标题去重
  const { data: existing } = await supabase
    .from('articles')
    .select('title')
    .eq('category', 'news')
    .in(
      'title',
      items.map((i: any) => i.title)
    )

  const seen = new Set((existing ?? []).map((r: { title: string }) => r.title))

  const toImport = items.filter((i: any) => !seen.has(i.title))
  const skipped = items.length - toImport.length

  console.log(`匹配结果：`)
  console.log(`  新增 ${toImport.length} 条`)
  console.log(`  跳过（已存在）${skipped} 条\n`)

  if (toImport.length === 0) {
    console.log('所有快讯均已入库，无需导入。')
    return
  }

  console.log('--- 将导入的快讯 ---')
  toImport.slice(0, 20).forEach((item: any, i: number) => {
    console.log(`  ${i + 1}. ${item.title} | ${item.source}`)
  })
  if (toImport.length > 20) console.log(`  ...还有 ${toImport.length - 20} 条`)

  if (!APPLY) {
    console.log('\n预览模式，未写库。加 --apply 执行导入。')
    return
  }

  console.log('\n写入数据库...')
  let ok = 0
  for (const item of toImport) {
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
      console.log(`  ✅ ${item.title.slice(0, 40)}`)
    }
  }

  console.log(`\n完成：新增 ${ok} 条，跳过 ${skipped} 条，共处理 ${items.length} 条。`)
}

main().catch((e) => {
  console.error('失败：', e.message)
  process.exit(1)
})
