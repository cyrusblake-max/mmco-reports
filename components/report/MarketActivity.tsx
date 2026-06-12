'use client'
import { WeeklyReport, ComparableListing } from '@/lib/types'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingDown, ArrowRight } from 'lucide-react'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport; sectionNum?: string }

const STATUS_CONFIG = {
  active:   { label: 'Active',           dot: 'bg-luxury-gold',  text: 'text-luxury-gold' },
  contract: { label: 'Under Contract',   dot: 'bg-success',      text: 'text-success' },
  sold:     { label: 'Sold',             dot: 'bg-luxury-black', text: 'text-luxury-taupe' },
  reduced:  { label: 'Price Reduced',    dot: 'bg-danger',       text: 'text-danger' },
}

function CompRow({ listing, showChange = false }: { listing: ComparableListing; showChange?: boolean }) {
  const cfg = STATUS_CONFIG[listing.status]
  return (
    <div className="grid grid-cols-12 gap-2 py-4 border-b border-luxury-cream items-center last:border-0">
      <div className="col-span-5">
        <p className="text-sm font-medium leading-snug">{listing.address}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className={`section-label ${cfg.text}`}>{cfg.label}</span>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <p className="text-sm font-medium">{formatCurrency(listing.price, true)}</p>
        {showChange && listing.priceChange && (
          <p className="text-danger text-xs">{formatCurrency(listing.priceChange, true)}</p>
        )}
      </div>
      <div className="col-span-1 text-center text-sm text-luxury-taupe">{listing.beds}BD</div>
      <div className="col-span-1 text-center text-sm text-luxury-taupe">{listing.baths}BA</div>
      <div className="col-span-2 text-right text-sm text-luxury-taupe">{formatNumber(listing.sqft)} SF</div>
      <div className="col-span-1 text-right text-xs text-luxury-taupe">{listing.daysOnMarket ?? '—'}d</div>
    </div>
  )
}

function CompsTable({ title, listings, showChange = false }: {
  title: string; listings: ComparableListing[]; showChange?: boolean
}) {
  if (!listings || listings.length === 0) return null
  return (
    <div className="mb-10">
      <p className="section-label text-luxury-taupe mb-3">{title}</p>
      <div className="bg-white border border-luxury-cream px-6">
        <div className="grid grid-cols-12 gap-2 py-3 border-b border-luxury-cream">
          <div className="col-span-5"><p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>Address</p></div>
          <div className="col-span-2 text-right"><p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>Price</p></div>
          <div className="col-span-1 text-center"><p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>BD</p></div>
          <div className="col-span-1 text-center"><p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>BA</p></div>
          <div className="col-span-2 text-right"><p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>Sqft</p></div>
          <div className="col-span-1 text-right"><p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>DOM</p></div>
        </div>
        {listings.map(listing => (
          <CompRow key={listing.id} listing={listing} showChange={showChange} />
        ))}
      </div>
    </div>
  )
}

export default function MarketActivity({ report, sectionNum = '07' }: Props) {
  const { marketActivity } = report
  if (!marketActivity) return null

  const { newListings, priceReductions, underContract, recentSales, neighborhoodTrends } = marketActivity

  return (
    <section className="report-section bg-white print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num={sectionNum}
          eyebrow={`${sectionNum} — Market Activity`}
          title="The Competitive Landscape"
          kicker="New listings, contracts, and closed sales across the immediate competitive set."
        />
        <p className="hidden">
          .
        </p>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-px bg-luxury-cream mb-12">
          {[
            { label: 'New Listings',   value: newListings?.length ?? 0,   color: 'text-luxury-taupe' },
            { label: 'Under Contract', value: underContract?.length ?? 0, color: 'text-success' },
            { label: 'Recent Sales',   value: recentSales?.length ?? 0,   color: 'text-luxury-black' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-luxury-off p-6 text-center">
              <p className={`font-serif-display text-4xl font-light ${color}`}>{value}</p>
              <p className="section-label text-luxury-taupe mt-2">{label}</p>
            </div>
          ))}
        </div>

        <CompsTable title="New Competing Listings"   listings={newListings} />
        <CompsTable title="Recently Under Contract" listings={underContract} />
        <CompsTable title="Recent Comparable Sales"  listings={recentSales} />

        {/* Neighborhood trends */}
        {neighborhoodTrends && (
          <div className="bg-luxury-black text-white p-8">
            <p className="section-label text-luxury-gold mb-4">Neighborhood Market Trends</p>
            <div className="flex gap-3">
              <ArrowRight className="w-4 h-4 text-luxury-gold flex-shrink-0 mt-0.5" />
              <p className="text-white/70 text-sm leading-relaxed">{neighborhoodTrends}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
