/**
 * Screenshot / report extraction — shared types, Zod schemas, and the
 * mapping layer between AI-extracted metrics and WeeklyReport fields.
 *
 * Accuracy rules baked in here and in /api/extract:
 *  • Numbers are only ever extracted, never invented — an unreadable value
 *    is omitted and surfaced as a warning.
 *  • Every metric carries its original on-screen label, a confidence score,
 *    an evidence description, and a period type (reporting period vs lifetime)
 *    so lifetime totals are never silently mixed into weekly numbers.
 *  • Nothing lands in the report until a human approves it on the review screen.
 */
import { z } from 'zod'
import type { WeeklyMetrics, WeeklyReport } from './types'

// ---------------------------------------------------------------------------
// Platforms & normalized metric names
// ---------------------------------------------------------------------------

export const SOURCE_PLATFORMS = [
  'compass', 'streeteasy', 'zillow', 'realtor', 'instagram', 'facebook',
  'tiktok', 'youtube', 'google_analytics', 'google_ads', 'mailchimp',
  'constant_contact', 'email', 'property_website', 'unknown',
] as const
export type SourcePlatform = typeof SOURCE_PLATFORMS[number]

export const PLATFORM_LABELS: Record<SourcePlatform, string> = {
  compass: 'Compass', streeteasy: 'StreetEasy', zillow: 'Zillow',
  realtor: 'Realtor.com', instagram: 'Instagram', facebook: 'Facebook',
  tiktok: 'TikTok', youtube: 'YouTube', google_analytics: 'Google Analytics',
  google_ads: 'Google Ads', mailchimp: 'Mailchimp',
  constant_contact: 'Constant Contact', email: 'Email Marketing',
  property_website: 'Property Website', unknown: 'Unknown Source',
}

export const NORMALIZED_METRICS = [
  'listing_views', 'unique_visitors', 'saves', 'shares', 'inquiries',
  'contact_requests', 'click_throughs', 'email_opens', 'email_clicks',
  'email_sends', 'social_reach', 'social_impressions', 'likes', 'comments',
  'video_views', 'website_visits', 'syndication_views', 'ad_impressions',
  'ad_clicks', 'showing_requests', 'days_on_market', 'search_appearances',
  'followers', 'open_house_attendees', 'other',
] as const
export type NormalizedMetric = typeof NORMALIZED_METRICS[number]

export const PERIOD_TYPES = ['reporting_period', 'lifetime', 'unknown'] as const
export type PeriodType = typeof PERIOD_TYPES[number]

export const PERIOD_LABELS: Record<PeriodType, string> = {
  reporting_period: 'This period',
  lifetime: 'Lifetime total',
  unknown: 'Period unclear',
}

// ---------------------------------------------------------------------------
// Zod schemas — the strict contract for the AI response
// ---------------------------------------------------------------------------

export const ExtractedMetricSchema = z.object({
  originalLabel: z.string().min(1),
  normalizedMetric: z.enum(NORMALIZED_METRICS),
  value: z.number().finite().nonnegative(),
  unit: z.enum(['count', 'percent', 'currency', 'days']).default('count'),
  periodType: z.enum(PERIOD_TYPES),
  confidence: z.number().min(0).max(1),
  evidenceDescription: z.string(),
  requiresReview: z.boolean(),
})
export type ExtractedMetric = z.infer<typeof ExtractedMetricSchema>

export const ExtractionResultSchema = z.object({
  sourcePlatform: z.enum(SOURCE_PLATFORMS),
  reportType: z.string(),
  reportingPeriod: z.object({
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    label: z.string().nullable(),
    confidence: z.number().min(0).max(1),
  }),
  metrics: z.array(ExtractedMetricSchema),
  warnings: z.array(z.string()),
  notes: z.string().nullable(),
})
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

