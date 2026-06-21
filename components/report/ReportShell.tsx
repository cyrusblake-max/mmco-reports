'use client'
import { useState, useEffect } from 'react'
import {
  WeeklyReport,
  DEFAULT_INCLUDED_SECTIONS,
  DEFAULT_SECTION_ORDER,
  SectionKey,
  IncludedSections,
} from '@/lib/types'
import CoverPage        from './CoverPage'
import PropertyOverview from './PropertyOverview'
import WeeklySnapshot   from './WeeklySnapshot'
import OpenHouseReport  from './OpenHouseReport'
import MarketingActivities from './MarketingActivities'
import DigitalAds      from './DigitalAds'
import BuyerFeedback    from './BuyerFeedback'
import MarketActivity   from './MarketActivity'
import AgentStrategy    from './AgentStrategy'
import CustomSectionBlock from './CustomSectionBlock'
import { Link as LinkIcon, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Props {
  report: WeeklyReport
  onDuplicate?: () => void
}

const NAV_LABELS: Record<SectionKey, { label: string; href: string }> = {
  propertyOverview: { label: 'Overview',    href: '#property-overview' },
  weeklySnapshot:   { label: 'Snapshot',    href: '#weekly-snapshot' },
  openHouses:       { label: 'Open House',  href: '#open-house' },
  marketing:        { label: 'Marketing',   href: '#marketing' },
  socialMedia:      { label: 'Social',      href: '#social' },
  digitalAds:       { label: 'Ads',         href: '#digital-ads' },
  feedback:         { label: 'Feedback',    href: '#feedback' },
  marketActivity:   { label: 'Market',      href: '#market' },
  strategy:         { label: 'Strategy',    href: '#strategy' },
}

export default function ReportShell({ report, onDuplicate }: Props) {
  const [copied, setCopied] = useState(false)
  const [shareView, setShareView] = useState(false)
  // Older reports may have `includedSections` missing the digitalAds key —
  // merge with defaults so toggling Digital Ads off doesn't silently fall back
  // to "true" on legacy data.
  const inc: IncludedSections = {
    ...DEFAULT_INCLUDED_SECTIONS,
    ...(report.includedSections ?? {}),
  }
  const customSections = report.customSections ?? []
  const customKeys = customSections.map(c => `custom:${c.id}`)
  const order: string[] = (report.sectionOrder && report.sectionOrder.length > 0
    ? report.sectionOrder
    : DEFAULT_SECTION_ORDER as string[])
  // Always append any custom sections that aren't yet referenced in the order
  // (e.g. just-added ones), so newly-added blocks render without requiring the
  // user to manually re-save the order.
  const finalOrder = [...order, ...customKeys.filter(k => !order.includes(k))]

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
              {/* Section links — desktop only. Reflects the chosen order so the
                  nav matches the actual report layout. */}
              <div className="hidden lg:flex items-center gap-1">
                {finalOrder.map(key => {
                  if (key.startsWith('custom:')) {
                    const id = key.slice('custom:'.length)
                    const c = customSections.find(s => s.id === id)
                    if (!c) return null
                    return (
                      <a
                        key={key}
                        href={`#${key.replace(':', '-')}`}
                        className="px-2.5 py-1 text-xs text-luxury-taupe hover:text-luxury-black transition-colors section-label"
                      >
                        {c.title.slice(0, 14) || 'Custom'}
                      </a>
                    )
                  }
                  const k = key as SectionKey
                  if (!inc[k]) return null
                  const nav = NAV_LABELS[k]
                  if (!nav) return null
                  return (
                    <a
                      key={key}
                      href={nav.href}
                      className="px-2.5 py-1 text-xs text-luxury-taupe hover:text-luxury-black transition-colors section-label"
                    >
                      {nav.label}
                    </a>
                  )
                })}
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

      {/* Report body — sequential section numbers assigned at render time so
          there are no gaps if some sections are turned off for a property.
          `sectionOrder` lets the agent rearrange the built-ins and interleave
          custom sections; the numbering follows whatever order survives the
          include filters. */}
      <div id="report-root">
        <CoverPage report={report} />
        {(() => {
          type Sec = { id: string; render: (n: string) => React.ReactNode }

          const builtins: Record<SectionKey, () => Sec | null> = {
            propertyOverview: () => inc.propertyOverview
              ? { id: 'property-overview', render: n => <PropertyOverview report={report} sectionNum={n} /> }
              : null,
            weeklySnapshot:   () => inc.weeklySnapshot
              ? { id: 'weekly-snapshot', render: n => <WeeklySnapshot report={report} sectionNum={n} /> }
              : null,
            openHouses:       () => inc.openHouses && (
              (report.openHouses && report.openHouses.length > 0) ||
              (report.currentMetrics?.showingRequests ?? 0) > 0
            )
              ? { id: 'open-house', render: n => <OpenHouseReport report={report} sectionNum={n} /> }
              : null,
            marketing:        () => inc.marketing && report.marketing && report.marketing.length > 0
              ? { id: 'marketing', render: n => <MarketingActivities report={report} sectionNum={n} /> }
              : null,
            socialMedia:      () => inc.socialMedia && report.socialMedia && report.socialMedia.length > 0
              ? { id: 'social', render: n => <DigitalAds report={report} sectionNum={n} /> }
              : null,
            digitalAds:       () => inc.digitalAds && report.digitalAds
              ? { id: 'digital-ads', render: n => <DigitalAds report={report} sectionNum={n} /> }
              : null,
            feedback:         () => inc.feedback
              ? { id: 'feedback', render: n => <BuyerFeedback report={report} sectionNum={n} /> }
              : null,
            marketActivity:   () => inc.marketActivity
              ? { id: 'market', render: n => <MarketActivity report={report} sectionNum={n} /> }
              : null,
            strategy:         () => inc.strategy
              ? { id: 'strategy', render: n => <AgentStrategy report={report} sectionNum={n} /> }
              : null,
          }

          // socialMedia is the legacy slot that ALSO rendered DigitalAds.
          // With the dedicated digitalAds toggle now in place, keep socialMedia
          // rendering DigitalAds ONLY when the user hasn't separately enabled
          // digitalAds, so we don't show the same section twice in a row.
          if (inc.digitalAds && report.digitalAds) {
            builtins.socialMedia = () => null
          }

          const seen = new Set<string>()
          const sections: Sec[] = []
          for (const key of finalOrder) {
            if (seen.has(key)) continue
            seen.add(key)
            if (key.startsWith('custom:')) {
              const id = key.slice('custom:'.length)
              const c = customSections.find(s => s.id === id)
              if (!c) continue
              sections.push({
                id: `custom-${id}`,
                render: n => <CustomSectionBlock section={c} sectionNum={n} />,
              })
              continue
            }
            const builder = builtins[key as SectionKey]
            if (!builder) continue
            const sec = builder()
            if (sec) sections.push(sec)
          }

          return sections.map((s, i) => {
            const num = String(i + 1).padStart(2, '0')
            return <div key={s.id} id={s.id}>{s.render(num)}</div>
          })
        })()}
      </div>
    </>
  )
}
