import 'server-only'
import { SITE_URL } from '@/lib/constants'

export const INDEXNOW_KEY = 'c347fd7dd5594f83a0a2c435b83142a3'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export async function notifyIndexNow(paths: string[]) {
  const siteUrl = SITE_URL.replace(/\/$/, '')
  const urlList = Array.from(new Set(paths))
    .map(path => new URL(path, `${siteUrl}/`).toString())
    .filter(url => new URL(url).origin === new URL(siteUrl).origin)

  if (urlList.length === 0) {
    return { ok: true, status: 204 }
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key: INDEXNOW_KEY,
        keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.error('IndexNow submission failed:', response.status, await response.text())
    }

    return { ok: response.ok, status: response.status }
  } catch (error) {
    console.error('IndexNow submission failed:', error)
    return { ok: false, status: 0 }
  }
}
