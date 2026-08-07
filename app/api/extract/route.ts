/**
 * POST /api/extract — screenshot & PDF metric extraction.
 *
 * Body: { files: [{ id, name, mediaType, data }] } where `data` is raw base64
 * (no data: prefix). Images arrive pre-resized by the client (~1568px JPEG).
 *
 * Response: { results: [{ fileId, ok, result?, error? }] } — one entry per
 * file, extracted independently so a bad screenshot never sinks the batch.
 *
 * The model is forced through a tool schema, the reply is Zod-validated, and
 * an invalid reply gets exactly one retry with the validation error attached.
 * The API key stays server-side; nothing here is exposed to the browser.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ExtractionResultSchema, EXTRACTION_TOOL_SCHEMA, type ExtractionResult } from '@/lib/extraction'

export const maxDuration = 120

const MODEL = process.env.ANTHROPIC_EXTRACT_MODEL || 'claude-sonnet-4-6'
const MAX_FILES = 12
const CONCURRENCY = 3

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

interface InFile { id: string; name: string; mediaType: string; data: string }

const SYSTEM = `You are a meticulous data-extraction engine for a New York City residential real estate team. You read screenshots of listing analytics (Compass, StreetEasy, Zillow, Realtor.com), social media insights (Instagram, Facebook, TikTok), email marketing reports (Mailchimp, Constant Contact), ad dashboards, and Google Analytics, and you extract every marketing/engagement metric into structured data.

Non-negotiable rules:
1. NEVER invent, estimate, or round a number. If a value is cut off, blurred, or ambiguous, omit the metric and add a warning describing exactly what was unreadable.
2. Distinguish reporting-period numbers from lifetime/since-listing totals. Look for date-range labels ("Last 7 days", "Jul 27 – Aug 2", "Since listed", "All time"). When the screen does not say, use periodType "unknown" — do not assume.
3. Extract the on-screen label verbatim into originalLabel, then map it to the closest normalizedMetric. Use "other" rather than forcing a bad match.
4. Expand K/M suffixes exactly (1.2K → 1200, 1.5M → 1500000). Strip commas. Do not extract percentages into count metrics — use unit "percent".
5. Confidence reflects how certain you are of BOTH the number and its meaning. Anything below 0.85, or any ambiguity about which listing/period a number belongs to, sets requiresReview true.
6. Identify the source platform from logos, fonts, layout, and terminology. If genuinely unsure, use "unknown" — a wrong platform label is worse than none.
7. If the image contains no extractable listing/marketing metrics (e.g. it's a photo of a room), return an empty metrics array with a note saying so.
8. Dates in reportingPeriod must be ISO YYYY-MM-DD. If the screen shows "Last 7 days" with no dates, put that text in label and leave startDate/endDate null.

Call the record_extraction tool exactly once with your findings.`

function contentBlockFor(f: InFile): Anthropic.ContentBlockParam {
  if (f.mediaType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } }
  }
  const mt = (IMAGE_TYPES.has(f.mediaType) ? f.mediaType : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  return { type: 'image', source: { type: 'base64', media_type: mt, data: f.data } }
}

async function extractOne(client: Anthropic, f: InFile): Promise<ExtractionResult> {
  const tool: Anthropic.Tool = {
    name: 'record_extraction',
    description: 'Record the structured extraction result for this screenshot or PDF.',
    input_schema: EXTRACTION_TOOL_SCHEMA as Anthropic.Tool['input_schema'],
  }

  const baseMessages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: [
      contentBlockFor(f),
      { type: 'text', text: `File name: "${f.name}". Extract all listing/marketing metrics from this ${f.mediaType === 'application/pdf' ? 'PDF report' : 'screenshot'} following your rules exactly.` },
    ],
  }]

  let lastError = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: Anthropic.MessageParam[] = attempt === 0 ? baseMessages : [
      ...baseMessages,
      { role: 'assistant', content: 'I produced an invalid extraction on my first attempt.' },
      { role: 'user', content: `Your previous record_extraction input failed validation: ${lastError}. Call record_extraction again with a corrected, schema-valid input. Do not change any extracted numbers — only fix the structure.` },
    ]

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'record_extraction' },
      messages,
    })

    const block = msg.content.find(b => b.type === 'tool_use')
    if (!block || block.type !== 'tool_use') { lastError = 'no tool call in response'; continue }
    const parsed = ExtractionResultSchema.safeParse(block.input)
    if (parsed.success) return parsed.data
    lastError = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
  }
  throw new Error(`Extraction did not match the required schema after retry (${lastError})`)
}

/** Run tasks with a small concurrency cap so large batches don't stampede. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.includes('REPLACE_ME')) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local (and Vercel env vars) to enable screenshot extraction.' },
      { status: 503 },
    )
  }

  let body: { files?: InFile[] }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const files = (body.files ?? []).filter(f => f && f.id && f.data)
  if (files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Too many files — send at most ${MAX_FILES} per batch.` }, { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  const results = await mapLimit(files, CONCURRENCY, async f => {
    try {
      const result = await extractOne(client, f)
      return { fileId: f.id, ok: true as const, result }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Extraction failed'
      console.error(`[extract] ${f.name}:`, msg)
      return { fileId: f.id, ok: false as const, error: msg }
    }
  })

  return NextResponse.json({ results })
}
