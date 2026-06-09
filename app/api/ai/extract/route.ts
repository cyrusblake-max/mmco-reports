/**
 * AI Drop-Zone extraction — accepts a Compass screenshot, ad-report PDF, or social
 * metrics image and returns structured fields the editor can merge in.
 *
 * Uses Google Gemini 1.5 Flash's multimodal capabilities. Same GOOGLE_AI_KEY as
 * the other AI endpoints — no extra setup.
 */

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MODEL = 'gemini-2.0-flash'

// Supported by Gemini inline file uploads
const SUPPORTED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
])

const EXTRACTION_PROMPT = `You are extracting structured real-estate marketing metrics from a screenshot, PDF, or photo a listing agent dropped in.

Examine the content. Identify what kind of data it is. Then extract every metric you can read. Return ONLY valid JSON in this exact shape — no preamble, no markdown, no commentary:

{
  "type": "compass_insights" | "digital_ads" | "social_traffic" | "open_house_attendance" | "publisher_breakdown" | "social_media_stats" | "unknown",
  "extracted": {
    "reportingPeriod": "<human date range as seen, e.g. 'May 21 – May 27, 2026'>",

    "totalViews": <number>,
    "uniqueVisitors": <number>,
    "compassViews": <number>,
    "streetEasyViews": <number>,
    "zillowViews": <number>,
    "saves": <number>,
    "inquiries": <number>,
    "showingRequests": <number>,
    "avgTimeOnPage": <number — seconds>,

    "openHouseAttendees": <number>,
    "openHouseDate": "<YYYY-MM-DD>",
    "openHouseBrokers": <number>,
    "openHouseBuyers": <number>,

    "campaignName": "<string>",
    "totalImpressions": <number>,
    "totalClicks": <number>,
    "overallCTR": <number — percentage like 0.56>,
    "topChannel": { "name": "<string>", "ctr": <number> },
    "byChannel": [ { "channel": "<string>", "clicks": <number>, "ctr": <number> } ],

    "topPublishers": [ { "publisher": "<string>", "views": <number> } ],

    "socialTrafficShare": [ { "channel": "<Instagram|Facebook|YouTube|TikTok|Google|Other>", "share": <number percentage> } ],

    "instagramReelViews": <number>,
    "instagramLikes": <number>,
    "instagramComments": <number>,
    "instagramShares": <number>,
    "instagramSaves": <number>
  },
  "confidence": "high" | "medium" | "low",
  "notes": "<one-sentence plain-English summary of what you extracted>"
}

Rules:
- Only include fields you can actually read. Omit the rest (don't fabricate).
- Numbers as raw numbers, not strings. No "K" suffix; convert "1.1K" -> 1100, "20.6K" -> 20600.
- Percentages: use 4.39 not "4.39%".
- If the content is ambiguous or empty, return type: "unknown" with notes explaining what you saw.
- Output ONLY the JSON object. No \`\`\`json fences. No commentary before or after.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'GOOGLE_AI_KEY not configured. Add it in Vercel env vars.' },
      { status: 500 },
    )
  }

  let form: FormData
  try { form = await req.formData() }
  catch { return Response.json({ error: 'Expected multipart/form-data' }, { status: 400 }) }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file uploaded (field name must be "file")' }, { status: 400 })
  }

  if (!SUPPORTED_TYPES.has(file.type)) {
    return Response.json(
      { error: `Unsupported file type: ${file.type}. Use PNG, JPG, WebP, HEIC, or PDF.` },
      { status: 400 },
    )
  }

  if (file.size > 18 * 1024 * 1024) {
    return Response.json(
      { error: 'File is too large (max 18 MB for inline upload).' },
      { status: 413 },
    )
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const base64 = buf.toString('base64')

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: EXTRACTION_PROMPT },
              { inlineData: { mimeType: file.type, data: base64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return Response.json({ error: `Gemini ${res.status}`, detail }, { status: 502 })
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? ''

    // Gemini returns JSON when responseMimeType is set, but defensively strip ``` fences
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed: unknown
    try { parsed = JSON.parse(cleaned) }
    catch (e) {
      return Response.json(
        { error: 'AI returned non-JSON response', raw: text.slice(0, 500) },
        { status: 502 },
      )
    }

    return Response.json(parsed)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `AI extraction failed: ${msg}` }, { status: 500 })
  }
}
