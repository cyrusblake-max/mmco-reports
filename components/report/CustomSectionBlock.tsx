'use client'
import { CustomSection } from '@/lib/types'
import SectionMast from './SectionMast'

interface Props { section: CustomSection; sectionNum: string }

/**
 * Renders a user-added free-form section. Body text is split on blank lines
 * into paragraphs; lines starting with `- ` or `• ` become a bulleted list
 * for the surrounding paragraph block. Empty bodies still render the mast.
 */
export default function CustomSectionBlock({ section, sectionNum }: Props) {
  const eyebrow = section.eyebrow?.trim()
    ? `${sectionNum} — ${section.eyebrow.toUpperCase()}`
    : `${sectionNum} — CUSTOM SECTION`

  // Split on blank lines so each chunk becomes its own paragraph block
  const blocks = (section.body || '')
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean)

  return (
    <section className="report-section bg-white print-page-break">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <SectionMast
          num={sectionNum}
          eyebrow={eyebrow}
          title={section.title || 'Custom Section'}
        />

        {blocks.length === 0 ? (
          <p className="text-luxury-taupe italic">No content yet.</p>
        ) : (
          <div className="max-w-3xl space-y-6">
            {blocks.map((block, i) => {
              const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
              const allBullets = lines.length > 0 && lines.every(l => /^[-•*]\s+/.test(l))

              if (allBullets) {
                return (
                  <ul key={i} className="space-y-2 list-none pl-0">
                    {lines.map((l, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-luxury-black/80">
                        <span className="text-luxury-gold mt-1.5 leading-none">·</span>
                        <span>{l.replace(/^[-•*]\s+/, '')}</span>
                      </li>
                    ))}
                  </ul>
                )
              }

              return (
                <p key={i} className="text-sm leading-relaxed text-luxury-black/80">
                  {block}
                </p>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