/** JSON-schema mirror of ExtractionResultSchema, fed to the model as a tool. */
export const EXTRACTION_TOOL_SCHEMA = {
  type: 'object' as const,
  properties: {
    sourcePlatform: { type: 'string', enum: [...SOURCE_PLATFORMS], description: 'Best guess of the platform the screenshot came from. Use "unknown" if unclear — never guess confidently.' },
    reportType: { type: 'string', description: 'Short label, e.g. "listing_performance", "email_campaign", "social_insights", "ad_report".' },
    reportingPeriod: {
      type: 'object',
      properties: {
        startDate: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD if visible, else null' },
        endDate: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD if visible, else null' },
        label: { type: ['string', 'null'], description: 'The date-range text exactly as shown on screen, e.g. "Last 7 days", else null' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['startDate', 'endDate', 'label', 'confidence'],
    },
    metrics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalLabel: { type: 'string', description: 'The label exactly as it appears on screen' },
          normalizedMetric: { type: 'string', enum: [...NORMALIZED_METRICS] },
          value: { type: 'number', description: 'The number exactly as shown. Expand K/M suffixes (1.2K → 1200). NEVER estimate a partially-visible number — omit it and add a warning instead.' },
          unit: { type: 'string', enum: ['count', 'percent', 'currency', 'days'] },
          periodType: { type: 'string', enum: [...PERIOD_TYPES], description: '"reporting_period" only when the screen clearly scopes this number to a date range; "lifetime" for since-listing/all-time totals; "unknown" when you cannot tell.' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          evidenceDescription: { type: 'string', description: 'Where on the screenshot this number appears, e.g. "large numeral in upper-left card labeled Views".' },
          requiresReview: { type: 'boolean', description: 'true when confidence < 0.85, the label is ambiguous, or the period type is unknown.' },
        },
        required: ['originalLabel', 'normalizedMetric', 'value', 'unit', 'periodType', 'confidence', 'evidenceDescription', 'requiresReview'],
      },
    },
    warnings: { type: 'array', items: { type: 'string' }, description: 'Unreadable numbers, cut-off values, ambiguous labels, suspected duplicate content, mixed periods, etc.' },
    notes: { type: ['string', 'null'], description: 'Anything else useful for a human reviewer.' },
  },
  required: ['sourcePlatform', 'reportType', 'reportingPeriod', 'metrics', 'warnings', 'notes'],
}

// ---------------------------------------------------------------------------
// Mapping extracted metrics → WeeklyMetrics fields
// ---------------------------------------------------------------------------

export type MetricTarget = keyof WeeklyMetrics | 'skip'

/**
 * Suggested report field for a (platform, metric) pair. The review UI shows
 * this as a pre-selected dropdown the user can override. 'skip' = shown to the
 * user but not auto-importable into a numeric field.
 */
export function suggestTarget(platform: SourcePlatform, metric: NormalizedMetric): MetricTarget {
  if (metric === 'listing_views' || metric === 'unique_visitors' || metric === 'syndication_views') {
    switch (platform) {
      case 'streeteasy': return 'streetEasyViews'
      case 'zillow': case 'realtor': return 'zillowViews'
      case 'compass': return 'compassViews'
      case 'property_website': case 'google_analytics': return 'websiteTraffic'
      default: return 'totalViews'
    }
  }
  switch (metric) {
    case 'saves': return 'saves'
    case 'inquiries': case 'contact_requests': return 'inquiries'
    case 'showing_requests': return 'showingRequests'
    case 'open_house_attendees': return 'openHouseAttendees'
    case 'social_reach': case 'social_impressions': return 'socialReach'
    case 'video_views': return 'videoViews'
    case 'website_visits': return 'websiteTraffic'
    default: return 'skip'
  }
}

// ---------------------------------------------------------------------------
// Provenance — what the report keeps after an import is approved
// ---------------------------------------------------------------------------

export interface ApprovedMetric extends ExtractedMetric {
  /** Report field the user chose to import into (or 'skip'). */
  target: MetricTarget
  /** Value after any manual correction on the review screen. */
  finalValue: number
  /** True when the user edited the extracted value. */
  corrected: boolean
}

export interface ExtractionRecord {
  id: string
  fileName: string
  importedAt: string
  sourcePlatform: SourcePlatform
  reportType: string
  periodLabel: string | null
  /** Small JPEG thumbnail (~400px) of the source screenshot for later review. */
  thumbnail?: string
  metrics: ApprovedMetric[]
  warnings: string[]
}

/**
 * Apply a set of approved metrics to a report. Pure — returns a new report.
 * Only 'reporting_period' + 'unknown' metrics land in currentMetrics; the
 * caller is responsible for having warned the user about lifetime totals.
 */
export function applyExtractions(report: WeeklyReport, records: ExtractionRecord[]): WeeklyReport {
  const metrics: WeeklyMetrics = { ...report.currentMetrics }
  for (const rec of records) {
    for (const m of rec.metrics) {
      if (m.target === 'skip') continue
      metrics[m.target] = m.finalValue
    }
  }
  return {
    ...report,
    currentMetrics: metrics,
    extractions: [...(report.extractions ?? []), ...records],
  }
}
