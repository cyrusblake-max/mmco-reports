'use client'
import { WeeklyReport } from '@/lib/types'
import { CheckCircle2, Calendar, Megaphone, DollarSign, Users } from 'lucide-react'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

function StrategyBlock({
  icon: Icon, title, content, accent = false,
}: {
  icon: React.ElementType; title: string; content: string; accent?: boolean
}) {
  if (!content) return null
  const lines = content.split('\n').filter(l => l.trim())
  return (
    <div className={`p-6 md:p-8 ${accent ? 'bg-luxury-gold/10 border border-luxury-gold/30' : 'bg-white/5 border border-white/10'}`}>
      <div className="flex items-center gap-3 mb-5">
        <Icon className={`w-4 h-4 ${accent ? 'text-luxury-gold' : 'text-luxury-gold/60'}`} strokeWidth={1.5} />
        <p className="section-label text-luxury-gold">{title}</p>
      </div>
      <div className="space-y-2.5">
        {lines.map((line, i) => {
          const cleaned = line.replace(/^[\d\.\-—\*]+\s*/, '').trim()
          return (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-luxury-gold/50 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-white/70 text-sm leading-relaxed">{cleaned}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AgentStrategy({ report }: Props) {
  const { strategy, property } = report
  if (!strategy) return null

  return (
    <section className="report-section-dark print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num="06"
          eyebrow="06 — Strategy & Next Steps"
          title="Our Plan Forward"
          kicker="Recommendations, upcoming initiatives, and a calibrated schedule for the week ahead."
          tone="dark"
        />

        {/* Key recommendations - spans full width */}
        <div className="mb-6">
          <StrategyBlock
            icon={CheckCircle2}
            title="Key Recommendations"
            content={strategy.keyRecommendations}
            accent
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StrategyBlock icon={Megaphone}    title="Marketing Plan — Next Week"  content={strategy.marketingPlanNextWeek} />
          <StrategyBlock icon={DollarSign}   title="Pricing Strategy"            content={strategy.pricingStrategy} />
          <StrategyBlock icon={Calendar}     title="Upcoming Campaigns"          content={strategy.upcomingCampaigns} />
          <StrategyBlock icon={Users}        title="Broker Events"               content={strategy.brokerEvents} />
        </div>

        <StrategyBlock icon={Calendar} title="Open Houses Planned" content={strategy.openHousesPlanned} />

        {/* Closing signature — In Good Co. partner mark */}
        <div className="mt-16 pt-12 border-t border-white/10 flex items-center justify-between gap-6">
          <p className="section-label text-white/35">In Partnership With</p>
          <div className="flex items-center gap-4">
            {/* Drop /public/ingoodco-logo.png to swap in a real logo file */}
            <img
              src="/ingoodco-logo.png"
              alt="In Good Co."
              className="h-10 md:h-12 object-contain brightness-0 invert"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <p
              className="font-serif-display text-white font-light italic leading-none"
              style={{ fontSize: 'clamp(1.5rem, 2.2vw, 2rem)', letterSpacing: '0.01em' }}
            >
              In Good Co.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
