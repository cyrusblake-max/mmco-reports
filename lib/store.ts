'use client'
import { WeeklyReport } from './types'
import { MOCK_REPORT } from './mock-data'
import { BALTIC_REPORT } from './baltic-report'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'luxury_reports_v2'

function seed(): WeeklyReport[] {
  return [BALTIC_REPORT, MOCK_REPORT]
}

export function getReports(): WeeklyReport[] {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = seed()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw) as WeeklyReport[]
  } catch {
    return seed()
  }
}

export function getReport(id: string): WeeklyReport | null {
  // Seed reports (Baltic, Mock) always come from source — so edits to the
  // fixture file land for everyone instead of being shadowed by stale localStorage.
  const seedMatch = seed().find(r => r.id === id)
  if (seedMatch) return seedMatch
  return getReports().find(r => r.id === id) ?? null
}

export function saveReport(report: WeeklyReport): void {
  if (typeof window === 'undefined') return
  const reports = getReports()
  const idx = reports.findIndex(r => r.id === report.id)
  if (idx >= 0) {
    reports[idx] = report
  } else {
    reports.unshift(report)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
}

export function deleteReport(id: string): void {
  if (typeof window === 'undefined') return
  const reports = getReports().filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
}

export function duplicateReport(id: string): WeeklyReport | null {
  const original = getReport(id)
  if (!original) return null
  const newReport: WeeklyReport = {
    ...original,
    id: uuidv4(),
    weekNumber: original.weekNumber + 1,
    reportDate: new Date().toISOString().split('T')[0],
    previousMetrics: original.currentMetrics,
    metricsHistory: [...original.metricsHistory],
  }
  saveReport(newReport)
  return newReport
}

export function createBlankReport(): WeeklyReport {
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
  saveReport(blank)
  return blank
}
