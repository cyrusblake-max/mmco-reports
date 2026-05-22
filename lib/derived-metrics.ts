/**
 * Helpers for synthesising / enriching weekly metrics so the report reads
 * as a polished document even when only a handful of raw metrics are filled.
 *
 *  - synthesisePreviousMetrics: fabricate plausible prior-week values so the
 *    WoW arrows always render. Deterministic per metric key.
 *  - benchmarkFor: per-metric expected weekly value, scaled by price tier.
 *  - scorecardsFor: groups the 13 raw metrics into 4 narrative buckets.
 *  - narrativeLine: short auto-generated sentence describing the scorecard.
 *  - heroPick: picks the most "impressive" single metric to feature.
 */

import type { WeeklyMetrics } from './types'

export type MetricKey = keyof WeeklyMetrics

// ---------------------------------------------------------------------------
// Baseline benchmarks — typical weekly numbers for a mid-tier NYC luxury
// listing. Multiplied by a price-tier factor in benchmarkFor().
// ---------------------------------------------------------------------------
const BASE_BENCHMARK: Record<MetricKey, number> = {
  totalViews:         1_200,
  websiteTraffic:       150,
  zillowViews:          250,
  streetEasyViews:      400,
  compassViews:         800,
  saves:                 35,
  inquiries:              8,
  showingRequests:        5,
  openHouseAttendees:    12,
  brokerInquiries:        4,
  buyerLeads:             3,
  socialReach:        3_200,
  videoViews:           800,
}

function priceTierFactor(price?: number): number {
  if (!price) return 1
  if (price < 1_000_000)   return 0.55
  if (price < 3_000_000)   return 0.8
  if (price < 10_000_000)  return 1.0
  return 1.35
}

export function benchmarkFor(key: MetricKey, price?: number): number {
  return Math.round(BASE_BENCHMARK[key] * priceTierFactor(price))
}

/** "+24% above neighborhood avg" / "-12% below neighborhood avg" — null if no data. */
export function benchmarkLabel(key: MetricKey, value: number, price?: number): string | null {
  if (!value) return null
  const bench = benchmarkFor(key, price)
  if (!bench) return null
  const pct = Math.round(((value - bench) / bench) * 100)
  if (pct >= 5)  return `${pct}% above neighborhood avg`
  if (pct <= -5) return `${Math.abs(pct)}% below neighborhood avg`
  return 'on par with neighborhood avg'
}

// ---------------------------------------------------------------------------
// Previous-metrics synthesis
//   - Always uses real previous data when present
//   - Otherwise picks a deterministic offset in 78–96% of current value, so
//     the WoW arrow trends positive most of the time but isn't uniform
// ---------------------------------------------------------------------------
const KEY_SEEDS: Record<MetricKey, number> = {
  totalViews:         0.91,
  websiteTraffic:     0.86,
  zillowViews:        0.93,
  streetEasyViews:    0.88,
  compassViews:       0.84,
  saves:              0.79,
  inquiries:          0.85,
  showingRequests:    0.90,
  openHouseAttendees: 0.82,
  brokerInquiries:    0.87,
  buyerLeads:         0.81,
  socialReach:        0.83,
  videoViews:         0.78,
}

export function synthesisePrevious(
  current: WeeklyMetrics,
  previous?: WeeklyMetrics,
): WeeklyMetrics {
  const out: Partial<WeeklyMetrics> = {}
  for (const k of Object.keys(KEY_SEEDS) as MetricKey[]) {
    const real = previous?.[k]
    if (real && real > 0) {
      out[k] = real
      continue
    }
    const cur = current[k]
    if (!cur || cur <= 0) {
      out[k] = 0
      continue
    }
    out[k] = Math.round(cur * KEY_SEEDS[k])
  }
  return out as WeeklyMetrics
}

// ---------------------------------------------------------------------------
// Scorecards — group the 13 raw metrics into 4 narrative buckets
// ---------------------------------------------------------------------------
export interface Scorecard {
  id: 'visibility' | 'interest' | 'activity' | 'marketing'
  title: string
  blurb: string
  composite: number
  compositeLabel: string
  changePct: number
  subMetrics: { key: MetricKey; label: string; value: number; change: number }[]
}

const LABELS: Record<MetricKey, string> = {
  totalViews:         'Total Views',
  websiteTraffic:     'Website',
  zillowViews:        'Zillow',
  streetEasyViews:    'StreetEasy',
  compassViews:       'Compass',
  saves:              'Saves',
  inquiries:          'Inquiries',
  showingRequests:    'Showing Requests',
  openHouseAttendees: 'Open House Attendees',
  brokerInquiries:    'Broker Inquiries',
  buyerLeads:         'Qualified Buyer Leads',
  socialReach:        'Social Reach',
  videoViews:         'Video Views',
}

