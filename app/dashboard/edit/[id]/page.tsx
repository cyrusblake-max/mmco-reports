'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeeklyReport } from '@/lib/types'
import { getReport } from '@/lib/store'
import ReportForm from '@/components/dashboard/ReportForm'
import ReportShell from '@/components/report/ReportShell'
import { ArrowLeft, Eye, EyeOff, Check, AlertCircle, Clock, ScanSearch } from 'lucide-react'

type SaveState = { savedAt: number | null; dirty: boolean }

/** Format "Saved 2m ago" / "Saved just now" / "Unsaved changes". */
function statusLabel(state: SaveState): { text: string; tone: 'saved' | 'dirty' | 'idle' } {
  if (state.dirty)               return { text: 'Unsaved changes', tone: 'dirty' }
  if (state.savedAt == null)     return { text: '',                tone: 'idle' }
  const ago = Date.now() - state.savedAt
  if (ago < 5_000)               return { text: 'Saved just now',  tone: 'saved' }
  if (ago < 60_000)              return { text: `Saved ${Math.round(ago / 1000)}s ago`,  tone: 'saved' }
  if (ago < 3_600_000)           return { text: `Saved ${Math.round(ago / 60_000)}m ago`, tone: 'saved' }
  return { text: `Saved ${Math.round(ago / 3_600_000)}h ago`, tone: 'saved' }
}

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport]   = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>({ savedAt: null, dirty: false })

  useEffect(() => {
    let cancelled = false
    getReport(id).then(r => {
      if (cancelled) return
      if (!r) { router.push('/dashboard'); return }
      setReport(r)
      setSaveState({ savedAt: Date.now(), dirty: false })
      setLoading(false)
    }).catch(() => { if (!cancelled) router.push('/dashboard') })
    return () => { cancelled = true }
  }, [id, router])

  // Tick the "Saved Xs ago" label once a minute so it stays fresh
  useEffect(() => {
    const t = setInterval(() => setSaveState(s => ({ ...s })), 60_000)
    return () => clearInterval(t)
  }, [])

  // Form bubbles up live updates → preview + dirty tracking
  const handleReportChange = useCallback((next: WeeklyReport) => {
    setReport(next)
    setSaveState(s => ({ ...s, dirty: true }))
  }, [])
  const handleSaved = useCallback(() => {
    setSaveState({ savedAt: Date.now(), dirty: false })
  }, [])

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-luxury-off flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-px bg-luxury-gold mx-auto mb-4 animate-pulse" />
          <p className="section-label text-luxury-taupe">Loading editor</p>
        </div>
      </div>
    )
  }

  const status = statusLabel(saveState)
  const StatusIcon = status.tone === 'dirty' ? AlertCircle : status.tone === 'saved' ? Check : Clock

  return (
    <div className="min-h-screen bg-luxury-off flex flex-col">
      <header className="bg-luxury-black text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-[140rem] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm flex-shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <div className="min-w-0">
              <p className="section-label text-luxury-gold" style={{ fontSize: '0.55rem' }}>MM&amp;Co · Editing</p>
              <p className="text-xs sm:text-sm font-light mt-0.5 text-white/80 truncate">
                {report.property.address || 'Untitled'}{report.property.unit ? `, ${report.property.unit}` : ''} — Week {report.weekNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save state badge */}
            {status.text && (
              <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors ${
                status.tone === 'dirty' ? 'text-luxury-gold' :
                status.tone === 'saved' ? 'text-white/55' :
                'text-white/40'
              }`}>
                <StatusIcon className="w-3 h-3" />
                {status.text}
              </span>
            )}

            {/* Screenshot import — primary phone workflow */}
            <Link
              href={`/dashboard/import/${report.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-luxury-gold/60 text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-colors"
              title="Upload analytics screenshots and review extracted metrics"
            >
              <ScanSearch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </Link>

            {/* Preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border ${
                showPreview
                  ? 'bg-luxury-gold text-luxury-black border-luxury-gold hover:bg-luxury-sand'
                  : 'text-white border-white/20 hover:bg-white/10'
              }`}
              title={showPreview ? 'Hide live preview' : 'Show live preview alongside editor'}
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{showPreview ? 'Hide preview' : 'Preview'}</span>
            </button>

            <Link
              href={`/report/${report.id}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/20 hover:bg-white/10 transition-colors"
              title="Open full report in a new tab"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye className="w-3.5 h-3.5" /> Full view
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        <div className={`max-w-[140rem] mx-auto h-full ${showPreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-0' : ''}`}>
          {/* Editor side */}
          <div className={`px-4 sm:px-6 md:px-8 py-6 sm:py-8 overflow-auto ${showPreview ? 'lg:max-h-[calc(100vh-3.5rem)] border-r border-luxury-cream/60' : 'max-w-4xl mx-auto'}`}>
            <ReportForm
              initial={report}
              onChange={handleReportChange}
              onSaved={handleSaved}
            />
          </div>

          {/* Preview side */}
          {showPreview && (
            <div className="hidden lg:block bg-luxury-off overflow-auto lg:max-h-[calc(100vh-3.5rem)]">
              <div className="origin-top-left transform scale-[0.55] xl:scale-[0.65]" style={{ width: '182%' }}>
                <ReportShell report={report} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
