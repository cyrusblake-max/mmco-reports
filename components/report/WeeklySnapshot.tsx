'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts'
import { WeeklyReport } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import {
  synthesisePrevious, scorecardsFor, heroPick,
} from '@/lib/derived-metrics'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

export default function WeeklySnapshot({ report }: Props) {
  const { currentMetrics, previousMetrics, metricsHistory, property } = report
  const previous = synthesisePrevious(currentMetrics, previousMetrics)
  const scorecards = scorecardsFor(currentMetrics, previous)
  const hero = heroPick(currentMetrics, previous, property.price)

  const chartData = metricsHistory.map(snap => ({
    week: snap.weekLabel,
    'Total Views':  snap.metrics.totalViews,
    'Inquiries':    snap.metrics.inquiries,
    'Buyer Leads':  snap.metrics.buyerLeads,
    'Saves':        snap.metrics.saves,
    'Social Reach': snap.metrics.socialReach,
  }))

  const inPersonData = metricsHistory.map(snap => ({
    week: snap.weekLabel,
    'Open House':  snap.metrics.openHouseAttendees,
    'Showings':    snap.metrics.showingRequests,
    'Total':       snap.metrics.openHouseAttendees + snap.metrics.showingRequests,
  }))

  return (
    <section className="report-section-beige print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num="02"
          eyebrow="02 — Performance Snapshot"
          title="The Week in Numbers"
          kicker="A reading of audience reach, buyer engagement, and channel performance across the listing platforms."
        />

        {/* ── HERO STAT ── */}
        {hero && (
          <div className="bg-white border border-luxury-cream px-8 md:px-16 py-14 md:py-20 mb-10 text-center">
            <p className="section-label text-luxury-taupe mb-4">{hero.label} · This Week</p>
            <p
              className="font-serif-display font-light leading-none mb-5"
              style={{ fontSize: 'clamp(4.5rem, 12vw, 9rem)' }}
            >
              {formatNumber(hero.value, hero.value >= 1000)}
            </p>
          </div>
        )}

        {/* ── SCORECARDS — 4 narrative buckets ── */}
        {scorecards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-luxury-cream mb-10">
            {scorecards.map(sc => (
              <div key={sc.id} className="bg-white p-7">
                <div className="mb-1">
                  <p className="section-label text-luxury-taupe">{sc.title}</p>
                </div>
                <p className="text-luxury-taupe/70 text-xs mb-4">{sc.blurb}</p>
                <p className="font-serif-display text-5xl font-light mb-1">
                  {formatNumber(sc.composite, sc.composite >= 1000)}
                </p>
                <p className="section-label text-luxury-taupe mb-5">{sc.compositeLabel}</p>

                {/* Sub-metrics */}
                {sc.subMetrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-luxury-cream pt-4 mb-4">
                    {sc.subMetrics.map(sm => (
                      <div key={sm.key} className="flex items-baseline justify-between gap-2">
                        <span className="section-label text-luxury-taupe leading-tight" style={{ fontSize: '0.6rem' }}>
                          {sm.label}
                        </span>
                        <span className="font-serif-display text-lg font-light flex-shrink-0">
                          {formatNumber(sm.value, sm.value >= 1000)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

        {/* ── CHARTS ── */}
        {chartData.length > 1 && (
          <div>
<div className="mt-6">
              <p className="section-label text-luxury-taupe mb-4">Platform Views — Cumulative Since Listing</p>
              <div className="bg-white border border-luxury-cream p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={(() => {
                      let cumCompass = 0, cumSE = 0
                      return metricsHistory.map(s => {
                        cumCompass += s.metrics.compassViews
                        cumSE      += s.metrics.streetEasyViews
                        return { week: s.weekLabel, Compass: cumCompass, StreetEasy: cumSE }
                      })
                    })()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="compassGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#C4A882" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#C4A882" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="seGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1E1F19" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#1E1F19" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8B7D6B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8B7D6B' }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v, true)} />
                    <Tooltip contentStyle={{ fontFamily: 'var(--font-inter)', fontSize: 11 }} formatter={(v: number) => [formatNumber(v), '']} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#8B7D6B', letterSpacing: '0.06em' }} />
                    <Area type="monotone" dataKey="Compass"    stroke="#C4A882" strokeWidth={2.5} fill="url(#compassGrad)" dot={{ fill: '#C4A882', r: 4 }} />
                    <Area type="monotone" dataKey="StreetEasy" stroke="#1E1F19" strokeWidth={2}   fill="url(#seGrad)"      dot={{ fill: '#1E1F19', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
