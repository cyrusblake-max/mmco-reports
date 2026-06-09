/**
 * Report store.
 *
 *  • Seed reports (Baltic, Mock) ALWAYS come from the source file.
 *    Updates to the fixture land for everyone on the next deploy.
 *  • User-created reports go to Supabase if configured (multi-device sync).
 *  • If Supabase env vars are missing, falls back to localStorage so dev
 *    still works.
 */

import { WeeklyReport } from './types'
import { MOCK_REPORT } from './mock-data'
import { BALTIC_REPORT } from './baltic-report'
import { sb, supabaseConfigured } from './supabase'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'luxury_reports_v3'

const SEEDS: WeeklyReport[] = [BALTIC_REPORT, MOCK_REPORT]
const SEED_IDS = new Set(SEEDS.map(r => r.id))

interface RemoteRow {
  id: string
  data: WeeklyReport
  updated_at?: string
}

// -- localStorage fallback ------------------------------------------------
function lsLoad(): WeeklyReport[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}
function lsSave(arr: WeeklyReport[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

// -- Public API -----------------------------------------------------------
export async function getReports(): Promise<WeeklyReport[]> {
  let userReports: WeeklyReport[] = []
  if (supabaseConfigured) {
    try {
      const rows = await sb<RemoteRow[]>('/reports?select=id,data,updated_at&order=updated_at.desc')
      userReports = rows.map(r => r.data)
    } catch (e) {
      console.warn('[store] Supabase read failed, falling back to localStorage:', e)
      userReports = lsLoad()
    }
  } else {
    userReports = lsLoad()
  }
  // Seeds always win — drop any DB copy with the same id
  const filtered = userReports.filter(r => !SEED_IDS.has(r.id))
  return [...SEEDS, ...filtered]
}

export async function getReport(id: string): Promise<WeeklyReport | null> {
  // Seed reports always come from source — code change = everyone sees it
  const seed = SEEDS.find(r => r.id === id)
  if (seed) return seed

  if (supabaseConfigured) {
    try {
      const rows = await sb<RemoteRow[]>(`/reports?id=eq.${encodeURIComponent(id)}&select=data&limit=1`)
      return rows[0]?.data ?? null
    } catch (e) {
      console.warn('[store] Supabase fetch failed:', e)
      return lsLoad().find(r => r.id === id) ?? null
    }
  }
  return lsLoad().find(r => r.id === id) ?? null
}

export async function saveReport(report: WeeklyReport): Promise<void> {
  // Block writes to seed ids — those are source-of-truth in code
  if (SEED_IDS.has(report.id)) {
    console.warn('[store] refusing to overwrite seed report', report.id, '— edit the fixture file instead')
    return
  }

  if (supabaseConfigured) {
    try {
      await sb(`/reports?on_conflict=id`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          id: report.id,
          data: report,
          updated_at: new Date().toISOString(),
        }),
      })
      return
    } catch (e) {
      console.warn('[store] Supabase write failed, falling back to localStorage:', e)
    }
  }

  const arr = lsLoad()
  const i = arr.findIndex(r => r.id === report.id)
  if (i >= 0) arr[i] = report
  else arr.unshift(report)
  lsSave(arr)
}

export async function deleteReport(id: string): Promise<void> {
  if (SEED_IDS.has(id)) return
  if (supabaseConfigured) {
    try {
      await sb(`/reports?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (e) { console.warn('[store] Supabase delete failed:', e) }
  }
  // Always remove from local fallback too
  lsSave(lsLoad().filter(r => r.id !== id))
}

export async function duplicateReport(id: string): Promise<WeeklyReport | null> {
  const original = await getReport(id)
  if (!original) return null
  const newReport: WeeklyReport = {
    ...original,
    id: uuidv4(),
    weekNumber: original.weekNumber + 1,
    reportDate: new Date().toISOString().split('T')[0],
    previousMetrics: original.currentMetrics,
    metricsHistory: [...original.metricsHistory],
  }
  await saveReport(newReport)
  return newReport
}

export async function createBlankReport(): Promise<WeeklyReport> {
  const today = new Date().toISOString().split('T')[0]
  const blank: WeeklyReport = {
    ...MOCK_REPORT,
    id: uuidv4(),
    weekNumber: 1,
    reportDate: today,
    weekStartDate: today,
    weekEndDate: today,
    previousMetrics: undefined,
    metricsHistory: [],
    openHouses: [],
    marketing: [],
    socialMedia: [],
    property: {
      ...MOCK_REPORT.property,
      address: '',
      unit: '',
      neighborhood: '',
      price: 0,
      beds: 0,
      baths: 0,
      sqft: 0,
      listingDate: today,
      mainImageUrl: '',
      galleryImages: [],
      description: '',
      agent: {
        name: '',
        title: 'Licensed Associate Real Estate Broker',
        team: 'MM&co',
        brokerage: 'Compass',
        phone: '',
        email: '',
        photoUrl: '',
        logoUrl: '/mmco-logo.png',
      },
    },
    currentMetrics: {
      totalViews: 0, websiteTraffic: 0, zillowViews: 0, streetEasyViews: 0,
      compassViews: 0, saves: 0, inquiries: 0, showingRequests: 0,
      openHouseAttendees: 0, brokerInquiries: 0, buyerLeads: 0,
      socialReach: 0, videoViews: 0,
    },
    feedback: { items: [], commonObjections: '', pricingFeedback: '', layoutFeedback: '', competingProperties: '', brokerSentiment: '', recommendedAdjustments: '' },
    strategy: { keyRecommendations: '', marketingPlanNextWeek: '', pricingStrategy: '', upcomingCampaigns: '', brokerEvents: '', openHousesPlanned: '' },
    marketActivity: { newListings: [], priceReductions: [], underContract: [], recentSales: [], neighborhoodTrends: '' },
  }
  await saveReport(blank)
  return blank
}
