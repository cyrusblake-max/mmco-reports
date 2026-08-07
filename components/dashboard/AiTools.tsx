'use client'
/**
 * AI writing assists for the report editor.
 *
 *  • RoughNotesBox — paste rough showing/feedback notes, get seller-ready
 *    structured feedback fields back. The agent reviews the filled fields;
 *    nothing bypasses the form.
 *  • StrategyDraftButton — drafts the Strategy & Next Steps copy from the
 *    report's own numbers and feedback. Confirms before overwriting.
 *
 * Both call /api/write (server-side key; facts preserved by prompt contract).
 */
import { useState } from 'react'
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { WeeklyReport, FeedbackItem } from '@/lib/types'
import { METRIC_LABELS, type WeeklyMetrics } from '@/lib/types'

export interface PolishedNotes {
  feedbackItems: { sentiment: 'positive' | 'negative' | 'neutral'; source: 'buyer' | 'broker'; comment: string }[]
  commonObjections: string
  pricingFeedback: string
  layoutFeedback: string
  competingProperties: string
  brokerSentiment: string
  showingsSummary: string
}

// ---------------------------------------------------------------------------

export function RoughNotesBox({ report, onApply }: {
  report: WeeklyReport
  onApply: (polished: PolishedNotes, newItems: FeedbackItem[]) => void
}) {
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function polish() {
    if (!notes.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'polish_notes',
          notes,
          context: `${report.property.address}${report.property.unit ? ', ' + report.property.unit : ''} — listed at $${report.property.price.toLocaleString()}, week of ${report.weekStartDate} to ${report.weekEndDate}`,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI request failed')
      const p: PolishedNotes = json.result
      const items: FeedbackItem[] = p.feedbackItems.map(f => ({ id: uuidv4(), ...f }))
      onApply(p, items)
      setNotes('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-luxury-gold/40 bg-luxury-gold/[0.04] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
        <p className="text-sm font-medium text-luxury-black">Paste rough notes</p>
      </div>
      <p className="text-xs text-luxury-taupe">
        e.g. &ldquo;Two private showings this week. One buyer loved the terraces but thought the third
        bedroom was small. Sunday&rsquo;s open house had seven groups, two strong follow-ups.&rdquo;
        The facts stay exactly as written — only the phrasing becomes seller-ready. Review every field after it fills.
      </p>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={4}
        placeholder="Type or paste your raw notes from the week…"
        className="w-full bg-white border border-luxury-cream px-3 py-2.5 text-sm focus:outline-none focus:border-luxury-gold transition-colors resize-y"
      />
      {error && (
        <p className="text-xs text-danger flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
        </p>
      )}
      <button
        type="button" onClick={polish} disabled={busy || !notes.trim()}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-luxury-black text-white text-xs hover:bg-luxury-dark transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {busy ? 'Polishing…' : 'Polish into report language'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------

export interface DraftedStrategy {
  keyRecommendations: string
  marketingPlanNextWeek: string
  pricingStrategy: string
  recommendedAdjustments: string
}

/** Compact factual digest of the report — the only thing the AI sees. */
function summarizeReport(r: WeeklyReport): string {
  const lines: string[] = []
  lines.push(`Property: ${r.property.address}${r.property.unit ? ', ' + r.property.unit : ''} (${r.property.neighborhood}) — asking $${r.property.price.toLocaleString()}, ${r.property.beds} bed / ${r.property.baths} bath, listed ${r.property.listingDate}`)
  lines.push(`Reporting period: ${r.weekStartDate} to ${r.weekEndDate} (week ${r.weekNumber})`)
  const m = r.currentMetrics
  const p = r.previousMetrics
  for (const key of Object.keys(METRIC_LABELS) as (keyof WeeklyMetrics)[]) {
    if (!m[key]) continue
    lines.push(`${METRIC_LABELS[key]}: ${m[key]}${p?.[key] ? ` (previous period: ${p[key]})` : ''}`)
  }
  for (const oh of r.openHouses) {
    lines.push(`Event ${oh.date}: ${oh.totalAttendees} attendees (${oh.brokers} brokers / ${oh.buyers} buyers), interest ${oh.seriousInterestLevel}/5${oh.commonFeedback ? ` — feedback: ${oh.commonFeedback}` : ''}`)
  }
  for (const f of r.feedback.items) lines.push(`Feedback (${f.source}, ${f.sentiment}): ${f.comment}`)
  if (r.feedback.commonObjections) lines.push(`Common objections: ${r.feedback.commonObjections}`)
  if (r.feedback.pricingFeedback) lines.push(`Pricing feedback: ${r.feedback.pricingFeedback}`)
  if (r.feedback.competingProperties) lines.push(`Competing properties mentioned: ${r.feedback.competingProperties}`)
  if (r.marketing.length > 0) lines.push(`Marketing completed: ${r.marketing.map(x => x.name).filter(Boolean).join('; ')}`)
  if (r.marketActivity.neighborhoodTrends) lines.push(`Market notes: ${r.marketActivity.neighborhoodTrends}`)
  return lines.join('\n')
}

export function StrategyDraftButton({ report, onApply }: {
  report: WeeklyReport
  onApply: (draft: DraftedStrategy) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function draft() {
    const hasExisting = report.strategy.keyRecommendations.trim()
      || report.strategy.marketingPlanNextWeek.trim()
      || report.strategy.pricingStrategy.trim()
    if (hasExisting && !window.confirm('Replace the current strategy text with a fresh AI draft? Your existing copy will be overwritten (you can still edit the result).')) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'draft_strategy', reportSummary: summarizeReport(report) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI request failed')
      onApply(json.result as DraftedStrategy)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button" onClick={draft} disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2.5 border border-luxury-gold text-luxury-gold text-xs hover:bg-luxury-gold hover:text-luxury-black transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {busy ? 'Drafting from report data…' : 'Draft strategy from this week’s data'}
      </button>
      {error && (
        <p className="text-xs text-danger flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
        </p>
      )}
    </div>
  )
}
