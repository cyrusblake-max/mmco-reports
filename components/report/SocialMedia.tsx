'use client'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { Heart, Share2, Eye } from 'lucide-react'
import { WeeklyReport, SocialPlatformStats } from '@/lib/types'
import { formatNumber } from '@/lib/utils'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

const PLATFORM_COLORS = {
  instagram: '#C4A882',
  tiktok:    '#0A0A0A',
  facebook:  '#8B7D6B',
}

const PLATFORM_LABELS = {
  instagram: 'Instagram',
  tiktok:    'TikTok',
  facebook:  'Facebook',
}

function PlatformCard({ stats }: { stats: SocialPlatformStats }) {
  const color  = PLATFORM_COLORS[stats.platform]
  const label  = PLATFORM_LABELS[stats.platform]

  const metrics = [
    { icon: Eye,    label: 'Views',  raw: stats.reelViews, value: formatNumber(stats.reelViews, true) },
    { icon: Heart,  label: 'Likes',  raw: stats.likes,     value: formatNumber(stats.likes, true) },
    { icon: Share2, label: 'Shares', raw: stats.shares,    value: formatNumber(stats.shares) },
  ].filter(m => m.raw > 0)

  return (
    <div className="card-luxury overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid #E8E2D9' }}>
        <div>
          <p className="section-label text-luxury-taupe">{label}</p>
          {stats.engagementRate > 0 && (
            <p className="font-serif-display text-3xl font-light mt-1">
              {stats.engagementRate.toFixed(1)}% Engagement
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: color + '20' }}>
          <span className="text-xs font-bold" style={{ color }}>{label[0]}</span>
        </div>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-3 gap-px bg-luxury-cream">
        {metrics.map(({ icon: Icon, label: mLabel, value }) => (
          <div key={mLabel} className="bg-white p-4 text-center">
            <Icon className="w-4 h-4 mx-auto mb-2 text-luxury-taupe" strokeWidth={1.5} />
            <p className="font-serif-display text-xl font-light">{value}</p>
            <p className="section-label text-luxury-taupe mt-1" style={{ fontSize: '0.58rem' }}>{mLabel}</p>
          </div>
        ))}
      </div>

      {/* Best content */}
      {stats.bestContentDescription && (
        <div className="px-6 py-4 bg-luxury-off border-t border-luxury-cream">
          <p className="section-label text-luxury-gold mb-1">Best Performing Content</p>
          <p className="text-sm text-luxury-taupe leading-relaxed">{stats.bestContentDescription}</p>
          {stats.bestContentViews && (
            <p className="font-serif-display text-2xl font-light mt-2">
              {formatNumber(stats.bestContentViews, true)} <span className="text-base text-luxury-taupe font-sans font-normal">views</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function SocialMedia({ report }: Props) {
  const { socialMedia } = report
  if (!socialMedia || socialMedia.length === 0) return null

  const totalReelViews  = socialMedia.reduce((s, p) => s + p.reelViews, 0)
  const totalLikes      = socialMedia.reduce((s, p) => s + p.likes, 0)
  const totalShares     = socialMedia.reduce((s, p) => s + p.shares, 0)
  const totalEngagement = totalReelViews + totalLikes + totalShares

  const barData = socialMedia.map(p => ({
    platform: PLATFORM_LABELS[p.platform],
    Views:    p.reelViews,
    Likes:    p.likes,
    Saves:    p.saves,
  }))

  const radarData = socialMedia.length > 0 ? [
    { metric: 'Views',    value: Math.min(100, Math.round(socialMedia[0].reelViews / 10)) },
    { metric: 'Likes',    value: Math.min(100, Math.round(socialMedia[0].likes / 10)) },
    { metric: 'Comments', value: Math.min(100, socialMedia[0].comments * 3) },
    { metric: 'Shares',   value: Math.min(100, socialMedia[0].shares / 5) },
    { metric: 'Saves',    value: Math.min(100, socialMedia[0].saves / 12) },
  ] : []

  return (
    <section className="report-section bg-luxury-off print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num="05"
          eyebrow="05 — Social Performance"
          title="Audience Across Channels"
          kicker="Reach, resonance, and engagement on Instagram and TikTok over the reporting week."
        />

        {/* Platform cards */}
        <div className={`grid gap-6 mb-12 ${socialMedia.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {socialMedia.map(stats => (
            <PlatformCard key={stats.platform} stats={stats} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {barData.length > 1 && (
            <div className="bg-white border border-luxury-cream p-6">
              <p className="section-label text-luxury-taupe mb-4">Platform Comparison</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#8B7D6B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8B7D6B' }} axisLine={false} tickLine={false} tickFormatter={v => formatNumber(v, true)} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-inter)', fontSize: 11 }} formatter={(v: number) => [formatNumber(v), '']} />
                  <Bar dataKey="Views" fill="#C4A882" radius={[2, 2, 0, 0]} barSize={20} />
                  <Bar dataKey="Likes" fill="#0A0A0A" radius={[2, 2, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
