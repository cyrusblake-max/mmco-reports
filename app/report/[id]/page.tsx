'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { WeeklyReport } from '@/lib/types'
import { getReport, duplicateReport } from '@/lib/store'
import ReportShell from '@/components/report/ReportShell'

export default function ReportPage() {
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

  function handleDuplicate() {
    const r = duplicateReport(id)
    if (r) router.push(`/dashboard/edit/${r.id}`)
  }

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-px bg-luxury-gold mx-auto mb-4 animate-pulse" />
          <p className="section-label text-luxury-gold">Loading Report</p>
        </div>
      </div>
    )
  }

  return <ReportShell report={report} onDuplicate={handleDuplicate} />
}
