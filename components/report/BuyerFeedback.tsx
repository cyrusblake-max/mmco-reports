'use client'
import { WeeklyReport, FeedbackItem } from '@/lib/types'
import { Quote, ThumbsUp, ThumbsDown, Minus, User, Briefcase } from 'lucide-react'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport }

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const sentimentConfig = {
    positive: { border: 'border-l-success',  icon: ThumbsUp,   color: 'text-success' },
    negative: { border: 'border-l-danger',   icon: ThumbsDown, color: 'text-danger' },
    neutral:  { border: 'border-l-luxury-taupe', icon: Minus,  color: 'text-luxury-taupe' },
  }[item.sentiment]

  const SourceIcon = item.source === 'buyer' ? User : Briefcase

  return (
    <div className={`bg-white p-6 border-l-4 ${sentimentConfig.border} luxury-border`}>
      <div className="flex items-start justify-between mb-3">
        <Quote className="w-5 h-5 text-luxury-cream flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <SourceIcon className="w-3.5 h-3.5 text-luxury-taupe" strokeWidth={1.5} />
          <span className="section-label text-luxury-taupe capitalize">{item.source}</span>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-luxury-dark font-light italic">&ldquo;{item.comment}&rdquo;</p>
    </div>
  )
}

function InsightBlock({ label, content, accent = false }: { label: string; content: string; accent?: boolean }) {
  if (!content) return null
  return (
    <div className={`p-6 ${accent ? 'bg-luxury-black text-white' : 'bg-white border border-luxury-cream'}`}>
      <p className={`section-label mb-3 ${accent ? 'text-luxury-gold' : 'text-luxury-taupe'}`}>{label}</p>
      <p className={`text-sm leading-relaxed ${accent ? 'text-white/70' : 'text-luxury-taupe'}`}>{content}</p>
    </div>
  )
}

export default function BuyerFeedback({ report }: Props) {
  const { feedback } = report
  if (!feedback) return null

  const positive = feedback.items?.filter(f => f.sentiment === 'positive') ?? []
  const negative = feedback.items?.filter(f => f.sentiment === 'negative') ?? []
  const neutral  = feedback.items?.filter(f => f.sentiment === 'neutral')  ?? []

  return (
    <section className="report-section bg-luxury-beige print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num="06"
          eyebrow="06 — Buyer & Broker Feedback"
          title="What the Market Is Saying"
          kicker="A curated synthesis of buyer and broker reactions gathered through open houses, private showings, and outreach."
        />
        <p className="text-luxury-taupe font-light mb-12 max-w-2xl hidden">
          .
        </p>

        {/* Sentiment summary */}
        {feedback.items && feedback.items.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-luxury-cream mb-12">
            {[
              { label: 'Positive', count: positive.length, color: 'text-success',      bg: 'bg-white' },
              { label: 'Concerns', count: negative.length, color: 'text-danger',       bg: 'bg-white' },
              { label: 'Neutral',  count: neutral.length,  color: 'text-luxury-taupe', bg: 'bg-white' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className={`${bg} p-6 text-center`}>
                <p className={`font-serif-display text-4xl font-light ${color}`}>{count}</p>
                <p className="section-label text-luxury-taupe mt-2">{label} Comments</p>
              </div>
            ))}
          </div>
        )}

        {/* Quote cards */}
        {feedback.items && feedback.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {feedback.items.map(item => (
              <FeedbackCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Insight blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <InsightBlock label="Common Objections"   content={feedback.commonObjections} />
          <InsightBlock label="Pricing Feedback"    content={feedback.pricingFeedback} />
          <InsightBlock label="Layout Feedback"     content={feedback.layoutFeedback} />
          <InsightBlock label="Broker Sentiment"    content={feedback.brokerSentiment} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InsightBlock label="Competing Properties Mentioned" content={feedback.competingProperties} />
          <InsightBlock label="Recommended Adjustments" content={feedback.recommendedAdjustments} accent />
        </div>
      </div>
    </section>
  )
}