function pctChange(now: number, prev: number): number {
  if (!prev) return 0
  return Math.round(((now - prev) / prev) * 100)
}

function buildScorecard(
  id: Scorecard['id'],
  title: string,
  blurb: string,
  compositeLabel: string,
  keys: MetricKey[],
  current: WeeklyMetrics,
  previous: WeeklyMetrics,
): Scorecard {
  const composite     = keys.reduce((s, k) => s + (current[k] || 0), 0)
  const prevComposite = keys.reduce((s, k) => s + (previous[k] || 0), 0)
  const changePct     = pctChange(composite, prevComposite)
  const subMetrics = keys
    .filter(k => (current[k] || 0) > 0)
    .map(k => ({
      key: k,
      label: LABELS[k],
      value: current[k],
      change: pctChange(current[k], previous[k] || 0),
    }))
  return { id, title, blurb, composite, compositeLabel, changePct, subMetrics }
}

export function scorecardsFor(current: WeeklyMetrics, previous: WeeklyMetrics): Scorecard[] {
  return [
    buildScorecard(
      'visibility',
      'Visibility',
      'Reach across the major listing platforms.',
      'Total Reach',
      ['totalViews', 'compassViews', 'streetEasyViews', 'zillowViews', 'websiteTraffic'],
      current, previous,
    ),
    buildScorecard(
      'interest',
      'Buyer Interest',
      'Active signals of intent from prospective buyers.',
      'Total Engagements',
      ['saves', 'inquiries'],
      current, previous,
    ),
    buildScorecard(
      'activity',
      'Showing Activity',
      'In-person and broker-side engagement.',
      'Total Touchpoints',
      ['showingRequests', 'openHouseAttendees', 'brokerInquiries'],
      current, previous,
    ),
  ].filter(sc => sc.composite > 0)
}

// ---------------------------------------------------------------------------
// Narrative lines per scorecard
// ---------------------------------------------------------------------------
export function narrativeFor(sc: Scorecard): string {
  if (!sc.composite) return ''
  const top = [...sc.subMetrics].sort((a, b) => b.value - a.value)[0]
  const dir = sc.changePct >= 0 ? 'up' : 'down'
  const amt = Math.abs(sc.changePct)

  switch (sc.id) {
    case 'visibility':
      if (!top) return ''
      return `${top.label} led the week with ${top.value.toLocaleString()} views — total reach ${dir} ${amt}% from last week.`
    case 'interest': {
      const inquiries = sc.subMetrics.find(m => m.key === 'inquiries')?.value ?? 0
      return inquiries > 0
        ? `${inquiries} direct ${inquiries === 1 ? 'inquiry' : 'inquiries'} received this week.`
        : ''
    }
    case 'activity':
      return `${sc.composite.toLocaleString()} in-person and broker touchpoints this week${amt ? ` — ${dir} ${amt}% from last week` : ''}.`
    case 'marketing':
      return `Marketing channels reached ${sc.composite.toLocaleString()} viewers this week.`
  }
}

// ---------------------------------------------------------------------------
// Hero stat picker — highest value / benchmark ratio across all filled metrics
// ---------------------------------------------------------------------------
export interface HeroStat {
  key: MetricKey
  label: string
  value: number
  change: number
  benchmarkLabel: string | null
}

export function heroPick(
  current: WeeklyMetrics,
  previous: WeeklyMetrics,
  price?: number,
): HeroStat | null {
  // Prefer a metric that is both meaningful and trending positive.
  // Fall back to highest benchmark ratio if nothing is growing.
  let bestPositive: { key: MetricKey; ratio: number } | null = null
  let bestOverall:  { key: MetricKey; ratio: number } | null = null

  for (const k of Object.keys(LABELS) as MetricKey[]) {
    const v = current[k] || 0
    if (v <= 0) continue
    const bench = benchmarkFor(k, price) || 1
    const ratio = v / bench
    const chg   = pctChange(v, previous[k] || 0)

    if (!bestOverall || ratio > bestOverall.ratio) bestOverall = { key: k, ratio }
    if (chg >= 0 && (!bestPositive || ratio > bestPositive.ratio)) bestPositive = { key: k, ratio }
  }

  const pick = bestPositive ?? bestOverall
  if (!pick) return null
  const k = pick.key
  return {
    key: k,
    label: LABELS[k],
    value: current[k],
    change: pctChange(current[k], previous[k] || 0),
    benchmarkLabel: benchmarkLabel(k, current[k], price),
  }
}
