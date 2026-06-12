'use client'
import { useState, useEffect } from 'react'
import { WeeklyReport, DEFAULT_INCLUDED_SECTIONS } from '@/lib/types'
import CoverPage        from './CoverPage'
import PropertyOverview from './PropertyOverview'
import WeeklySnapshot   from './WeeklySnapshot'
import OpenHouseReport  from './OpenHouseReport'
import MarketingActivities from './MarketingActivities'
import DigitalAds      from './DigitalAds'
import BuyerFeedback    from './BuyerFeedback'
import MarketActivity   from './MarketActivity'
import AgentStrategy    from './AgentStrategy'
import { Link as LinkIcon, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Props {
  report: WeeklyReport
  onDuplicate?: () => void
}

const NAV_ITEMS: { label: string; href: string; key: keyof import('@/lib/types').IncludedSections }[] = [
  { label: 'Overview',   href: '#property-overview', key: 'propertyOverview' },
  { label: 'Snapshot',   href: '#weekly-snapshot',   key: 'weeklySnapshot' },
  { label: 'Open House', href: '#open-house',        key: 'openHouses' },
  { label: 'Marketing',  href: '#marketing',         key: 'marketing' },
  { label: 'Social',     href: '#social',            key: 'socialMedia' },
  { label: 'Feedback',   href: '#feedback',          key: 'feedback' },
  { label: 'Market',     href: '#market',            key: 'marketActivity' },
  { label: 'Strategy',   href: '#strategy',          key: 'strategy' },
]

export default function ReportShell({ report, onDuplicate }: Props) {
  const [copied, setCopied] = useState(false)
  const [shareView, setShareView] = useState(false)
  const inc = report.includedSections ?? DEFAULT_INCLUDED_SECTIONS

  // Detect share view from URL (?share=1) — read on mount so SSR matches CSR
  useEffect(() => {
    setShareView(new URLSearchParams(window.location.search).get('share') === '1')
  }, [])

  const handleCopyLink = async () => {
    // Build a clean share URL: current path + ?share=1 (preserve existing non-share params)
    const u = new URL(window.location.href)
    u.searchParams.set('share', '1')
    const url = u.toString()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const printProperty = `${report.property.address}${report.property.unit ? ' · ' + report.property.unit : ''}`

  return (
    <>
      {/* Inject @page running header content via CSS variable */}
      <style>{`@page { --print-property: '${printProperty.replace(/'/g, "\\'")}'; }`}</style>

      {/* Sticky top nav — hidden in print AND in share view (seller-facing link) */}
      {!shareView && (
        <nav className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-luxury-cream">
          <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-luxury-taupe hover:text-luxury-black transition-colors text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All Reports</span>
              </Link>
              <div className="w-px h-4 bg-luxury-cream" />
              <span className="text-xs text-luxury-taupe font-medium truncate max-w-[180px] md:max-w-none">
                {report.property.address}
                {report.property.unit ? `, ${report.property.unit}` : ''} — Week {report.weekNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Section links — desktop only */}
              <div className="hidden lg:flex items-center gap-1">
                {NAV_ITEMS.filter(item => inc[item.key]).map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="px-2.5 py-1 text-xs text-luxury-taupe hover:text-luxury-black transition-colors section-label"
                  >
                    {label}
                  </a>
                ))}
              </div>
              <div className="w-px h-4 bg-luxury-cream hidden lg:block" />

              {onDuplicate && (
                <button
                  onClick={onDuplicate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-luxury-taupe hover:text-luxury-black border border-luxury-cream hover:border-luxury-sand transition-all"
                >
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Duplicate</span>
                </button>
              )}

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-luxury-black text-white hover:bg-luxury-dark transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                {copied ? 'Link copied' : 'Copy share link'}
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Report body */}
      <div id="report-root">
        <CoverPage report={report} />

        {inc.propertyOverview && (
          <div id="property-overview"><PropertyOverview report={report} /></div>
        )}

        {inc.weeklySnapshot && (
          <div id="weekly-snapshot"><WeeklySnapshot report={report} /></div>
        )}

        {inc.openHouses && ((report.openHouses && report.openHouses.length > 0) || (report.currentMetrics?.showingRequests ?? 0) > 0) && (
          <div id="open-house"><OpenHouseReport report={report} /></div>
        )}

        {inc.marketing && report.marketing && report.marketing.length > 0 && (
          <div id="marketing"><MarketingActivities report={report} /></div>
        )}

        {inc.socialMedia && report.digitalAds && (
          <div id="social"><DigitalAds report={report} /></div>
        )}

        {inc.feedback && (
          <div id="feedback"><BuyerFeedback report={report} /></div>
        )}

        {inc.marketActivity && (
          <div id="market"><MarketActivity report={report} /></div>
        )}

        {inc.strategy && (
          <div id="strategy"><AgentStrategy report={report} /></div>
        )}

      </div>
    </>
  )
}
