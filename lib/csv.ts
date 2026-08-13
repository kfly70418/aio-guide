// CSV 序列化与解析（无第三方依赖）

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) {
    return columns ? columns.join(',') : ''
  }

  const cols = columns ?? Object.keys(rows[0])
  const header = cols.join(',')
  const body = rows
    .map((row) => cols.map((col) => escapeCell(row[col])).join(','))
    .join('\r\n')

  return `${header}\r\n${body}`
}

/**
 * 解析 CSV 文本为对象数组。支持带引号的字段、字段内换行和转义引号。
 */
export function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]

    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (char === '\r') {
      // 跳过，等 \n 处理换行
    } else {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''))
  if (nonEmpty.length === 0) return []

  const header = nonEmpty[0].map((h) => h.trim())

  return nonEmpty.slice(1).map((cells) => {
    const record: Record<string, string> = {}
    header.forEach((key, idx) => {
      record[key] = (cells[idx] ?? '').trim()
    })
    return record
  })
}

/** 给 CSV 加上 UTF-8 BOM，避免 Excel 打开中文乱码 */
export function withBom(csv: string): string {
  return `﻿${csv}`
}
