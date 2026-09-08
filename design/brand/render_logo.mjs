import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const root = new URL('../../', import.meta.url)
const here = new URL('./', import.meta.url)
const mark = readFileSync(new URL('public/logo-mark.svg', root))
const zh = readFileSync(new URL('public/logo.svg', root))
const ru = readFileSync(new URL('public/logo-ru.svg', root))
const old = execFileSync('git', ['show', 'HEAD:public/logo.svg'], { cwd: root })
const png = (input, width) => sharp(input).resize({ width }).png().toBuffer()
await sharp(mark).resize(180, 180).png().toFile(new URL('app/apple-icon.png', root).pathname.replace(/^\/(\w:)/, '$1'))
await sharp(zh).resize(1224).png().toFile(new URL('logo-transparent.png', here).pathname.replace(/^\/(\w:)/, '$1'))
await sharp(mark).resize(512).png().toFile(new URL('mark-512.png', here).pathname.replace(/^\/(\w:)/, '$1'))
// ICO container with PNG frames at standard browser sizes.
const sizes = [16, 32, 48, 64, 256]
const frames = await Promise.all(sizes.map(size => png(mark, size)))
const header = Buffer.alloc(6 + sizes.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
frames.forEach((frame, i) => {
  const at = 6 + i * 16
  header[at] = sizes[i] % 256
  header[at + 1] = sizes[i] % 256
  header.writeUInt16LE(1, at + 4)
  header.writeUInt16LE(32, at + 6)
  header.writeUInt32LE(frame.length, at + 8)
  header.writeUInt32LE(offset, at + 12)
  offset += frame.length
})
writeFileSync(new URL('app/favicon.ico', root), Buffer.concat([header, ...frames]))
const backdrop = Buffer.from(`<svg width="1440" height="1000" xmlns="http://www.w3.org/2000/svg">
<rect width="1440" height="1000" fill="#F2F5FA"/>
<text x="80" y="79" font-family="Arial" font-size="18" letter-spacing="4" fill="#61718A">APIXUAN / BRAND REFRESH</text>
<rect x="60" y="120" width="1320" height="390" rx="24" fill="white"/>
<text x="104" y="171" font-family="Arial" font-size="14" letter-spacing="2" fill="#7A879C">01 / PRIMARY LOGO</text>
<rect x="60" y="534" width="644" height="256" rx="24" fill="white"/>
<rect x="728" y="534" width="652" height="256" rx="24" fill="white"/>
<text x="104" y="578" font-family="Arial" font-size="14" letter-spacing="2" fill="#7A879C">02 / RUSSIAN</text>
<text x="772" y="578" font-family="Arial" font-size="14" letter-spacing="2" fill="#7A879C">03 / SMALL SIZES</text>
<rect x="60" y="814" width="1320" height="126" rx="24" fill="white"/>
<text x="104" y="849" font-family="Arial" font-size="12" letter-spacing="2" fill="#7A879C">BEFORE</text>
<text x="520" y="849" font-family="Arial" font-size="12" letter-spacing="2" fill="#7A879C">AFTER</text>
<text x="940" y="885" font-family="Arial" font-size="14" fill="#61718A">COBALT / INK / ICE</text>
<rect x="1150" y="859" width="42" height="42" rx="12" fill="#2563EB"/>
<rect x="1202" y="859" width="42" height="42" rx="12" fill="#142440"/>
<rect x="1254" y="859" width="42" height="42" rx="12" fill="#A5F3FC"/>
</svg>`)
await sharp(backdrop).composite([
  { input: await png(zh, 816), left: 302, top: 228 },
  { input: await png(ru, 408), left: 165, top: 632 },
  { input: await png(mark, 88), left: 785, top: 640 },
  { input: await png(mark, 40), left: 922, top: 664 },
  { input: await png(mark, 32), left: 1002, top: 668 },
  { input: await png(mark, 16), left: 1074, top: 676 },
  { input: await png(zh, 146), left: 1140, top: 661 },
  { input: await png(old, 146), left: 104, top: 871 },
  { input: await png(zh, 146), left: 520, top: 871 },
]).png().toFile(new URL('logo-preview.png', here).pathname.replace(/^\/(\w:)/, '$1'))
console.log('Exported logo preview, transparent PNG, Apple icon and multi-size favicon.')
