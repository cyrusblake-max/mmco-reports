'use client'

/**
 * Asset Library — a simple labeled registry of image URLs (headshots, logos, listing photos, etc.)
 *
 * Free tier model:
 *   • Assets that live in /public/ are pre-seeded below (deployed automatically with the app)
 *   • Users can add URLs from anywhere (Google Drive direct-link, Compass listing CDN, Imgur, etc.)
 *   • User-added entries live in localStorage initially — easy migration to Supabase later
 */

export type AssetCategory = 'headshot' | 'logo' | 'listing' | 'gallery' | 'other'

export interface Asset {
  id: string
  name: string
  url: string
  category: AssetCategory
  addedAt: string
  /** Filesystem path inside /public/ if the asset is bundled with the app. */
  bundled?: boolean
}

const STORAGE_KEY = 'mmco_asset_library_v1'

const SEEDED: Asset[] = [
  // Headshots
  { id: 'seed-headshot-maggie',  name: 'Maggie L. Marshall',  url: '/613-baltic-agent.jpg',         category: 'headshot', addedAt: '2026-05-01', bundled: true },
  { id: 'seed-headshot-cyrus',   name: 'Cyrus Blake',         url: '/cyrus-blake-headshot.webp',    category: 'headshot', addedAt: '2026-05-01', bundled: true },
  // Logos
  { id: 'seed-logo-mmco',        name: 'MM&Co.',              url: '/mmco-logo.png',                category: 'logo',     addedAt: '2026-05-01', bundled: true },
  { id: 'seed-logo-ingoodco',    name: 'In Good Co.',         url: '/ingoodco-logo.png',            category: 'logo',     addedAt: '2026-05-22', bundled: true },
  // Listing photos
  { id: 'seed-listing-baltic',   name: '613 Baltic — Hero',   url: '/613-baltic-listing.jpg',       category: 'listing',  addedAt: '2026-05-01', bundled: true },
]

export function getAssets(): Asset[] {
  if (typeof window === 'undefined') return SEEDED
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const userAssets: Asset[] = raw ? JSON.parse(raw) : []
    return [...SEEDED, ...userAssets]
  } catch {
    return SEEDED
  }
}

export function getAssetsByCategory(category: AssetCategory): Asset[] {
  return getAssets().filter(a => a.category === category)
}

function loadUserAssets(): Asset[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function saveUserAssets(arr: Asset[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

export function addAsset(input: Omit<Asset, 'id' | 'addedAt'>): Asset {
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const asset: Asset = { ...input, id, addedAt: new Date().toISOString() }
  saveUserAssets([...loadUserAssets(), asset])
  return asset
}

export function deleteAsset(id: string): void {
  if (id.startsWith('seed-')) return // bundled assets can't be deleted from UI
  saveUserAssets(loadUserAssets().filter(a => a.id !== id))
}

export function CATEGORY_LABEL(c: AssetCategory): string {
  switch (c) {
    case 'headshot': return 'Headshot'
    case 'logo':     return 'Logo'
    case 'listing':  return 'Listing Photo'
    case 'gallery':  return 'Gallery'
    case 'other':    return 'Other'
  }
}
