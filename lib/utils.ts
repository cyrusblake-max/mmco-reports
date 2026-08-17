import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-US').format(value)
}

export function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export function formatDate(dateStr: string, format: 'long' | 'short' | 'month' = 'long'): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (format === 'long')  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  if (format === 'short') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Label for the reporting window ("This Week" / "Last Two Weeks") based on
// how many days the report actually covers.
export function periodLabel(weekStartDate?: string, weekEndDate?: string): string {
  if (!weekStartDate || !weekEndDate) return 'This Week'
  const start = new Date(weekStartDate + 'T00:00:00')
  const end   = new Date(weekEndDate + 'T00:00:00')
  const days  = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  // A window stretched a few days past 7 (e.g. to catch a weekend open house)
  // still reads as one week; only a true fortnight gets the two-week label.
  if (days <= 12) return 'This Week'
  if (days <= 16) return 'Last Two Weeks'
  return 'This Period'
}

export function daysOnMarket(listingDate: string): number {
  const listed = new Date(listingDate)
  const today  = new Date()
  return Math.floor((today.getTime() - listed.getTime()) / (1000 * 60 * 60 * 24))
}
