'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { WeeklyReport } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

const CHANNEL_COLORS: Record<string, string> = {
  Instagram: '#C4A882',
  Facebook:  '#8B7D6B',
  Google:    '#1A211B',
  YouTube:   '#B8AC97',
  TikTok:    '#2A2B23',
}

export default function DigitalAds({ report }: Props) {
  const { digitalAds } = report
  if (!digitalAds) return null

  const {
    reportingPeriod, totalImpressions, totalClicks, topChannel, byChannel,
    socialTrafficPeriod, socialTrafficShare,
    campaignName, targetingFocus, topPublishers, audienceHouseholdIncome,
  } = digitalAds
  const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  return (
    <section className="report-section bg-luxury-off print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num="05"
          eyebrow="05 — Digital Ads & Reach"
          title="Paid Performance"
          kicker={`Compass-managed ad campaigns and where social traffic is coming from. Reporting period: ${reportingPeriod}.`}
        />

        {/* Campaign name + targeting focus banner */}
        {(campaignName || targetingFocus) && (
          <div className="bg-luxury-black text-white p-5 mb-px">
            {campaignName && (
              <p className="section-label text-luxury-gold mb-1.5">Campaign · {campaignName}</p>
            )}
            {targetingFocus && (
              <p className="text-white/75 text-sm leading-relaxed">
                <span className="section-label text-white/40 mr-2">Targeting</span>{targetingFocus}
              </p>
            )}
          </div>
        )}

        {/* Headline stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-luxury-cream mb-12">
          <div className="bg-white p-6">
            <p className="section-label text-luxury-taupe mb-2">Total Impressions</p>
            <p className="font-serif-display text-4xl font-light">{formatNumber(totalImpressions, true)}</p>
            <p className="text-luxury-taupe text-xs mt-2">{reportingPeriod}</p>
          </div>
          <div className="bg-white p-6">
            <p className="section-label text-luxury-taupe mb-2">Total Ad Clicks</p>
            <p className="font-serif-display text-4xl font-light">{formatNumber(totalClicks, true)}</p>
            <p className="text-luxury-taupe text-xs mt-2">{overallCTR.toFixed(2)}% overall CTR</p>
          </div>
          {topChannel && (
            <div className="bg-luxury-black p-6">
              <p className="section-label text-luxury-gold mb-2">Top {topPublishers ? 'Publisher' : 'Channel'}</p>
              <p className="font-serif-display text-4xl font-light text-white">{topChannel.name}</p>
              <p className="text-luxury-gold text-xs mt-2">{topChannel.ctr.toFixed(2)}% CTR · highest engagement</p>
            </div>
          )}
        </div>

        {/* Top Publishers — for display / location-based campaigns */}
        {topPublishers && topPublishers.length > 0 && (
          <div className="bg-white border border-luxury-cream p-6 mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <p className="section-label text-luxury-taupe">Where Your Ads Appeared</p>
              <p className="text-xs text-luxury-taupe">Top {topPublishers.length} publishers · ad views</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              {topPublishers.map((p, i) => (
                <div key={p.publisher} className="flex items-baseline justify-between border-b border-luxury-cream/60 py-2">
                  <span className="flex items-baseline gap-3">
                    <span className="section-label text-luxury-gold w-5" style={{ fontSize: '0.58rem' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm text-luxury-black">{p.publisher}</span>
                  </span>
                  <span className="font-serif-display text-lg font-light">{formatNumber(p.views)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audience — Household Income */}
        {audienceHouseholdIncome && audienceHouseholdIncome.length > 0 && (
          <div className="bg-white border border-luxury-cream p-6 mb-12">
            <p className="section-label text-luxury-taupe mb-4">Audience · Household Income</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-luxury-cream">
              {audienceHouseholdIncome.map(a => (
                <div key={a.bracket} className="bg-white p-5 text-center">
                  <p className="font-serif-display text-3xl font-light">{a.share.toFixed(1)}%</p>
                  <p className="section-label text-luxury-taupe mt-1">{a.bracket}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-luxury-taupe mt-3 italic">Top 10% bracket dominates — the campaign is reaching the intended luxury-buyer profile.</p>
          </div>
        )}

        {/* Channel performance */}
        {byChannel.length > 0 && (
          <div className="bg-white border border-luxury-cream p-6 mb-12">
            <p className="section-label text-luxury-taupe mb-4">Ad Clicks by Channel</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byChannel} margin={{ top: 20, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
                <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#8B7D6B', letterSpacing: '0.06em' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8B7D6B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontFamily: 'var(--font-inter)', fontSize: 11, border: '1px solid #E8E2D9', borderRadius: 0 }}
                  formatter={(v: number, name: string) => name === 'ctr' ? [`${v}%`, 'CTR'] : [formatNumber(v), 'Clicks']}
                />
                <Bar dataKey="clicks" radius={[2, 2, 0, 0]} barSize={48}>
                  {byChannel.map(c => (
                    <Cell key={c.channel} fill={CHANNEL_COLORS[c.channel] ?? '#8B7D6B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-px bg-luxury-cream mt-4">
              {byChannel.map(c => (
                <div key={c.channel} className="bg-white p-3 text-center">
                  <p className="section-label text-luxury-taupe">{c.channel}</p>
                  <p className="font-serif-display text-xl font-light mt-1">{formatNumber(c.clicks)} <span className="text-xs text-luxury-taupe">clicks</span></p>
                  <p className="text-xs text-luxury-gold mt-1">{c.ctr.toFixed(2)}% CTR</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social traffic share */}
        {socialTrafficShare.length > 0 && (
          <div className="bg-white border border-luxury-cream p-6">
            <div className="flex items-baseline justify-between mb-4">
              <p className="section-label text-luxury-taupe">Social Traffic Share</p>
              <p className="text-xs text-luxury-taupe">{socialTrafficPeriod}</p>
            </div>
            <div className="flex items-center gap-8 flex-col md:flex-row">
              <div style={{ width: 220, height: 220 }} className="flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={socialTrafficShare}
                      dataKey="share"
                      nameKey="channel"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={1}
                      stroke="none"
                    >
                      {socialTrafficShare.map(s => (
                        <Cell key={s.channel} fill={CHANNEL_COLORS[s.channel] ?? '#8B7D6B'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {socialTrafficShare.map(s => (
                  <div key={s.channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 inline-block" style={{ background: CHANNEL_COLORS[s.channel] ?? '#8B7D6B' }} />
                      <span className="section-label text-luxury-taupe">{s.channel}</span>
                    </div>
                    <span className="font-serif-display text-2xl font-light">{s.share.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
