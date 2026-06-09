'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeeklyReport } from '@/lib/types'
import { getReports, deleteReport, duplicateReport, createBlankReport } from '@/lib/store'
import { formatCurrency, formatDate, daysOnMarket } from '@/lib/utils'
import { Plus, Eye, Edit2, Copy, Trash2, FileText, Image as ImageIcon, Search } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    setReports(getReports())
  }, [])

  // Group reports by property (most-recent week first within each group)
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? reports.filter(r =>
          r.property.address.toLowerCase().includes(q) ||
          (r.property.unit ?? '').toLowerCase().includes(q) ||
          r.property.neighborhood.toLowerCase().includes(q),
        )
      : reports
    const map = new Map<string, WeeklyReport[]>()
    for (const r of filtered) {
      const key = `${r.property.address}${r.property.unit ? '·' + r.property.unit : ''}`
      const list = map.get(key) ?? []
      list.push(r)
      map.set(key, list)
    }
    return Array.from(map.values())
      .map(list => list.sort((a, b) => b.weekNumber - a.weekNumber))
      .sort((a, b) => (b[0].reportDate ?? '').localeCompare(a[0].reportDate ?? ''))
  }, [reports, search])

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
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/assets"
              className="flex items-center gap-2 px-4 py-2.5 border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Assets
            </Link>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Report
            </button>
          </div>
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
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <p className="section-label text-luxury-taupe">
                {groups.length} {groups.length === 1 ? 'Property' : 'Properties'} · {reports.length} Report{reports.length !== 1 ? 's' : ''}
              </p>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-luxury-taupe absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by address or neighborhood…"
                  className="pl-9 pr-3 py-2 text-xs w-64 max-w-full bg-white border border-luxury-cream focus:outline-none focus:border-luxury-gold"
                />
              </div>
            </div>

            {groups.length === 0 ? (
              <p className="text-center text-luxury-taupe text-sm py-8">No reports match &ldquo;{search}&rdquo;.</p>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <PropertyGroup
                    key={group[0].id}
                    reports={group}
                    onView={(id) => router.push(`/report/${id}`)}
                    onEdit={(id) => router.push(`/dashboard/edit/${id}`)}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function PropertyGroup({
  reports, onView, onEdit, onDuplicate, onDelete,
}: {
  reports: WeeklyReport[]              // sorted by weekNumber desc — latest first
  onView:      (id: string) => void
  onEdit:      (id: string) => void
  onDuplicate: (id: string) => void
  onDelete:    (id: string) => void
}) {
  const latest = reports[0]
  const dom = daysOnMarket(latest.property.listingDate)
  const olderWeeks = reports.slice(1)

  return (
    <div className="bg-white border border-luxury-cream hover:border-luxury-sand transition-colors">
      {/* Latest week — full row */}
      <div className="flex items-center gap-6 p-5">
        <div className="w-20 h-16 flex-shrink-0 overflow-hidden bg-luxury-beige">
          {latest.property.mainImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={latest.property.mainImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-luxury-cream" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {latest.property.address}{latest.property.unit ? `, ${latest.property.unit}` : ''}
              </p>
              <p className="text-luxury-taupe text-xs mt-0.5 truncate">
                {latest.property.neighborhood} · {formatCurrency(latest.property.price)}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="section-label text-luxury-gold border border-luxury-gold/30 px-2 py-0.5">
                Week {latest.weekNumber} — latest
              </span>
              <span className="text-luxury-taupe text-xs">{formatDate(latest.reportDate, 'short')}</span>
              <span className="text-luxury-taupe text-xs">{dom} DOM</span>
            </div>
          </div>

          <div className="flex items-center gap-5 mt-3 flex-wrap">
            {[
              { label: 'Views',     value: latest.currentMetrics.totalViews.toLocaleString() },
              { label: 'Inquiries', value: latest.currentMetrics.inquiries },
              { label: 'Shows',     value: latest.currentMetrics.showingRequests },
              { label: 'Leads',     value: latest.currentMetrics.buyerLeads },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="section-label text-luxury-taupe" style={{ fontSize: '0.58rem' }}>{label}</p>
                <p className="font-serif-display text-xl font-light">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onView(latest.id)}      title="View"      className="p-2 text-luxury-taupe hover:text-luxury-black transition-colors"><Eye     className="w-4 h-4" /></button>
          <button onClick={() => onEdit(latest.id)}      title="Edit"      className="p-2 text-luxury-taupe hover:text-luxury-black transition-colors"><Edit2   className="w-4 h-4" /></button>
          <button onClick={() => onDuplicate(latest.id)} title="New week (duplicate)" className="p-2 text-luxury-taupe hover:text-luxury-black transition-colors"><Copy className="w-4 h-4" /></button>
          <button onClick={() => onDelete(latest.id)}    title="Delete"    className="p-2 text-luxury-taupe hover:text-danger transition-colors"     ><Trash2  className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Prior weeks — compact rows */}
      {olderWeeks.length > 0 && (
        <div className="border-t border-luxury-cream/60 bg-luxury-off/50">
          {olderWeeks.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-luxury-cream/40 last:border-0">
              <span className="section-label text-luxury-taupe w-20 flex-shrink-0">Week {r.weekNumber}</span>
              <span className="text-xs text-luxury-taupe flex-shrink-0">{formatDate(r.reportDate, 'short')}</span>
              <span className="text-xs text-luxury-taupe/70 truncate flex-1">
                {r.currentMetrics.totalViews.toLocaleString()} views · {r.currentMetrics.inquiries} inquiries · {r.currentMetrics.showingRequests} shows
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onView(r.id)} title="View" className="p-1.5 text-luxury-taupe hover:text-luxury-black transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                <button onClick={() => onEdit(r.id)} title="Edit" className="p-1.5 text-luxury-taupe hover:text-luxury-black transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(r.id)} title="Delete" className="p-1.5 text-luxury-taupe hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
