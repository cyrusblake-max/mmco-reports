import { NextResponse } from 'next/server'

// Google Gemini Flash — free tier: 15 requests/min, 1500/day, 1M tokens/day.
// Get a key at https://aistudio.google.com/app/apikey and set GOOGLE_AI_KEY
// (locally in .env.local, in Vercel under Project Settings → Environment Variables).
const MODEL = 'gemini-1.5-flash-latest'

interface SummarizeInput {
  property: { address: string; unit?: string; weekNumber: number; reportingPeriod: string }
  metrics: Record<string, number>
  previousMetrics?: Record<string, number>
  openHouses?: { date: string; totalAttendees: number; brokers: number; buyers: number; notes?: string }[]
  digitalAds?: { totalImpressions: number; totalClicks: number; topChannel?: string }
  tone?: 'editorial' | 'concise' | 'warm'
}

export async function POST(req: Request) {
  const key = process.env.GOOGLE_AI_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'GOOGLE_AI_KEY not configured. Get a free key at https://aistudio.google.com/app/apikey and add it to your environment.' },
      { status: 500 },
    )
  }

  let body: SummarizeInput
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const prompt = buildPrompt(body)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 600 },
      }),
    },
  )

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return NextResponse.json({ error: `Gemini API ${res.status}`, detail }, { status: 502 })
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() ?? ''
  return NextResponse.json({ summary: text })
}

function buildPrompt(input: SummarizeInput): string {
  const { property, metrics, previousMetrics, openHouses, digitalAds, tone = 'editorial' } = input
  const toneNote = {
    editorial: 'Editorial, calm, sophisticated. Luxury-listing voice.',
    concise:   'Concise — 2-3 short sentences only.',
    warm:      'Warm, conversational, addressed to the seller directly.',
  }[tone]

  return [
    `You are writing a 1-paragraph weekly performance summary for a luxury real-estate seller report.`,
    ``,
    `Property: ${property.address}${property.unit ? `, ${property.unit}` : ''} (Week ${property.weekNumber}, ${property.reportingPeriod})`,
    ``,
    `This week's metrics:`,
    JSON.stringify(metrics, null, 2),
    previousMetrics ? `\nPrevious week:\n${JSON.stringify(previousMetrics, null, 2)}` : '',
    openHouses && openHouses.length ? `\nOpen houses this week:\n${JSON.stringify(openHouses, null, 2)}` : '',
    digitalAds ? `\nDigital ads:\n${JSON.stringify(digitalAds, null, 2)}` : '',
    ``,
    `Tone: ${toneNote}`,
    ``,
    `Rules:`,
    `• 2-4 sentences max. No bullets, no headers.`,
    `• Highlight 1-2 noteworthy facts (a peak number, a notable open-house moment, a meaningful trend).`,
    `• Do not invent numbers. Only reference figures present in the data above.`,
    `• Do not use the words "leveraging", "optimal", or "showcase".`,
    `• Output plain text only, no markdown.`,
  ].join('\n')
}
