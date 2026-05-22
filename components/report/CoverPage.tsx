'use client'
import { WeeklyReport } from '@/lib/types'
import { formatCurrency, formatDate, daysOnMarket } from '@/lib/utils'

interface Props { report: WeeklyReport }

export default function CoverPage({ report }: Props) {
  const { property, weekNumber, weekStartDate, weekEndDate } = report
  const dom = daysOnMarket(property.listingDate)

  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden print-page-break"
      style={{ background: 'var(--ink)' }}
    >
      {/* Hero image — covers full cover with elegant gradient overlays */}
      {property.mainImageUrl && (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${property.mainImageUrl})`, opacity: 0.45 }}
        />
      )}

      {/* Layered olive-black gradients for editorial depth */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(30,31,25,0.82) 0%, rgba(30,31,25,0.4) 50%, rgba(30,31,25,0.88) 100%)' }} />
      <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(30,31,25,0.55) 0%, transparent 50%, rgba(30,31,25,0.35) 100%)' }} />

      {/* Top masthead bar — Confidential on left, MM&Co logo on right (larger), vertically centered */}
      <div className="relative z-10 px-10 md:px-16 pt-10 md:pt-12">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="section-label text-luxury-gold">Confidential</p>
            <p className="section-label text-white/45 mt-1.5">Seller Report</p>
            <p className="section-label text-white/30 mt-3">{formatDate(report.reportDate, 'short')}</p>
          </div>
          <div className="flex items-center gap-4">
            {property.agent.logoUrl ? (
              <img
                src={property.agent.logoUrl}
                alt={property.agent.team}
                className="h-32 md:h-40 lg:h-48 object-contain brightness-0 invert"
              />
            ) : (
              <div className="text-right">
                <p
                  className="font-serif-display text-white font-light leading-none"
                  style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)', letterSpacing: '-0.02em' }}
                >
                  {property.agent.team || property.agent.brokerage}
                </p>
                {property.agent.team && (
                  <p className="section-label-lg text-luxury-gold mt-2">
                    {property.agent.brokerage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top rule under the masthead */}
        <div className="mt-10 md:mt-12 flex items-center gap-6">
          <div className="h-px flex-1 bg-white/15" />
          <span className="section-label text-luxury-gold">Week {weekNumber} · Performance Brief</span>
          <div className="h-px flex-1 bg-white/15" />
        </div>
      </div>

      {/* Center hero — vertically anchored bottom-left, NYC editorial style */}
      <div className="relative z-10 flex-1 flex flex-col justify-end px-10 md:px-16 pb-16 md:pb-24">
        <div className="max-w-4xl">
          <p className="section-label text-luxury-gold mb-6">The Property</p>

          <h1
            className="font-serif-display text-white font-light leading-[0.92] mb-4"
            style={{ fontSize: 'clamp(3.5rem, 8.5vw, 7rem)', letterSpacing: '-0.025em' }}
          >
            {property.address}
          </h1>
          {property.unit && (
            <p
              className="font-serif-display text-luxury-gold font-light italic leading-tight"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)', letterSpacing: '-0.01em' }}
            >
              {property.unit}
            </p>
          )}

          <p className="section-label-lg text-white/55 mt-6">
            {property.neighborhood} · {property.city}, {property.state}
          </p>

          {/* Ornamental rule */}
          <div className="my-10 md:my-12">
            <div className="rule-gold" style={{ width: '5rem' }} />
          </div>

          {/* Editorial spec strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6">
            {[
              { label: 'List Price',     value: formatCurrency(property.price) },
              { label: 'Bedrooms',       value: `${property.beds}` },
              { label: 'Bathrooms',      value: `${property.baths}` },
              { label: 'Square Feet',    value: property.sqft ? property.sqft.toLocaleString() : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="section-label text-luxury-gold mb-2.5">{label}</p>
                <p
                  className="font-serif-display text-white font-light leading-none"
                  style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.85rem)', letterSpacing: '-0.01em' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Reporting period */}
          <p className="section-label text-white/40 mt-12">
            Reporting Period · {formatDate(weekStartDate, 'short')} – {formatDate(weekEndDate, 'short')}
          </p>
        </div>
      </div>

      {/* Bottom agent strip */}
      <div className="relative z-10 border-t border-white/10 backdrop-blur-md" style={{ background: 'rgba(30,31,25,0.55)' }}>
        <div className="px-10 md:px-16 py-7 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-8 flex-wrap">
            {[property.agent, ...(property.coAgents ?? [])].map((agent, i) => (
              <div key={i} className="flex items-center gap-4">
                {agent.photoUrl && (
                  <img
                    src={agent.photoUrl}
                    alt={agent.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/20"
                  />
                )}
                <div>
                  <p className="text-white font-medium text-sm tracking-tight">{agent.name}</p>
                  <p className="section-label text-white/45 mt-0.5">
                    {agent.title}{agent.title && agent.team ? ' · ' : ''}{agent.team}
                  </p>
                  {agent.phone && <p className="text-white/35 text-xs mt-0.5">{agent.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
