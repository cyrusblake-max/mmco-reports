'use client'
import { WeeklyReport } from '@/lib/types'
import { formatCurrency, formatDate, daysOnMarket } from '@/lib/utils'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

export default function PropertyOverview({ report }: Props) {
  const { property } = report
  const dom = daysOnMarket(property.listingDate)

  return (
    <section className="report-section">
      <div className="max-w-6xl mx-auto px-6 md:px-12">

        <SectionMast
          num="01"
          eyebrow="01 — Property Overview"
          title="The Residence"
          kicker={`A ${property.beds}-bedroom, ${property.baths}-bath ${property.neighborhood} home presented with discretion and precision.`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* — Left: image takeover (7 cols) — */}
          <div className="lg:col-span-7 relative">
            <div className="aspect-[4/3] overflow-hidden bg-luxury-cream">
              {property.mainImageUrl ? (
                <img
                  src={property.mainImageUrl}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="section-label text-luxury-taupe">Image Pending</span>
                </div>
              )}
            </div>

            {/* Caption + price tab */}
            <div className="mt-5 flex items-end justify-between gap-6">
              <p className="section-label text-luxury-taupe max-w-[28ch]">
                {property.address}{property.unit ? `, ${property.unit}` : ''} · {property.neighborhood}
              </p>
              <div className="text-right">
                <p className="section-label text-luxury-gold mb-2">List Price</p>
                <p
                  className="font-serif-display font-light leading-none"
                  style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', letterSpacing: '-0.015em' }}
                >
                  {formatCurrency(property.price)}
                </p>
              </div>
            </div>
          </div>

          {/* — Right: editorial spec column (5 cols) — */}
          <div className="lg:col-span-5">
            <div className="rule-soft" />

            {/* Spec rows — elegant key/value typography */}
            <dl className="divide-y divide-[var(--rule)]">
              {[
                { label: 'Bedrooms',     value: `${property.beds}` },
                { label: 'Bathrooms',    value: `${property.baths}` },
                { label: 'Interior',     value: property.sqft ? `${property.sqft.toLocaleString()} sf` : '—' },
                { label: 'Neighborhood', value: property.neighborhood },
                { label: 'Listed',       value: formatDate(property.listingDate, 'short') },
                { label: 'Days on Market', value: `${dom}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between py-5">
                  <dt className="section-label text-luxury-taupe">{label}</dt>
                  <dd
                    className="font-serif-display font-light leading-none"
                    style={{ fontSize: '1.55rem', letterSpacing: '-0.005em' }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="rule-soft-b" />

            {/* Description as editorial pull — drop cap */}
            {property.description && (
              <div className="mt-10">
                <p className="section-label text-luxury-gold mb-4">About the Home</p>
                <p
                  className="dropcap text-luxury-black/85 leading-relaxed"
                  style={{ fontSize: '0.95rem', lineHeight: 1.7 }}
                >
                  {property.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gallery row — magazine grid */}
        {property.galleryImages && property.galleryImages.length > 0 && (
          <div className="mt-20">
            <div className="flex items-baseline justify-between mb-6">
              <p className="section-label text-luxury-taupe">Selected Imagery</p>
              <div className="rule-gold flex-1 ml-6" style={{ maxWidth: '12rem' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {property.galleryImages.slice(0, 3).map((src, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden">
                  <img
                    src={src}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent strip — refined */}
        <div className="mt-20 pt-10 rule-soft">
          <div className="flex items-center gap-5">
            {property.agent.photoUrl && (
              <img
                src={property.agent.photoUrl}
                alt={property.agent.name}
                className="w-16 h-16 rounded-full object-cover border border-luxury-cream"
              />
            )}
            <div className="flex-1">
              <p className="section-label text-luxury-gold mb-1">Listing Representation</p>
              {property.agent.name ? (
                <>
                  <p className="font-serif-display text-2xl font-light leading-tight">{property.agent.name}</p>
                  <p className="text-luxury-taupe text-sm mt-1">
                    {property.agent.title}{property.agent.title && property.agent.team ? ' · ' : ''}{property.agent.team}{property.agent.brokerage ? ` · ${property.agent.brokerage}` : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-serif-display text-2xl font-light leading-tight">{property.agent.team}</p>
                  <p className="text-luxury-taupe text-sm mt-1">{property.agent.brokerage}</p>
                </>
              )}
            </div>
            <div className="text-right hidden sm:block">
              {property.agent.phone && <p className="text-luxury-black text-sm">{property.agent.phone}</p>}
              {property.agent.email && <p className="text-luxury-taupe text-xs mt-1">{property.agent.email}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
