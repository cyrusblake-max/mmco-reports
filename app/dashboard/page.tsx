'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeeklyReport } from '@/lib/types'
import { getReports, deleteReport, duplicateReport, createBlankReport } from '@/lib/store'
import { formatCurrency, formatDate, daysOnMarket } from '@/lib/utils'
import { Plus, Eye, Edit2, Copy, Trash2, FileText } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<WeeklyReport[]>([])

  useEffect(() => {
    setReports(getReports())
  }, [])

  function handleNew() {
    const r = createBlankReport()
    router.push(`/dashboard/edit/${r.id}`)
  }

  function handleDuplicate(id: string) {
    const r = duplicateReport(id)
    if (r) {
      setReports(getReports())
      router.push(`/dashboard/edit/${r.id}`)
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this report? This cannot be undone.')) return
    deleteReport(id)
    setReports(getReports())
  }

  return (
    <div className="min-h-screen bg-luxury-off">
      {/* Top header */}
      <header className="bg-luxury-black text-white px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="section-label text-luxury-gold mb-1">MM<span style={{letterSpacing:'-0.02em'}}>&</span>co · Compass</p>
              <h1 className="font-serif-display text-3xl font-light">Seller Report System</h1>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {reports.length === 0 ? (
          <div className="text-center py-24">
            <FileText className="w-12 h-12 text-luxury-cream mx-auto mb-4" />
            <p className="font-serif-display text-2xl font-light text-luxury-taupe mb-2">No reports yet</p>
            <p className="text-luxury-taupe text-sm mb-6">Create your first weekly seller report to get started.</p>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-luxury-black text-white text-sm hover:bg-luxury-dark transition-colors"
            >
              <Plus className="w-4 h-4" /> Create First Report
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="section-label text-luxury-taupe">{reports.length} Report{reports.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="space-y-3">
              {reports.map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onView={() => router.push(`/report/${report.id}`)}
                  onEdit={() => router.push(`/dashboard/edit/${report.id}`)}
                  onDuplicate={() => handleDuplicate(report.id)}
                  onDelete={() => handleDelete(report.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function ReportCard({
  report, onView, onEdit, onDuplicate, onDelete,
}: {
  report: WeeklyReport
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const dom = daysOnMarket(report.property.listingDate)

  return (
    <div className="bg-white border border-luxury-cream hover:border-luxury-sand transition-colors">
      <div className="flex items-center gap-6 p-5">
        {/* Thumbnail */}
        <div className="w-20 h-16 flex-shrink-0 overflow-hidden bg-luxury-beige">
          {report.property.mainImageUrl ? (
            <img src={report.property.mainImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-luxury-cream" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 flex-wrap">
            <div>
              <p className="font-medium text-sm truncate">
                {report.property.address}{report.property.unit ? `, ${report.property.unit}` : ''}
              </p>
              <p className="text-luxury-taupe text-xs mt-0.5">
                {report.property.neighborhood} · {formatCurrency(report.property.price)}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="section-label text-luxury-gold border border-luxury-gold/30 px-2 py-0.5">
                Week {report.weekNumber}
              </span>
              <span className="text-luxury-taupe text-xs">{formatDate(report.reportDate, 'short')}</span>
              <span className="text-luxury-taupe text-xs">{dom} DOM</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-3 flex-wrap">
            {[
              { label: 'Views',     value: report.currentMetrics.totalViews.toLocaleString() },
              { label: 'Inquiries', value: report.currentMetrics.inquiries },
              { label: 'Shows',     value: report.currentMetrics.showingRequests },
              { label: 'Leads',     value: report.currentMetrics.buyerLeads },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>{label}</p>
                <p className="font-serif-display text-xl font-light">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onView}      title="View Report"      className="p-2 text-luxury-taupe hover:text-luxury-black transition-colors"><Eye     className="w-4 h-4" /></button>
          <button onClick={onEdit}      title="Edit Report"      className="p-2 text-luxury-taupe hover:text-luxury-black transition-colors"><Edit2   className="w-4 h-4" /></button>
          <button onClick={onDuplicate} title="Duplicate Report" className="p-2 text-luxury-taupe hover:text-luxury-black transition-colors"><Copy    className="w-4 h-4" /></button>
          <button onClick={onDelete}    title="Delete Report"    className="p-2 text-luxury-taupe hover:text-danger transition-colors"     ><Trash2  className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  )
}
