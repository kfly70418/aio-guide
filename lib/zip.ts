// 极简 ZIP 打包器：使用 STORE（不压缩）方式，无第三方依赖。
// 足够用于人工备份场景，任何解压工具都能打开。

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** 把 JS Date 转成 DOS 时间/日期格式 */
function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const dosDate =
    ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, date: dosDate }
}

export interface ZipEntry {
  name: string
  content: string
}

/**
 * 生成 ZIP 文件字节流。
 */
export function createZip(entries: ZipEntry[], now: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder()
  const { time: dosTime, date: dosDate } = dosDateTime(now)

  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const dataBytes = encoder.encode(entry.content)
    const checksum = crc32(dataBytes)

    // 本地文件头：30 字节固定 + 文件名
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true) // 签名
    lv.setUint16(4, 20, true) // 解压所需版本
    lv.setUint16(6, 0x0800, true) // 通用标志：文件名为 UTF-8
    lv.setUint16(8, 0, true) // 压缩方法 0 = STORE
    lv.setUint16(10, dosTime, true)
    lv.setUint16(12, dosDate, true)
    lv.setUint32(14, checksum, true)
    lv.setUint32(18, dataBytes.length, true) // 压缩后大小
    lv.setUint32(22, dataBytes.length, true) // 原始大小
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true) // 扩展字段长度
    localHeader.set(nameBytes, 30)

    localChunks.push(localHeader, dataBytes)

    // 中央目录项：46 字节固定 + 文件名
    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true) // 签名
    cv.setUint16(4, 20, true) // 创建版本
    cv.setUint16(6, 20, true) // 解压所需版本
    cv.setUint16(8, 0x0800, true) // UTF-8 标志
    cv.setUint16(10, 0, true) // 压缩方法
    cv.setUint16(12, dosTime, true)
    cv.setUint16(14, dosDate, true)
    cv.setUint32(16, checksum, true)
    cv.setUint32(20, dataBytes.length, true)
    cv.setUint32(24, dataBytes.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true) // 扩展字段
    cv.setUint16(32, 0, true) // 注释
    cv.setUint16(34, 0, true) // 磁盘号
    cv.setUint16(36, 0, true) // 内部属性
    cv.setUint32(38, 0, true) // 外部属性
    cv.setUint32(42, offset, true) // 本地头偏移
    central.set(nameBytes, 46)

    centralChunks.push(central)
    offset += localHeader.length + dataBytes.length
  }

  const centralSize = centralChunks.reduce((sum, c) => sum + c.length, 0)

  // 中央目录结束记录
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(4, 0, true) // 当前磁盘号
  ev.setUint16(6, 0, true) // 中央目录起始磁盘号
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true) // 注释长度

  const totalSize = offset + centralSize + end.length
  const result = new Uint8Array(totalSize)
  let cursor = 0
  for (const chunk of [...localChunks, ...centralChunks, end]) {
    result.set(chunk, cursor)
    cursor += chunk.length
  }

  return result
}
