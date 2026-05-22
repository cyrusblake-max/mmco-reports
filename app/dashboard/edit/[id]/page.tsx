'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeeklyReport } from '@/lib/types'
import { getReport } from '@/lib/store'
import ReportForm from '@/components/dashboard/ReportForm'
import { ArrowLeft } from 'lucide-react'

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const r = getReport(id)
    if (!r) { router.push('/dashboard'); return }
    setReport(r)
    setLoading(false)
  }, [id, router])

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-luxury-off flex items-center justify-center">
        <div className="skeleton w-32 h-4 rounded" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxury-off">
      <header className="bg-luxury-black text-white px-8 py-5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <div>
            <p className="section-label text-luxury-gold">MM&amp;co · Editing Report</p>
            <p className="text-sm font-light mt-0.5 text-white/80">
              {report.property.address}{report.property.unit ? `, ${report.property.unit}` : ''} — Week {report.weekNumber}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-8 py-10">
        <ReportForm initial={report} />
      </main>
    </div>
  )
}
