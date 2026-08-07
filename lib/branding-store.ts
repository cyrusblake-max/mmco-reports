/**
 * Team branding defaults — applied to every NEW report at creation time
 * (existing reports keep whatever they were created with, so a rebrand never
 * silently rewrites an already-sent report). Persisted in localStorage;
 * report-embedded copies travel with the report JSON so PDF export and other
 * devices render them without needing this store.
 */
import type { Agent } from './types'

export interface BrandingSettings {
  teamName: string
  logoUrl: string
  defaultAgent: Agent
  /** Shown at the end of every report, e.g. team tagline + contact line. */
  footerText: string
  /** Legal/compliance line, e.g. Equal Housing Opportunity + license info. */
  disclaimer: string
}

export const DEFAULT_BRANDING: BrandingSettings = {
  teamName: 'MM&Co',
  logoUrl: '/mmco-logo.png',
  defaultAgent: {
    name: '',
    title: 'Licensed Associate Real Estate Broker',
    team: 'MM&co',
    brokerage: 'Compass',
    phone: '',
    email: '',
    photoUrl: '',
    logoUrl: '/mmco-logo.png',
  },
  footerText: 'Prepared by MM&Co · Compass — actively marketing your home every week.',
  disclaimer: 'Equal Housing Opportunity. All information is from sources deemed reliable but is subject to errors and omissions. This report is provided for informational purposes only and does not constitute an appraisal or legal, financial, or tax advice.',
}

const KEY = 'mmco_branding_v1'

export function getBranding(): BrandingSettings {
  if (typeof window === 'undefined') return DEFAULT_BRANDING
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_BRANDING
    const parsed = JSON.parse(raw) as Partial<BrandingSettings>
    return {
      ...DEFAULT_BRANDING,
      ...parsed,
      defaultAgent: { ...DEFAULT_BRANDING.defaultAgent, ...(parsed.defaultAgent ?? {}) },
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

export function saveBranding(settings: BrandingSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export function resetBranding(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
