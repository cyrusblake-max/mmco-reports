/**
 * Enhanced Compass seller report PDF parser.
 *
 * Strategy:
 *  1. Load pdfjs-dist v3 via CDN script tag (avoids webpack ESM bundling issues)
 *  2. Extract text page-by-page, preserving line structure
 *  3. Use proximity search: find keyword, then scan backward first (Compass puts
 *     the number ABOVE its label), then forward
 *  4. Handle K/M suffixes, comma-formatted numbers; skip percentages and years
 *  5. Dedicated platform-split extractor for the "Views By Platform" section
 */

import type { WeeklyMetrics } from './types'

// ---------------------------------------------------------------------------
// PDF library loader — CDN script tag, bypasses webpack ESM bundling
// ---------------------------------------------------------------------------
const PDFJS_VERSION = '3.11.174'
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPdfLib(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('PDF parsing requires a browser environment')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  if (w.pdfjsLib) return w.pdfjsLib

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-pdfjs]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('PDF library script failed to load')))
      return
    }
    const s = document.createElement('script')
    s.setAttribute('data-pdfjs', '1')
    s.src = `${PDFJS_CDN}/pdf.min.js`
    s.onload  = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load PDF library from CDN`))
    document.head.appendChild(s)
  })

  const lib = w.pdfjsLib
  if (!lib) throw new Error('PDF library loaded but pdfjsLib not found on window')
  lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`
  return lib
}

// ---------------------------------------------------------------------------
// Number parsing utilities
// ---------------------------------------------------------------------------
function parseFormattedNumber(raw: string): number {
  const s = raw.trim()
  const kmMatch = s.match(/^([\d,]+\.?\d*)\s*([kKmM])$/)
  if (kmMatch) {
    const n = parseFloat(kmMatch[1].replace(/,/g, ''))
    return kmMatch[2].toLowerCase() === 'k' ? Math.round(n * 1_000) : Math.round(n * 1_000_000)
  }
  const plain = parseFloat(s.replace(/,/g, ''))
  return isNaN(plain) ? 0 : Math.round(plain)
}

/**
 * Extract numbers from a string, skipping:
 *  - percentage values ("84%", "62%")
 *  - year-like numbers (2015–2035) to avoid picking up dates
 * Returns values sorted largest → smallest.
 */
function numbersIn(text: string): number[] {
  const hits: number[] = []
  const re = /\b(\d[\d,]*\.?\d*\s*[kKmM]?)\b/g
  for (const m of text.matchAll(re)) {
    const after = text.slice(m.index! + m[0].length).trimStart()
    if (after.startsWith('%')) continue            // skip percentages
    const v = parseFormattedNumber(m[1])
    if (v >= 2015 && v <= 2035) continue           // skip years
    if (v > 0 && v < 100_000_000) hits.push(v)
  }
  return hits.sort((a, b) => b - a)
}

/**
 * Like numbersIn but returns numbers in left-to-right document order (no sort),
 * used when column position matters (platform split).
 */
function orderedNumbersIn(text: string): number[] {
  const hits: number[] = []
  const re = /\b(\d[\d,]*\.?\d*\s*[kKmM]?)\b/g
  for (const m of text.matchAll(re)) {
    const after = text.slice(m.index! + m[0].length).trimStart()
    if (after.startsWith('%')) continue
    const v = parseFormattedNumber(m[1])
    if (v >= 2015 && v <= 2035) continue
    if (v > 0 && v < 100_000_000) hits.push(v)
  }
  return hits
}

// ---------------------------------------------------------------------------
// Core proximity search
// ---------------------------------------------------------------------------
/**
 * Find the first line matching any keyword, then scan a window for a number.
 * Scan order prioritises backward (number above label) then forward — Compass
 * consistently puts the stat value on the line above its text label.
 */
function proximitySearch(
  lines: string[],
  keywords: string[],
  windowLines = 5,
  skip = new Set<number>(),
): { value: number; lineIdx: number } {
  const kwLower = keywords.map(k => k.toLowerCase())

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    if (!kwLower.some(kw => lineLower.includes(kw))) continue

    // Prefer backward scan (value above label), then forward
    for (const offset of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6]) {
      const idx = i + offset
      if (idx < 0 || idx >= lines.length) continue
      if (skip.has(idx)) continue
      const nums = numbersIn(lines[idx])
      const best = nums.filter(n => n >= 1)[0]  // already sorted largest first
      if (best !== undefined) return { value: best, lineIdx: idx }
    }
  }
  return { value: 0, lineIdx: -1 }
}

