import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/auditLog'
import { toCSV, withBom } from '@/lib/csv'
import { createZip, type ZipEntry } from '@/lib/zip'

// 需要备份的核心业务表
const TABLES = [
  'providers',
  'models',
  'channels',
  'prices',
  'price_history',
  'articles',
  'click_events',
  'audit_logs',
  'profiles',
] as const

type TableName = (typeof TABLES)[number]

async function dumpAll(): Promise<Record<TableName, Record<string, unknown>[]>> {
  const supabase = await createClient()
  const result = {} as Record<TableName, Record<string, unknown>[]>

  for (const table of TABLES) {
    const rows: Record<string, unknown>[] = []
    const pageSize = 1000
    let from = 0

    // 分页拉全表，避免一次性拉爆
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + pageSize - 1)

      if (error) {
        throw new Error(`导出 ${table} 失败：${error.message}`)
      }

      rows.push(...((data ?? []) as Record<string, unknown>[]))

      if (!data || data.length < pageSize) break
      from += pageSize
    }

    result[table] = rows
  }

  return result
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'json'

    const dump = await dumpAll()
    const counts = Object.fromEntries(
      Object.entries(dump).map(([table, rows]) => [table, rows.length])
    )
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    await logAction({
      action: 'export_backup',
      resourceType: 'backup',
      details: { format, counts },
    })

    if (format === 'json') {
      const payload = {
        exported_at: new Date().toISOString(),
        exported_by: user.email,
        counts,
        data: dump,
      }

      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="aio-guide-backup-${stamp}.json"`,
        },
      })
    }

    // CSV 压缩包：每张表一个 csv，另附一份 manifest
    const entries: ZipEntry[] = TABLES.map((table) => ({
      name: `${table}.csv`,
      content: withBom(toCSV(dump[table])),
    }))

    entries.push({
      name: 'manifest.json',
      content: JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          exported_by: user.email,
          counts,
          note: '人工备份导出。每个 CSV 对应一张业务表，字段与数据库列一一对应。',
        },
        null,
        2
      ),
    })

    const zip = createZip(entries)

    return new NextResponse(zip as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="aio-guide-backup-${stamp}.zip"`,
        'Content-Length': String(zip.length),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务器错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
