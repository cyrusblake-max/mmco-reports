'use client'
/**
 * /dashboard/import/[id] — mobile-first screenshot import for one report.
 * Upload analytics screenshots, review the AI-extracted metrics, approve,
 * and the numbers land in the report's Weekly Metrics with full provenance.
 */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { WeeklyReport } from '@/lib/types'
import { getReport, saveReport } from '@/lib/store'
import ScreenshotImport from '@/components/dashboard/ScreenshotImport'

export default function ImportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getReport(id).then(r => {
      if (cancelled) return
      if (!r) { router.push('/dashboard'); return }
      setReport(r)
      setLoading(false)
    }).catch(() => { if (!cancelled) router.push('/dashboard') })
    return () => { cancelled = true }
  }, [id, router])

  async function handleApply(updated: WeeklyReport) {
    setSaving(true)
    setError('')
    try {
      await saveReport(updated)
      router.push(`/dashboard/edit/${updated.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the report')
      setSaving(false)
    }
  }

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-luxury-off flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-px bg-luxury-gold mx-auto mb-4 animate-pulse" />
          <p className="section-label text-luxury-taupe">Loading</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxury-off">
      <header className="bg-luxury-black text-white px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={`/dashboard/edit/${report.id}`} className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to editor</span>
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <div className="min-w-0 flex-1">
            <p className="section-label text-luxury-gold" style={{ fontSize: '0.55rem' }}>MM&amp;Co · Screenshot Import</p>
            <p className="text-xs sm:text-sm font-light mt-0.5 text-white/80 truncate">
              {report.property.address || 'Untitled'}{report.property.unit ? `, ${report.property.unit}` : ''} — Week {report.weekNumber}
            </p>
          </div>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-luxury-gold flex-shrink-0" />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && <p className="text-xs text-danger mb-4">{error}</p>}
        <ScreenshotImport report={report} onApply={handleApply} />
      </main>
    </div>
  )
}
