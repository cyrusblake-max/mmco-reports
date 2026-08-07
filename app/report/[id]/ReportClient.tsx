'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeeklyReport } from '@/lib/types'
import { getReport, duplicateReport } from '@/lib/store'
import ReportShell from '@/components/report/ReportShell'

type Gate = 'open' | 'locked' | 'expired'

/**
 * Soft access gate for shared links. Light protection for a private listing —
 * the passcode check runs client-side, so treat it as a courtesy lock, not
 * security. Non-share views (dashboard-originated, no ?share=1) bypass it so
 * the team never locks itself out.
 */
function gateFor(report: WeeklyReport): Gate {
  if (typeof window === 'undefined') return 'open'
  const isShareView = new URLSearchParams(window.location.search).get('share') === '1'
  if (!isShareView) return 'open'
  const s = report.share
  if (!s) return 'open'
  if (s.expiresAt && new Date(s.expiresAt + 'T23:59:59') < new Date()) return 'expired'
  if (s.password && sessionStorage.getItem(`report_unlock_${report.id}`) !== s.password) return 'locked'
  return 'open'
}

export default function ReportClient({ id }: { id: string }) {
  const router = useRouter()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [gate, setGate] = useState<Gate>('open')
  const [attempt, setAttempt] = useState('')
  const [wrong, setWrong] = useState(false)

  useEffect(() => {
    let cancelled = false
    getReport(id).then(r => {
      if (cancelled) return
      if (!r) { setState('missing'); return }
      setReport(r)
      setGate(gateFor(r))
      setState('ready')
    }).catch(() => { if (!cancelled) setState('missing') })
    return () => { cancelled = true }
  }, [id])

  async function handleDuplicate() {
    const r = await duplicateReport(id)
    if (r) router.push(`/dashboard/edit/${r.id}`)
  }

  function tryUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!report?.share?.password) return
    if (attempt === report.share.password) {
      sessionStorage.setItem(`report_unlock_${report.id}`, attempt)
      setGate('open')
      setWrong(false)
    } else {
      setWrong(true)
    }
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

  if (gate === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--ink)' }}>
        <div className="text-center max-w-md">
          <p className="section-label text-luxury-gold mb-6">Link expired</p>
          <h1 className="font-serif-display text-white font-light leading-none mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.02em' }}>
            This report link<br />is no longer active
          </h1>
          <p className="text-white/55 text-sm leading-relaxed">
            Please reach out to your MM&amp;Co. agent for the most recent report on your listing.
          </p>
        </div>
      </div>
    )
  }

  if (gate === 'locked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--ink)' }}>
        <div className="text-center max-w-sm w-full">
          <p className="section-label text-luxury-gold mb-6">Private report</p>
          <h1 className="font-serif-display text-white font-light leading-none mb-8" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.02em' }}>
            Enter your passcode
          </h1>
          <form onSubmit={tryUnlock} className="space-y-3">
            <input
              type="password"
              inputMode="text"
              autoFocus
              value={attempt}
              onChange={e => { setAttempt(e.target.value); setWrong(false) }}
              placeholder="Passcode from your agent"
              className="w-full bg-white/10 border border-white/25 text-white placeholder-white/35 px-4 py-3 text-sm text-center focus:outline-none focus:border-luxury-gold transition-colors"
            />
            {wrong && <p className="text-xs text-luxury-gold">That passcode doesn&rsquo;t match — please try again.</p>}
            <button
              type="submit"
              className="w-full px-5 py-3 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors"
            >
              View report
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <ReportShell report={report!} onDuplicate={handleDuplicate} />
}
