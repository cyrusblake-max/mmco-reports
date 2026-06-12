import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { WeeklyReport } from '@/lib/types'
import { BALTIC_REPORT } from '@/lib/baltic-report'
import { WEST71_REPORT } from '@/lib/west71-report'

/**
 * Serves the hero photo for a given report as a real image response so it can
 * be used as an Open Graph / Twitter Card image. Handles three cases:
 *   1. mainImageUrl is a base64 data URL (saved through the dashboard drag-drop)
 *   2. mainImageUrl is a /public path (seeded image shipped with the repo)
 *   3. mainImageUrl is an absolute URL (external host) — we proxy it
 *
 * Falls back to the bundled Baltic hero photo if anything goes wrong, so the
 * link preview always has *some* image.
 */

const SEEDS: WeeklyReport[] = [BALTIC_REPORT, WEST71_REPORT]
const FALLBACK_PUBLIC = '/613-baltic-listing.jpg'

async function getReport(id: string): Promise<WeeklyReport | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/reports?id=eq.${encodeURIComponent(id)}&select=data&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' },
      )
      if (res.ok) {
        const rows = (await res.json()) as Array<{ data: WeeklyReport }>
        if (rows[0]?.data) return rows[0].data
      }
    } catch { /* fall through */ }
  }
  return SEEDS.find(r => r.id === id) ?? null
}

async function readPublicFile(rel: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    const cleanRel = rel.replace(/^\//, '')
    const full = path.join(process.cwd(), 'public', cleanRel)
    const bytes = await readFile(full)
    const contentType = rel.toLowerCase().endsWith('.png') ? 'image/png'
      : rel.toLowerCase().endsWith('.webp') ? 'image/webp'
      : 'image/jpeg'
    return { bytes, contentType }
  } catch {
    return null
  }
}

function dataUrlToBytes(dataUrl: string): { bytes: Buffer; contentType: string } | null {
  // data:image/jpeg;base64,/9j/4AAQ...
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/)
  if (!match) return null
  const [, contentType, b64] = match
  try {
    return { bytes: Buffer.from(b64, 'base64'), contentType }
  } catch {
    return null
  }
}

async function fetchRemote(url: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const arrayBuffer = await res.arrayBuffer()
    return { bytes: Buffer.from(arrayBuffer), contentType }
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const report = await getReport(id)
  const hero = report?.property.mainImageUrl

  let payload: { bytes: Buffer; contentType: string } | null = null

  if (hero) {
    if (hero.startsWith('data:')) {
      payload = dataUrlToBytes(hero)
    } else if (hero.startsWith('http://') || hero.startsWith('https://')) {
      payload = await fetchRemote(hero)
    } else if (hero.startsWith('/')) {
      payload = await readPublicFile(hero)
    }
  }

  if (!payload) {
    payload = await readPublicFile(FALLBACK_PUBLIC)
  }

  if (!payload) {
    return NextResponse.json({ error: 'no image' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(payload.bytes), {
    status: 200,
    headers: {
      'Content-Type': payload.contentType,
      // Short cache so newly uploaded photos appear quickly in previews,
      // but social scrapers can still cache for a few minutes.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
