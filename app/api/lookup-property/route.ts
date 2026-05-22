/**
 * Server-side property lookup.
 *
 * Strategy:
 *  1. Strip likely-wrong city/state suffixes from the query
 *  2. Try Bing first, then DuckDuckGo, with several query variants
 *  3. Pick the first real-estate URL we find (Compass/StreetEasy/Zillow/Realtor)
 *  4. Fetch that listing page and parse Schema.org JSON-LD, falling back to
 *     regex + Open Graph meta tags
 */

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const BROWSER_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'DNT': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
}

const LISTING_HOST_RE = /(?:compass\.com|streeteasy\.com|zillow\.com|realtor\.com|trulia\.com|redfin\.com)/i

interface PropertyLookup {
  beds?: number
  baths?: number
  sqft?: number
  price?: number
  description?: string
  mainImageUrl?: string
  agentName?: string
  agentPhone?: string
  agentEmail?: string
  agentPhotoUrl?: string
  agentTitle?: string
  listingDate?: string   // ISO yyyy-mm-dd, when first listed (for accurate DOM)
  source?: string
  sourceUrl?: string
}

// ---------------------------------------------------------------------------
// Address normalisation — drop likely-wrong city/state, leave the street
// ---------------------------------------------------------------------------
function buildQueryVariants(address: string): string[] {
  const trimmed = address.trim().replace(/\s+/g, ' ')
  // Strip a single trailing ", City, ST" or ", City, ST ZIP"
  const stripped = trimmed.replace(/,\s*[^,]+,\s*[A-Z]{2}(?:\s+\d{5})?\s*$/, '').trim()
  // Strip just trailing ", ST"
  const street   = stripped.replace(/,\s*[A-Z]{2}\s*$/, '').trim()
  return Array.from(new Set([trimmed, stripped, street])).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Search engines — return de-duped result URLs in ranking order
// ---------------------------------------------------------------------------
async function bingSearch(query: string): Promise<string[]> {
  try {
    const res = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
      headers: BROWSER_HEADERS,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const html = await res.text()
    const out: string[] = []
    for (const m of html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"/gi)) {
      const u = m[1]
      if (/bing\.com|microsoft\.com|msn\.com|go\.microsoft|aka\.ms/i.test(u)) continue
      out.push(u)
    }
    return out
  } catch { return [] }
}

async function ddgSearch(query: string): Promise<string[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: BROWSER_HEADERS,
      cache: 'no-store',
    })
    if (!res.ok) return []
    const html = await res.text()
    const out: string[] = []
    for (const m of html.matchAll(/uddg=([^&"']+)/g)) {
      try { out.push(decodeURIComponent(m[1])) } catch { /* skip */ }
    }
    return out
  } catch { return [] }
}

async function findListingUrl(address: string): Promise<string | null> {
  const variants = buildQueryVariants(address)

  // Build the cartesian product of (variant × site-specific query)
  const queries: string[] = []
  for (const v of variants) {
    queries.push(`${v} site:compass.com`)
    queries.push(`${v} site:streeteasy.com`)
    queries.push(`${v} compass listing`)
    queries.push(`${v} streeteasy`)
    queries.push(`${v} zillow`)
    queries.push(v)
  }

  for (const q of queries) {
    const [bing, ddg] = await Promise.all([bingSearch(q), ddgSearch(q)])
    for (const url of [...bing, ...ddg]) {
      if (LISTING_HOST_RE.test(url)) return url
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// JSON-LD extraction
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function* jsonLdBlocks(html: string): Generator<any> {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yieldOne = function* (node: any): Generator<any> {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const n of node) yield* yieldOne(n)
      return
    }
    yield node
    // Schema.org @graph wraps a list of entities — recurse
    if (Array.isArray(node['@graph'])) {
      for (const child of node['@graph']) yield* yieldOne(child)
    }
    // mainEntity is also common
    if (node.mainEntity) yield* yieldOne(node.mainEntity)
  }
  for (const m of html.matchAll(re)) {
    try {
      const parsed = JSON.parse(m[1].trim())
      yield* yieldOne(parsed)
    } catch { /* skip malformed */ }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickListing(blocks: any[]): any | null {
  const types = ['RealEstateListing', 'SingleFamilyResidence', 'Apartment', 'House', 'Residence', 'Product', 'Place']
  for (const b of blocks) {
    const t = b['@type']
    if (typeof t === 'string' && types.includes(t)) return b
    if (Array.isArray(t) && t.some(x => types.includes(x))) return b
    if (b.mainEntity) {
      const child = pickListing([b.mainEntity])
      if (child) return child
    }
  }
  return blocks[0] ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromJsonLd(block: any): Partial<PropertyLookup> {
  const out: Partial<PropertyLookup> = {}
  if (!block) return out
  const num = (v: unknown) => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = parseFloat(v.replace(/[^\d.]/g, ''))
      return isNaN(n) ? undefined : n
    }
    return undefined
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = (v: any) => Array.isArray(v) ? v[0] : v
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sizeValue = (fs: any) => {
    const f = first(fs)
    if (!f) return undefined
    return num(f.value ?? f)
  }

  // Compass nests beds/baths inside accommodationFloorPlan — fall back through both
  const fp = block.accommodationFloorPlan
  out.beds  = num(block.numberOfBedrooms ?? block.numberOfRooms ?? fp?.numberOfBedrooms ?? fp?.numberOfRooms)
  out.baths = num(
    block.numberOfBathroomsTotal ?? block.numberOfFullBathrooms ?? block.numberOfBathrooms
    ?? fp?.numberOfBathroomsTotal ?? fp?.numberOfFullBathrooms ?? fp?.numberOfBathrooms
  )
  out.sqft = sizeValue(block.floorSize) ?? sizeValue(fp?.floorSize)
  const offer = first(block.offers)
  if (offer) out.price = num(offer.price ?? offer.priceSpecification?.price)
  if (typeof block.description === 'string') out.description = block.description.trim()
  else if (typeof fp?.description === 'string') out.description = fp.description.trim()
  if (block.image) {
    const img = first(block.image)
    out.mainImageUrl = typeof img === 'string' ? img : img?.url
  }

  // Listing agent — schema.org RealEstateListing exposes provider / agent / seller
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent: any = block.provider ?? block.agent ?? block.realEstateAgent ?? block.seller ?? block.broker
  if (agent) {
    const a = Array.isArray(agent) ? agent[0] : agent
    if (typeof a?.name === 'string') out.agentName = a.name.trim()
    if (typeof a?.jobTitle === 'string') out.agentTitle = a.jobTitle.trim()
    if (typeof a?.telephone === 'string') out.agentPhone = a.telephone.trim()
    if (typeof a?.email === 'string') out.agentEmail = a.email.trim()
    if (a?.image) {
      const img = Array.isArray(a.image) ? a.image[0] : a.image
      out.agentPhotoUrl = typeof img === 'string' ? img : img?.url
    }
  }

  // Listing date — datePosted is the canonical schema.org property
  const dp = block.datePosted ?? block.dateModified ?? block.uploadDate
  if (typeof dp === 'string') {
    const iso = dp.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) out.listingDate = iso
  }
  return out
}

// ---------------------------------------------------------------------------
// Regex / Open Graph fallback
// ---------------------------------------------------------------------------
function regexFallback(html: string): Partial<PropertyLookup> {
  const out: Partial<PropertyLookup> = {}
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  const beds  = text.match(/(\d+(?:\.\d+)?)\s*(?:bd\b|beds?\b|bedrooms?\b)/i)
  const baths = text.match(/(\d+(?:\.\d+)?)\s*(?:ba\b|baths?\b|bathrooms?\b)/i)
  const sqft  = text.match(/([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft|square feet)/i)
  const price = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(M|million)?/i)

  if (beds)  out.beds  = parseFloat(beds[1])
  if (baths) out.baths = parseFloat(baths[1])
  if (sqft)  out.sqft  = parseInt(sqft[1].replace(/,/g, ''), 10)
  if (price) {
    const v = parseFloat(price[1].replace(/,/g, ''))
    out.price = (price[2] || '').toLowerCase().includes('m') ? v * 1_000_000 : v
  }
  const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  if (ogImg) out.mainImageUrl = ogImg[1]
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                   ?? html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
  if (metaDesc) out.description = metaDesc[1]

  // Compass "Listed Xd ago" / "Listed X days ago" -> derive listingDate
  const listedAgo = text.match(/listed\s+(\d+)\s*(?:d|days?)\s+ago/i)
  if (listedAgo) {
    const days = parseInt(listedAgo[1], 10)
    const d = new Date()
    d.setDate(d.getDate() - days)
    out.listingDate = d.toISOString().slice(0, 10)
  } else {
    // "Listed on Mar 14, 2025" / "Listed Mar 14, 2025"
    const listedOn = text.match(/listed(?:\s+on)?\s+([A-Z][a-z]{2,8}\s+\d{1,2},?\s*\d{4})/i)
    if (listedOn) {
      const d = new Date(listedOn[1])
      if (!isNaN(d.getTime())) out.listingDate = d.toISOString().slice(0, 10)
    }
  }

  // "Listed By {Agent Name}" — Compass displays the listing agent/team this way
  const listedBy = text.match(/Listed\s+By\s+([A-Z][A-Za-z'.\s&-]{2,80}?)(?:\s+(?:Listed|View|Map|Street|Floor|Description|\|)|\s{2,}|$)/)
  if (listedBy) out.agentName = listedBy[1].trim().replace(/\s+/g, ' ')

  // Inline JSON blobs in Compass HTML
  if (!out.agentName) {
    const agentBlob = html.match(/"(?:agent|listingAgent|displayAgent)"\s*:\s*\{[^{}]*"(?:name|fullName)"\s*:\s*"([^"]+)"/i)
    if (agentBlob) out.agentName = agentBlob[1]
  }
  const phoneBlob = html.match(/"(?:phone|telephone|cellPhone)"\s*:\s*"((?:\+?\d[\d\s().-]{7,})[\d])"/)
  if (phoneBlob) out.agentPhone = phoneBlob[1]
  const emailBlob = html.match(/"email"\s*:\s*"([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})"/i)
  if (emailBlob) out.agentEmail = emailBlob[1]

  // "Days on Market" → derive listingDate
  if (!out.listingDate) {
    const dom = text.match(/(\d+)\s*days?\s*on\s*market/i)
    if (dom) {
      const d = new Date()
      d.setDate(d.getDate() - parseInt(dom[1], 10))
      out.listingDate = d.toISOString().slice(0, 10)
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Fetch a listing page and extract data
// ---------------------------------------------------------------------------
async function scrapeListing(url: string): Promise<PropertyLookup> {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    cache: 'no-store',
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Listing page returned ${res.status}`)
  const html = await res.text()

  const blocks = Array.from(jsonLdBlocks(html))
  const listing = pickListing(blocks)
  const jsonLd = fromJsonLd(listing)
  const fallback = regexFallback(html)

  // JSON-LD wins; regex fills gaps
  return {
    ...fallback,
    ...Object.fromEntries(Object.entries(jsonLd).filter(([, v]) => v !== undefined)),
    source: new URL(url).hostname.replace(/^www\./, ''),
    sourceUrl: url,
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
function slugifyAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[#.,]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Normalise any Compass URL (insights, app, public) to the public listing URL. */
function normaliseCompassUrl(url: string, addressContext?: string): string {
  // Compass agent insights page: /listing-insights/my-listings/{id}
  const insights = url.match(/compass\.com\/listing-insights\/(?:my-listings|listing)\/(\d+)/i)
  if (insights) {
    const id = insights[1]
    if (addressContext) {
      const slug = slugifyAddress(addressContext)
      return `https://www.compass.com/listing/${slug}/${id}/`
    }
    return `https://www.compass.com/listing/${id}/`   // will 410 without slug — caller handles
  }
  // /app/listing/SLUG/ID → /listing/slug/id/
  return url.replace(/\/app\/listing\//i, '/listing/').replace(/([A-Z])/g, m => m.toLowerCase()).replace(/\/listing\/([a-z0-9-]+)\/(\d+)/i, '/listing/$1/$2/')
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.trim()
  const url     = req.nextUrl.searchParams.get('url')?.trim()
  const ctx     = req.nextUrl.searchParams.get('addressContext')?.trim()

  if (!address && !url) {
    return Response.json({ error: 'Provide ?address= or ?url=' }, { status: 400 })
  }

  try {
    let target = url
    if (target && /compass\.com/i.test(target)) {
      target = normaliseCompassUrl(target, ctx || address)
    }
    if (!target && address) {
      target = await findListingUrl(address) ?? undefined
      if (!target) {
        return Response.json({ error: `No public listing found for "${address}". Try the listing URL directly.` }, { status: 404 })
      }
    }
    const data = await scrapeListing(target!)
    return Response.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: msg }, { status: 500 })
  }
}
