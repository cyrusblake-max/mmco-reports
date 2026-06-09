import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--ink)' }}>
      <div className="text-center max-w-md">
        <p className="section-label text-luxury-gold mb-6">404 · Not Found</p>
        <h1
          className="font-serif-display text-white font-light leading-none mb-6"
          style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', letterSpacing: '-0.025em' }}
        >
          This page<br />doesn&rsquo;t exist
        </h1>
        <p className="text-white/55 text-sm leading-relaxed mb-10">
          The report or page you&rsquo;re looking for may have been moved or removed.
          Head back to the dashboard to see all available reports.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
