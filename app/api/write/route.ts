/**
 * POST /api/write — seller-facing writing assistance.
 *
 * Modes:
 *  • polish_notes     — rough agent notes → structured feedback fields +
 *                       feedback items, in polished seller-safe language.
 *  • draft_strategy   — report data → drafted strategy/next-steps copy.
 *  • rewrite          — one passage + an instruction (shorten / expand /
 *                       change tone) → rewritten passage, facts preserved.
 *
 * House writing rules (enforced in every prompt): confident, calm, specific,
 * luxury-NYC appropriate; no invented facts, no guarantees, no spin on
 * negative feedback, no generic AI filler.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const maxDuration = 60

// Haiku writes serviceable seller copy for well under a cent per call. Set
// ANTHROPIC_WRITE_MODEL=claude-sonnet-4-6 if you want more polished prose.
const MODEL = process.env.ANTHROPIC_WRITE_MODEL || 'claude-haiku-4-5'

const VOICE = `Writing rules for MM&Co., a luxury residential team in New York City:
- Confident, calm, sophisticated, honest. Concise but substantive.
- Write for the SELLER — a smart client, not an industry insider.
- Never invent facts, numbers, names, or events not present in the input.
- Never exaggerate, never promise outcomes, never say a strategy is guaranteed.
- Never soften negative feedback into misleading positivity — state concerns plainly and professionally.
- Do not use buyer or agent personal names unless they appear in the input AND the mode explicitly allows them; otherwise write "one buyer", "a broker", etc.
- No generic AI filler ("In today's fast-paced market...", "It's important to note..."). No exclamation points.
- Distinguish facts from professional interpretation; only interpret when the data supports it.`

const PolishSchema = z.object({
  feedbackItems: z.array(z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    source: z.enum(['buyer', 'broker']),
    comment: z.string(),
  })),
  commonObjections: z.string(),
  pricingFeedback: z.string(),
  layoutFeedback: z.string(),
  competingProperties: z.string(),
  brokerSentiment: z.string(),
  showingsSummary: z.string(),
})

const StrategySchema = z.object({
  keyRecommendations: z.string(),
  marketingPlanNextWeek: z.string(),
  pricingStrategy: z.string(),
  recommendedAdjustments: z.string(),
})

const RewriteSchema = z.object({ text: z.string() })

const POLISH_TOOL = {
  name: 'record_polished_notes',
  description: 'Record the structured, seller-ready version of the rough notes.',
  input_schema: {
    type: 'object' as const,
    properties: {
      feedbackItems: {
        type: 'array',
        description: 'One entry per distinct piece of buyer/broker feedback found in the notes. Empty array if none.',
        items: {
          type: 'object',
          properties: {
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
            source: { type: 'string', enum: ['buyer', 'broker'] },
            comment: { type: 'string', description: 'Seller-facing phrasing, no buyer names.' },
          },
          required: ['sentiment', 'source', 'comment'],
        },
      },
      commonObjections: { type: 'string', description: 'Recurring concerns, professionally phrased. Empty string if none mentioned.' },
      pricingFeedback: { type: 'string', description: 'Anything price-related from the notes. Empty string if none.' },
      layoutFeedback: { type: 'string', description: 'Anything about layout/space/condition. Empty string if none.' },
      competingProperties: { type: 'string', description: 'Competing listings buyers mentioned. Empty string if none.' },
      brokerSentiment: { type: 'string', description: 'Broker reactions. Empty string if none.' },
      showingsSummary: { type: 'string', description: '1-3 sentence seller-facing summary of the showing/open-house activity described in the notes. Empty string if the notes contain none.' },
    },
    required: ['feedbackItems', 'commonObjections', 'pricingFeedback', 'layoutFeedback', 'competingProperties', 'brokerSentiment', 'showingsSummary'],
  },
}

const STRATEGY_TOOL = {
  name: 'record_strategy',
  description: 'Record the drafted strategy copy.',
  input_schema: {
    type: 'object' as const,
    properties: {
      keyRecommendations: { type: 'string', description: '2-4 short paragraphs or bullet lines (lines starting with "- ") of specific recommendations grounded in the data.' },
      marketingPlanNextWeek: { type: 'string', description: 'Concrete marketing actions for the next period, grounded in what has/has not been done.' },
      pricingStrategy: { type: 'string', description: 'Measured pricing observation. If the data does not support a pricing comment, say the team continues to monitor pricing against activity — never push an aggressive change.' },
      recommendedAdjustments: { type: 'string', description: 'Adjustments responding to feedback themes. Empty string if no feedback data.' },
    },
    required: ['keyRecommendations', 'marketingPlanNextWeek', 'pricingStrategy', 'recommendedAdjustments'],
  },
}

async function callTool(client: Anthropic, system: string, user: string, tool: Anthropic.Tool) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content: user }],
  })
  const block = msg.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No structured output returned')
  return block.input
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.includes('REPLACE_ME')) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable AI writing.' },
      { status: 503 },
    )
  }
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const client = new Anthropic({ apiKey })
  const mode = body.mode

  try {
    if (mode === 'polish_notes') {
      const notes = String(body.notes ?? '').trim()
      if (!notes) return NextResponse.json({ error: 'No notes provided' }, { status: 400 })
      const context = String(body.context ?? '')
      const raw = await callTool(
        client,
        `${VOICE}\n\nTask: an agent pasted rough notes about showings, open houses, and buyer/broker feedback. Restructure them into the fields of the tool. Preserve every underlying fact exactly — counts, comparisons, objections. Do not add activity that is not in the notes. Leave fields as empty strings when the notes say nothing about them.`,
        `Listing context: ${context || 'not provided'}\n\nRough notes:\n"""\n${notes}\n"""`,
        POLISH_TOOL as Anthropic.Tool,
      )
      const parsed = PolishSchema.safeParse(raw)
      if (!parsed.success) throw new Error('AI response failed validation')
      return NextResponse.json({ result: parsed.data })
    }

    if (mode === 'draft_strategy') {
      const data = String(body.reportSummary ?? '').trim()
      if (!data) return NextResponse.json({ error: 'No report data provided' }, { status: 400 })
      const raw = await callTool(
        client,
        `${VOICE}\n\nTask: draft the "Strategy & Next Steps" copy for a weekly seller report using ONLY the data provided. Recommendations must be specific and tied to the numbers or feedback given (e.g. if saves are strong but showings are low, recommend converting interest into appointments). Never recommend a price cut aggressively; at most suggest continuing to monitor pricing or discussing positioning. If a data point is missing, do not reference it.`,
        `Report data:\n${data}`,
        STRATEGY_TOOL as Anthropic.Tool,
      )
      const parsed = StrategySchema.safeParse(raw)
      if (!parsed.success) throw new Error('AI response failed validation')
      return NextResponse.json({ result: parsed.data })
    }

    if (mode === 'rewrite') {
      const text = String(body.text ?? '').trim()
      const instruction = String(body.instruction ?? '').trim()
      if (!text || !instruction) return NextResponse.json({ error: 'text and instruction are required' }, { status: 400 })
      const raw = await callTool(
        client,
        `${VOICE}\n\nTask: rewrite the passage per the instruction. Every fact, number, name, and material term must survive unchanged — you may only change wording, length, and tone. Call record_rewrite with the result.`,
        `Instruction: ${instruction}\n\nPassage:\n"""\n${text}\n"""`,
        {
          name: 'record_rewrite',
          description: 'Record the rewritten passage.',
          input_schema: {
            type: 'object' as const,
            properties: { text: { type: 'string' } },
            required: ['text'],
          },
        } as Anthropic.Tool,
      )
      const parsed = RewriteSchema.safeParse(raw)
      if (!parsed.success) throw new Error('AI response failed validation')
      return NextResponse.json({ result: parsed.data })
    }

    return NextResponse.json({ error: `Unknown mode "${String(mode)}"` }, { status: 400 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI request failed'
    console.error('[write]', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
