import type { Metadata } from 'next'
import { WeeklyReport } from '@/lib/types'
import { BALTIC_REPORT } from '@/lib/baltic-report'
import { WEST71_REPORT } from '@/lib/west71-report'
import ReportClient from './ReportClient'

const SEEDS: WeeklyReport[] = [BALTIC_REPORT, WEST71_REPORT]

const FALLBACK_IMAGE = '/613-baltic-listing.jpg'

function siteOrigin(): string {
  // Prefer an explicit production URL, then Vercel's, then localhost for dev.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.startsWith('http') ? explicit : `https://${explicit}`
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

function toAbsolute(url: string | undefined | null): string {
  const origin = siteOrigin()
  if (!url) return `${origin}${FALLBACK_IMAGE}`
  // Data URLs and blob URLs cannot be used by Twitter/Facebook crawlers
  if (url.startsWith('data:') || url.startsWith('blob:')) return `${origin}${FALLBACK_IMAGE}`
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/')) return `${origin}${url}`
  return `${origin}/${url}`
}

/**
 * Server-side report fetch for metadata.
 * Seeds win (matching lib/store.ts getReport) so weekly git updates control
 * the share title; Supabase covers user-created reports. Never throws —
 * metadata generation must not 500 the page.
 */
async function fetchReportForMeta(id: string): Promise<WeeklyReport | null> {
  const seed = SEEDS.find(r => r.id === id)
  if (seed) return seed
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/reports?id=eq.${encodeURIComponent(id)}&select=data&limit=1`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          // Always get the freshest version when generating share metadata
          cache: 'no-store',
        },
      )
      if (res.ok) {
        const rows = (await res.json()) as Array<{ data: WeeklyReport }>
        if (rows[0]?.data) return rows[0].data
      }
    } catch {
      // fall through
    }
  }
  return null
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  const report = await fetchReportForMeta(id)

  if (!report) {
    return {
      title: 'Seller Performance Report',
      openGraph: {
        title: 'MM&Co · Seller Performance Report',
        images: [{ url: toAbsolute(FALLBACK_IMAGE), width: 1200, height: 630 }],
      },
      twitter: { card: 'summary_large_image', images: [toAbsolute(FALLBACK_IMAGE)] },
    }
  }

  const { property } = report
  const addressLine = property.unit
    ? `${property.address}, ${property.unit}`
    : property.address
  const title = `${addressLine} — Week ${report.weekNumber} Report`
  const description = property.neighborhood
    ? `Weekly seller performance brief for ${addressLine} · ${property.neighborhood}`
    : `Weekly seller performance brief for ${addressLine}`

  // Always route the OG image through our API so user-uploaded photos
  // (stored as base64 data URLs in Supabase) work as link previews.
  const heroAbsolute = `${siteOrigin()}/api/og-image/${encodeURIComponent(id)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'MM&Co Reports',
      type: 'website',
      images: [{ url: heroAbsolute, width: 1200, height: 630, alt: addressLine }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroAbsolute],
    },
  }
}

export default async function ReportPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return <ReportClient id={id} />
}