// ---------------------------------------------------------------------------
// Specialised "Views By Platform" extractor
// Compass lays out a two-column table: Compass | StreetEasy with values below.
// ---------------------------------------------------------------------------
function extractPlatformSplit(lines: string[]): { compass?: number; streeteasy?: number } {
  const sectionIdx = lines.findIndex(l => /views\s+by\s+platform/i.test(l))
  if (sectionIdx < 0) return {}

  const window = lines.slice(sectionIdx + 1, sectionIdx + 12)

  // Strategy A: find a line with both "compass" and "streeteasy" as column headers,
  // then read the very next non-empty line for the two values.
  for (let i = 0; i < window.length; i++) {
    const lower = window[i].toLowerCase()
    if (lower.includes('compass') && lower.includes('streeteasy')) {
      for (let j = i + 1; j < window.length; j++) {
        const nums = orderedNumbersIn(window[j])
        if (nums.length >= 2) return { compass: nums[0], streeteasy: nums[1] }
        if (nums.length === 1) break  // only one column found on this line
      }
    }
  }

  // Strategy B: find consecutive single-number lines, first = compass, second = streeteasy
  const singles: number[] = []
  for (const line of window) {
    const nums = orderedNumbersIn(line)
    if (nums.length === 1 && nums[0] >= 50) singles.push(nums[0])
    if (singles.length === 2) return { compass: singles[0], streeteasy: singles[1] }
  }

  return {}
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------
export async function extractTextFromPdf(file: File): Promise<{ lines: string[]; rawText: string }> {
  const pdfjsLib = await getPdfLib()
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise

  const allLines: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const tc   = await page.getTextContent()
    const pageLines: { y: number; text: string }[] = []

    for (const item of tc.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const existing = pageLines.find(l => Math.abs(l.y - y) < 4)
      if (existing) {
        existing.text += ' ' + item.str
      } else {
        pageLines.push({ y, text: item.str })
      }
    }

    // Sort top-to-bottom (higher y = higher on page in PDF coords)
    pageLines.sort((a, b) => b.y - a.y)
    allLines.push(...pageLines.map(l => l.text.trim()))
    allLines.push('--- PAGE BREAK ---')
  }

  return { lines: allLines, rawText: allLines.join('\n') }
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------
export interface ParsedCompassData {
  metrics: Partial<WeeklyMetrics>
  address?: string
  price?: number
  listingUrl?: string
  rawText: string
  lines: string[]
  confidence: 'high' | 'medium' | 'low'
  fieldSources: Record<string, string>
}

export function parseCompassText(lines: string[], rawText: string): ParsedCompassData {
  const used = new Set<number>()
  const fieldSources: Record<string, string> = {}

  function find(keywords: string[], window = 6): number {
    const { value, lineIdx } = proximitySearch(lines, keywords, window, used)
    if (value && lineIdx >= 0) {
      used.add(lineIdx)
      fieldSources[keywords[0]] = lines[lineIdx]
    }
    return value
  }

  // ------------------------------------------------------------------
  // Platform split first — dedicated extractor avoids cross-contamination
  // ------------------------------------------------------------------
  const platform = extractPlatformSplit(lines)
  const compassViews    = platform.compass    ?? find(['compass.com', 'on compass', 'compass views', 'from compass'], 6)
  const streetEasyViews = platform.streeteasy ?? find(['streeteasy', 'street easy'], 5)

  // ------------------------------------------------------------------
  // Total / listing views
  // ------------------------------------------------------------------
  const totalViews = find([
    'total views', 'listing views', 'times viewed', 'page views',
    'people viewed', 'unique views', 'views this week', 'views last week',
    'total views for your listing',
  ], 8) || find(['views'], 3)

  // Platform (fallback if dedicated extractor missed)
  const zillowViews    = find(['zillow'], 5)
  const websiteTraffic = find(['website', 'direct traffic', 'direct views', 'web traffic', 'site visits'], 5)

  // Saves / favorites
  const saves = find([
    'saves', 'saved', 'favorites', 'favourites', 'wishlist', 'hearts', 'liked',
  ], 6)

  // Inquiries
  const inquiries = find([
    'inquiries', 'inquiry', 'direct messages', 'messages',
    'contacts', 'buyer contacts', 'leads generated',
    'emails received', 'email inquir',
  ], 6)

  // Showings
  const showingRequests = find([
    'showing requests', 'showings requested', 'showing appointments',
    'tours requested', 'private tours', 'scheduled tours',
    'showing schedule', 'tour requests',
  ], 6)

  // Open house
  const openHouseAttendees = find([
    'open house attendees', 'attendees', 'open house visitors',
    'open house guests', 'attended open house', 'oh attendance',
    'total open house visitors',
  ], 6)

  // Broker
  const brokerInquiries = find([
    'broker inquiries', 'agent inquiries', 'broker contacts',
    'cooperating agents', 'broker outreach', 'agent outreach', 'broker interest',
  ], 6)

  // Buyer leads
  const buyerLeads = find([
    'buyer leads', 'qualified leads', 'hot leads', 'serious buyers', 'qualified buyers',
  ], 6)

  // Social
  const socialReach = find([
    'social reach', 'social impressions', 'social media reach',
    'total reach', 'combined reach', 'impressions',
  ], 6)
  const videoViews = find([
    'video views', 'reel views', 'video plays', 'clip views',
    'media views', 'virtual tour views',
  ], 6)

  // ------------------------------------------------------------------
  // Property metadata
  // ------------------------------------------------------------------
  let address: string | undefined
  for (const re of [
    /(?:property|address|listing)[:\s]+([0-9]+\s+[^,\n]+(?:,\s*(?:apt|unit|ste|suite|#)[^,\n]+)?)/i,
    /^(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Ave|St|Blvd|Dr|Rd|Ln|Way|Pl|Ct|Terr|Park|Square)\.?)(?:,\s*(?:Apt|Unit|Ste|#)[^\n]+)?)/m,
  ]) {
    const m = rawText.match(re)
    if (m) { address = m[1].trim(); break }
  }

  let price: number | undefined
  for (const re of [
    /(?:list(?:ing)?\s*price|asking\s*price|price)[:\s]*\$?([\d,]+(?:\.\d+)?)\s*(M|million)?/i,
    /\$([\d,]+(?:\.\d+)?)\s*(M|million)/i,
    /listed\s+(?:at|for)\s+\$?([\d,]+)/i,
  ]) {
    const m = rawText.match(re)
    if (m) {
      const base = parseFloat(m[1].replace(/,/g, ''))
      price = (m[2] || '').toLowerCase().includes('m') ? base * 1_000_000 : base
      break
    }
  }

  // ------------------------------------------------------------------
  // Listing URL — Compass reports often embed a public listing link
  // ------------------------------------------------------------------
  let listingUrl: string | undefined
  const urlMatch = rawText.match(/https?:\/\/(?:www\.)?(?:compass\.com|streeteasy\.com|zillow\.com|realtor\.com)\/[^\s)"']+/i)
  if (urlMatch) listingUrl = urlMatch[0].replace(/[.,;:)\]]+$/, '')

  // ------------------------------------------------------------------
  // Assemble result
  // ------------------------------------------------------------------
  const metrics: Partial<WeeklyMetrics> = {
    ...(totalViews         > 0 && { totalViews }),
    ...(websiteTraffic     > 0 && { websiteTraffic }),
    ...(zillowViews        > 0 && { zillowViews }),
    ...(streetEasyViews    > 0 && { streetEasyViews }),
    ...(compassViews       > 0 && { compassViews }),
    ...(saves              > 0 && { saves }),
    ...(inquiries          > 0 && { inquiries }),
    ...(showingRequests    > 0 && { showingRequests }),
    ...(openHouseAttendees > 0 && { openHouseAttendees }),
    ...(brokerInquiries    > 0 && { brokerInquiries }),
    ...(buyerLeads         > 0 && { buyerLeads }),
    ...(socialReach        > 0 && { socialReach }),
    ...(videoViews         > 0 && { videoViews }),
  }

  const filled = Object.keys(metrics).length
  const confidence: ParsedCompassData['confidence'] =
    filled >= 7 ? 'high' : filled >= 3 ? 'medium' : 'low'

  return { metrics, address, price, listingUrl, rawText, lines, confidence, fieldSources }
}
