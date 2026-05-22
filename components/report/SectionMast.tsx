'use client'

/**
 * Editorial section opener — used by every report section so the document
 * reads as one continuous publication.
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  03                                                       │
 *   │  ──                  Open House Reporting               │
 *   │  03 — REPORTING                                            │
 *   │                                                            │
 *   │              ╭─────────────────────╮                       │
 *   │              Open House Activity                           │
 *   │              ╰─────────────────────╯                       │
 *   │              ───── (gold rule)                             │
 *   │              optional kicker line                          │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Variants:
 *   tone="light"  → cream-on-white (default)
 *   tone="dark"   → for use inside .report-section-dark
 */

interface Props {
  num:    string                 // "01"…"08"
  eyebrow: string                // "01 — PROPERTY OVERVIEW"
  title:  string                 // "Property at a Glance"
  kicker?: string                // optional one-liner under title
  tone?:  'light' | 'dark'
  align?: 'left' | 'center'
}

export default function SectionMast({
  num, eyebrow, title, kicker, tone = 'light', align = 'left',
}: Props) {
  const isDark = tone === 'dark'
  const subColor = isDark ? 'text-luxury-gold/70' : 'text-luxury-taupe'
  const titleColor = isDark ? 'text-white' : 'text-luxury-black'

  return (
    <header className={`section-mast mb-16 md:mb-20 ${align === 'center' ? 'text-center' : ''}`}>
      <div className={`relative ${align === 'center' ? '' : 'pl-0 md:pl-2'}`}>
        {/* Background numeral — outlined, massive */}
        <span
          aria-hidden
          className={`numeral-outline pointer-events-none select-none absolute -top-6 ${
            align === 'center' ? 'left-1/2 -translate-x-1/2' : '-left-2 md:-left-6'
          }`}
          style={{ fontSize: 'clamp(7rem, 14vw, 12rem)', opacity: 0.55 }}
        >
          {num}
        </span>

        <div className={`relative ${align === 'center' ? '' : 'pl-0 md:pl-4'}`} style={{ paddingTop: 'clamp(2.5rem, 7vw, 5rem)' }}>
          <p className={`section-label-lg ${subColor} mb-5`}>{eyebrow}</p>
          <h2
            className={`font-serif-display font-light leading-[0.95] ${titleColor}`}
            style={{ fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)', letterSpacing: '-0.018em' }}
          >
            {title}
          </h2>

          <div className={`mt-6 mb-5 ${align === 'center' ? 'mx-auto' : ''}`}>
            <div className="rule-gold" style={{ width: align === 'center' ? '4rem' : '3.5rem' }} />
          </div>

          {kicker && (
            <p
              className={`max-w-xl ${align === 'center' ? 'mx-auto' : ''} ${isDark ? 'text-white/60' : 'text-luxury-taupe'}`}
              style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(1.05rem, 1.6vw, 1.3rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.45 }}
            >
              {kicker}
            </p>
          )}
        </div>
      </div>
    </header>
  )
}
