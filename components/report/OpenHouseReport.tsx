'use client'
import { Users, Briefcase, TrendingUp } from 'lucide-react'
import { WeeklyReport, OpenHouseEvent } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import SectionMast from './SectionMast'

interface Props { report: WeeklyReport; sectionNum?: string }

function EventCard({ event }: { event: OpenHouseEvent }) {
  const isBrokerEvent = event.brokers > 0 && event.buyers === 0
  const tiles = isBrokerEvent
    ? [{ icon: Users, label: 'Total Attendees', value: event.totalAttendees, accent: true }]
    : [
        { icon: Users,     label: 'Total',         value: event.totalAttendees, accent: true },
        { icon: Users,     label: 'Represented',   value: event.buyers,         accent: false },
        { icon: Briefcase, label: 'Unrepresented', value: event.brokers,        accent: false },
      ]
  return (
    <div className="card-luxury p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="section-label text-luxury-taupe mb-1">
            {isBrokerEvent ? 'Broker Open House' : 'Open House'}
          </p>
          <p className="font-serif-display text-2xl font-light">
            {formatDate(event.date, 'short')}
          </p>
          <p className="text-luxury-taupe text-sm mt-1">
            {event.startTime} – {event.endTime}
          </p>
        </div>
      </div>

      {/* Attendee breakdown — single tile for broker events, 3-up for public open houses */}
      <div className={`grid ${isBrokerEvent ? 'grid-cols-1' : 'grid-cols-3'} gap-px bg-luxury-cream mb-6`}>
        {tiles.map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className={`p-4 text-center ${accent ? 'bg-luxury-black' : 'bg-white'}`}>
            <Icon className={`w-4 h-4 mx-auto mb-1.5 ${accent ? 'text-luxury-gold' : 'text-luxury-taupe'}`} strokeWidth={1.5} />
            <p className={`font-serif-display text-3xl font-light ${accent ? 'text-white' : ''}`}>{value}</p>
            <p className={`section-label mt-1 ${accent ? 'text-luxury-gold' : 'text-luxury-taupe'}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      <div className="space-y-4">
        {event.commonFeedback && (
          <div>
            <p className="section-label text-luxury-taupe mb-2">Common Feedback</p>
            <p className="text-sm text-luxury-taupe leading-relaxed">{event.commonFeedback}</p>
          </div>
        )}
        {event.questionsAsked && (
          <div>
            <p className="section-label text-luxury-taupe mb-2">Questions Asked</p>
            <p className="text-sm text-luxury-taupe leading-relaxed">{event.questionsAsked}</p>
          </div>
        )}
        {event.followUpActions && (
          <div className="border-l-2 border-luxury-gold pl-4">
            <p className="section-label text-luxury-gold mb-2">Follow-Up Actions</p>
            <p className="text-sm leading-relaxed">{event.followUpActions}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OpenHouseReport({ report, sectionNum = '03' }: Props) {
  const { openHouses, currentMetrics, weekStartDate, weekEndDate } = report
  const showings = currentMetrics?.showingRequests ?? 0
  // Render whenever we have either an open-house event or private showings this week
  if ((!openHouses || openHouses.length === 0) && showings === 0) return null

  // Filter to events that occurred during THIS reporting week.
  // Falls back to the latest event if the week range is misconfigured.
  const weekEvents = openHouses && weekStartDate && weekEndDate
    ? openHouses.filter(oh => oh.date >= weekStartDate && oh.date <= weekEndDate)
    : []
  const eventsToShow = weekEvents.length > 0
    ? weekEvents
    : openHouses && openHouses.length > 0 ? [openHouses[openHouses.length - 1]] : []

  const weekTotalAttendees = eventsToShow.reduce((s, oh) => s + oh.totalAttendees, 0)
  const weekAvgAttendance  = eventsToShow.length > 0 ? Math.round(weekTotalAttendees / eventsToShow.length) : 0
  const peak = eventsToShow.length > 0
    ? eventsToShow.reduce((best, oh) => oh.totalAttendees > best.totalAttendees ? oh : best, eventsToShow[0])
    : null

  return (
    <section className="report-section bg-white print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num={sectionNum}
          eyebrow={`${sectionNum} — Open House Reporting`}
          title="In-Person Engagement"
          kicker="A summary of the week's open houses, broker previews, and the quality of buyer interest observed at each."
        />

        {/* This week's totals */}
        <div className="grid grid-cols-2 gap-px bg-luxury-cream mb-12">
          <div className="bg-luxury-black p-6">
            <p className="section-label text-luxury-gold mb-2">Open House Attendees</p>
            <p className="font-serif-display text-4xl font-light text-white">{weekTotalAttendees}</p>
            <p className="section-label text-white/40 mt-1">This Week</p>
          </div>
          <div className="bg-luxury-off p-6">
            <p className="section-label text-luxury-taupe mb-2">Private Showings</p>
            <p className="font-serif-display text-4xl font-light">{showings}</p>
            <p className="section-label text-luxury-taupe mt-1">This Week</p>
          </div>
        </div>

        {/* ── Peak event callout — only if we had real attendance ── */}
        {peak && eventsToShow.length > 1 && peak.totalAttendees > 0 && (
          <div className="flex items-center gap-3 mb-6 px-5 py-3 border-l-2 border-luxury-gold bg-luxury-off">
            <TrendingUp className="w-4 h-4 text-luxury-gold flex-shrink-0" />
            <p className="text-sm text-luxury-taupe">
              Peak attendance:{' '}
              <span className="text-luxury-black font-medium">{peak.totalAttendees} guests</span>
              {' '}on{' '}
              <span className="text-luxury-black font-medium">{formatDate(peak.date, 'short')}</span>
              {weekAvgAttendance > 0 && <> — {Math.round(((peak.totalAttendees - weekAvgAttendance) / Math.max(weekAvgAttendance, 1)) * 100)}% above week average.</>}
            </p>
          </div>
        )}

        {/* Individual event cards — every open house from this week */}
        <div className="space-y-6">
          {eventsToShow.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
