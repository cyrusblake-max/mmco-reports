/**
 * AI-generated agent recommendations — powered by Google Gemini 1.5 Flash (free tier).
 *
 * Takes report data (metrics + WoW trend + property context) and asks Gemini for
 * concrete next-step recommendations in the same six strategy buckets used by the
 * editor form. Returns parsed JSON ready to merge into report.strategy.
 *
 * Setup: get a free key at https://aistudio.google.com/app/apikey and set GOOGLE_AI_KEY.
 */

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MODEL = 'gemini-2.0-flash'

interface IncomingPayload {
  property: {
    address?: string
    unit?: string
    neighborhood?: string
    city?: string
    price?: number
    beds?: number
    baths?: number
    sqft?: number
    listingDate?: string
    description?: string
  }
  weekNumber?: number
  currentMetrics: Record<string, number>
  previousMetrics?: Record<string, number>
  openHouseCount?: number
  feedbackThemes?: string
}

interface Recommendations {
  keyRecommendations: string
  marketingPlanNextWeek: string
  pricingStrategy: string
  upcomingCampaigns: string
  brokerEvents: string
  openHousesPlanned: string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_AI_KEY
  if (!apiKey) {
    return Response.json({
      error: 'GOOGLE_AI_KEY not configured. Get a free key at https://aistudio.google.com/app/apikey and add it to your environment (Vercel Settings → Environment Variables, or .env.local for local dev).',
    }, { status: 500 })
  }

  let payload: IncomingPayload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const systemPreamble =
    'You are an experienced NYC luxury real estate advisor writing concrete, ' +
    'actionable next-step recommendations for the listing agent based on the ' +
    "past week's performance data. Your output is in plain text suitable for " +
    'pasting into a seller report — no markdown headers, no emojis. Each section ' +
    'should contain 3-5 bullet-style lines, one idea per line, written in a ' +
    'confident professional voice. Be specific (mention platforms, channels, ' +
    'price ranges, specific events) — avoid generic advice.'

  const prompt = `${systemPreamble}\n\n${buildPrompt(payload)}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 2000 },
        }),
      },
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return Response.json(
        { error: `Gemini API ${res.status}`, detail },
        { status: 502 },
      )
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? ''

    const parsed = parseRecommendations(text)
    return Response.json(parsed)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Gemini API call failed: ${msg}` }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
function buildPrompt(p: IncomingPayload): string {
  const m = p.currentMetrics
  const prev = p.previousMetrics ?? {}
  const change = (key: string) => {
    if (!prev[key] || !m[key]) return ''
    const delta = ((m[key] - prev[key]) / prev[key]) * 100
    return ` (${delta >= 0 ? '+' : ''}${delta.toFixed(0)}% WoW)`
  }

  const propLine = [
    p.property.address && `${p.property.address}${p.property.unit ? ' ' + p.property.unit : ''}`,
    p.property.neighborhood,
    p.property.price && `listed at $${p.property.price.toLocaleString()}`,
    p.property.beds && `${p.property.beds}BR/${p.property.baths}BA`,
    p.property.sqft && `${p.property.sqft.toLocaleString()} sqft`,
  ].filter(Boolean).join(' · ')

  return `PROPERTY
${propLine || 'NYC luxury listing'}
${p.property.description ? `\nDESCRIPTION\n${p.property.description.slice(0, 500)}` : ''}

WEEK ${p.weekNumber ?? '?'} METRICS
- Total views: ${m.totalViews ?? 0}${change('totalViews')}
- Compass views: ${m.compassViews ?? 0}${change('compassViews')}
- StreetEasy views: ${m.streetEasyViews ?? 0}${change('streetEasyViews')}
- Zillow views: ${m.zillowViews ?? 0}${change('zillowViews')}
- Saves: ${m.saves ?? 0}${change('saves')}
- Inquiries: ${m.inquiries ?? 0}${change('inquiries')}
- Showing requests: ${m.showingRequests ?? 0}${change('showingRequests')}
- Open house attendees: ${m.openHouseAttendees ?? 0}${change('openHouseAttendees')}
- Broker inquiries: ${m.brokerInquiries ?? 0}${change('brokerInquiries')}
- Qualified buyer leads: ${m.buyerLeads ?? 0}${change('buyerLeads')}
- Social reach: ${m.socialReach ?? 0}${change('socialReach')}
- Video views: ${m.videoViews ?? 0}${change('videoViews')}
- Open houses held this week: ${p.openHouseCount ?? 0}
${p.feedbackThemes ? `\nBUYER FEEDBACK THEMES\n${p.feedbackThemes}` : ''}

TASK
Produce recommendations in EXACTLY this format. Use the exact section headers shown below, each followed by 3-5 lines of advice. Do NOT add any preamble or commentary outside the sections.

[KEY RECOMMENDATIONS]
<3-5 most important next moves this week>

[MARKETING PLAN NEXT WEEK]
<3-5 specific marketing actions: platforms, channels, content ideas>

[PRICING STRATEGY]
<1-3 lines on price positioning given the data — hold, reduce, reframe>

[UPCOMING CAMPAIGNS]
<3-5 campaign ideas: print, digital, partnerships>

[BROKER EVENTS]
<2-3 ideas to drive broker interest>

[OPEN HOUSES PLANNED]
<2-3 specific open house ideas: timing, format, target audience>`
}

// ---------------------------------------------------------------------------
function parseRecommendations(text: string): Recommendations {
  const sections: Record<string, string> = {
    'KEY RECOMMENDATIONS': '',
    'MARKETING PLAN NEXT WEEK': '',
    'PRICING STRATEGY': '',
    'UPCOMING CAMPAIGNS': '',
    'BROKER EVENTS': '',
    'OPEN HOUSES PLANNED': '',
  }

  const re = /\[([A-Z\s]+)\]\s*\n([\s\S]*?)(?=\n\[[A-Z\s]+\]|$)/g
  for (const m of text.matchAll(re)) {
    const key = m[1].trim()
    if (key in sections) sections[key] = m[2].trim()
  }

  return {
    keyRecommendations:    sections['KEY RECOMMENDATIONS'],
    marketingPlanNextWeek: sections['MARKETING PLAN NEXT WEEK'],
    pricingStrategy:       sections['PRICING STRATEGY'],
    upcomingCampaigns:     sections['UPCOMING CAMPAIGNS'],
    brokerEvents:          sections['BROKER EVENTS'],
    openHousesPlanned:     sections['OPEN HOUSES PLANNED'],
  }
}
