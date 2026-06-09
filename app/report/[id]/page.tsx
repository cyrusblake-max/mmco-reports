'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeeklyReport } from '@/lib/types'
import { getReport, duplicateReport } from '@/lib/store'
import ReportShell from '@/components/report/ReportShell'

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')

  useEffect(() => {
    let cancelled = false
    getReport(id).then(r => {
      if (cancelled) return
      if (!r) { setState('missing'); return }
      setReport(r)
      setState('ready')
    }).catch(() => { if (!cancelled) setState('missing') })
    return () => { cancelled = true }
  }, [id])

  async function handleDuplicate() {
    const r = await duplicateReport(id)
    if (r) router.push(`/dashboard/edit/${r.id}`)
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
        <div className="text-center">
          <div className="w-12 h-px bg-luxury-gold mx-auto mb-5 animate-pulse" />
          <p className="section-label text-luxury-gold">Loading report</p>
        </div>
      </div>
    )
  }

  if (state === 'missing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--ink)' }}>
        <div className="text-center max-w-md">
          <p className="section-label text-luxury-gold mb-6">Report unavailable</p>
          <h1
            className="font-serif-display text-white font-light leading-none mb-6"
            style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}
          >
            This report isn&rsquo;t<br />on this device
          </h1>
          <p className="text-white/55 text-sm leading-relaxed mb-8">
            Reports are private and stored per-browser until we move them to a shared database.
            If you&rsquo;re a team member, open this link on the laptop where the report was created — or ask the agent who sent it for a fresh share link.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <ReportShell report={report!} onDuplicate={handleDuplicate} />
}
