'use client'
import { WeeklyReport, MarketingActivity, MARKETING_LABELS } from '@/lib/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { ExternalLink, Instagram, Mail, Radio, Globe, Printer, Video, Megaphone } from 'lucide-react'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

const typeIcons: Record<string, React.ElementType> = {
  instagram_post:      Instagram,
  instagram_reel:      Video,
  tiktok:              Video,
  email_campaign:      Mail,
  broker_outreach:     Radio,
  private_exclusive:   Radio,
  facebook_ad:         Globe,
  zillow_boost:        Globe,
  print:               Printer,
  open_house_campaign: Megaphone,
  video_campaign:      Video,
  other:               Globe,
}

function ActivityRow({ activity }: { activity: MarketingActivity }) {
  const Icon = typeIcons[activity.type] ?? Globe
  const hasStats = !!(activity.impressions || activity.reach || activity.clicks || activity.engagement)

  return (
    <div className="border-b border-white/10 py-6 last:border-0">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-luxury-gold" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-medium text-sm">{activity.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="section-label text-luxury-gold">{MARKETING_LABELS[activity.type]}</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/40 text-xs">{formatDate(activity.date, 'short')}</span>
              </div>
            </div>
            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-luxury-gold/60 hover:text-luxury-gold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {hasStats && (
            <div className="flex flex-wrap gap-6 mt-4">
              {!!activity.impressions && (
                <div>
                  <p className="section-label text-white/30" style={{ fontSize: '0.58rem' }}>Impressions</p>
                  <p className="text-white text-sm font-light font-serif-display">{formatNumber(activity.impressions, true)}</p>
                </div>
              )}
              {!!activity.reach && (
                <div>
                  <p className="section-label text-white/30" style={{ fontSize: '0.58rem' }}>Reach</p>
                  <p className="text-white text-sm font-light font-serif-display">{formatNumber(activity.reach, true)}</p>
                </div>
              )}
              {!!activity.engagement && (
                <div>
                  <p className="section-label text-white/30" style={{ fontSize: '0.58rem' }}>Engagement</p>
                  <p className="text-white text-sm font-light font-serif-display">{formatNumber(activity.engagement, true)}</p>
                </div>
              )}
              {!!activity.clicks && (
                <div>
                  <p className="section-label text-white/30" style={{ fontSize: '0.58rem' }}>Clicks</p>
                  <p className="text-white text-sm font-light font-serif-display">{formatNumber(activity.clicks, true)}</p>
                </div>
              )}
            </div>
          )}

          {activity.notes && (
            <p className="text-white/40 text-xs mt-3 leading-relaxed">{activity.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MarketingActivities({ report }: Props) {
  const { marketing } = report
  if (!marketing || marketing.length === 0) return null

  return (
    <section className="report-section-dark print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num="04"
          eyebrow="04 — Marketing Activities"
          title="Where We Showed Up"
          kicker="Owned content and curated outreach driving qualified eyes to the listing."
          tone="dark"
        />

        {/* Activity list */}
        <div>
          <p className="section-label text-luxury-gold mb-6">{marketing.length} Marketing Activities This Week</p>
          <div>
            {marketing.map(activity => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
