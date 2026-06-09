'use client'
import { useState, useRef } from 'react'
import { useRouter }  from 'next/navigation'
import { WeeklyReport, WeeklyMetrics, METRIC_LABELS, MARKETING_LABELS, MarketingType } from '@/lib/types'
import { saveReport } from '@/lib/store'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2, ChevronDown, ChevronUp, Save, Eye, Upload } from 'lucide-react'
import CompassUpload from './CompassUpload'
import AIImport, { type ExtractedPayload } from './AIImport'
import type { ParsedCompassData } from '@/lib/compass-parser'
import { DEFAULT_INCLUDED_SECTIONS, SECTION_DISPLAY, type IncludedSections } from '@/lib/types'

interface Props { initial: WeeklyReport }

type Section = 'property' | 'metrics' | 'openhouses' | 'marketing' | 'social' | 'feedback' | 'market' | 'strategy'

const SECTIONS: { key: Section; label: string; num: string }[] = [
  { key: 'property',   label: 'Property & Agent',       num: '01' },
  { key: 'metrics',    label: 'Weekly Metrics',          num: '02' },
  { key: 'openhouses', label: 'Open Houses',             num: '03' },
  { key: 'marketing',  label: 'Marketing Activities',    num: '04' },
  { key: 'social',     label: 'Social Media',            num: '05' },
  { key: 'feedback',   label: 'Buyer & Broker Feedback', num: '06' },
  { key: 'market',     label: 'Market Activity',         num: '07' },
  { key: 'strategy',   label: 'Agent Strategy',          num: '08' },
]

function Field({
  label, name, value, onChange, type = 'text', placeholder = '', rows = 0, required = false,
}: {
  label: string; name: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; rows?: number; required?: boolean;
}) {
  const base = 'w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold transition-colors'
  return (
    <div>
      <label className="section-label text-luxury-taupe block mb-1.5">{label}{required && ' *'}</label>
      {rows > 0 ? (
        <textarea
          className={`${base} resize-none`}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          className={base}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function SectionPanel({
  title, num, children, defaultOpen = false,
}: {
  title: string; num: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-luxury-cream bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-luxury-off transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="section-label text-luxury-gold">{num}</span>
          <span className="font-medium text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-luxury-taupe" /> : <ChevronDown className="w-4 h-4 text-luxury-taupe" />}
      </button>
      {open && <div className="px-6 pb-8 pt-2 border-t border-luxury-cream">{children}</div>}
    </div>
  )
}

const METRIC_KEYS = Object.keys(METRIC_LABELS) as (keyof WeeklyMetrics)[]

function InstagramConnect({
  onApply, listingAddress,
}: {
  onApply: (stats: { reach: number; likes: number; comments: number; followers: number; posts: number }) => void
  listingAddress?: string
}) {
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('ig_token') ?? '' : ''))
  const [hashtag, setHashtag] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null)

  async function fetchInsights() {
    if (!token.trim()) {
      setStatus('error'); setMsg('Paste an Instagram Graph API token first.')
      return
    }
    setStatus('loading'); setMsg('Fetching Instagram data…')
    localStorage.setItem('ig_token', token.trim())
    try {
      const qs = new URLSearchParams({ token: token.trim() })
      if (hashtag.trim()) qs.set('hashtag', hashtag.trim())
      const r = await fetch(`/api/instagram?${qs}`)
      const body = await r.json()
      if (!r.ok) { setStatus('error'); setMsg(body.error || 'Fetch failed'); return }
      setData(body)
      setStatus('success'); setMsg(`Pulled ${body.postsReturned} posts from @${body.username}.`)
    } catch (e) {
      setStatus('error'); setMsg(e instanceof Error ? e.message : 'Network error')
    }
  }

  function applyToForm() {
    if (!data) return
    onApply({
      reach:     data.totals.reach || data.totals.impressions || 0,
      likes:     data.totals.likes,
      comments:  data.totals.comments,
      followers: data.followersCount,
      posts:     data.postsReturned,
    })
  }

  return (
    <div className="border border-luxury-gold/30 bg-luxury-off p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">Connect Instagram</p>
          <p className="text-xs text-luxury-taupe mt-0.5">
            Auto-fill Instagram stats from your Business/Creator account. One-time setup at{' '}
            <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-luxury-gold underline">developers.facebook.com</a>{' '}
            — see <code className="text-[10px]">app/api/instagram/route.ts</code> for steps.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Long-lived Graph API token"
          className="md:col-span-2 bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
        />
        <input
          type="text"
          value={hashtag}
          onChange={e => setHashtag(e.target.value)}
          placeholder={`Filter by hashtag (e.g. ${listingAddress?.replace(/\s+/g, '').toLowerCase().slice(0, 14) ?? '613baltic'})`}
          className="bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={fetchInsights}
          disabled={status === 'loading'}
          className="h-[38px] px-4 bg-luxury-black text-white text-xs hover:bg-luxury-dark disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {status === 'loading' ? (
            <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Fetching…</>
          ) : 'Fetch Instagram data'}
        </button>
        {data && (
          <button
            type="button"
            onClick={applyToForm}
            className="h-[38px] px-4 bg-luxury-gold text-luxury-black text-xs hover:bg-luxury-gold/80 transition-colors"
          >
            Apply to Instagram fields
          </button>
        )}
        {msg && (
          <span className={`text-xs ${status === 'error' ? 'text-danger' : status === 'success' ? 'text-success' : 'text-luxury-taupe'}`}>{msg}</span>
        )}
      </div>
      {data && (
        <div className="bg-white border border-luxury-cream px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div><p className="section-label text-luxury-taupe mb-1">Account</p><p className="text-sm font-medium">@{data.username}</p></div>
          <div><p className="section-label text-luxury-taupe mb-1">Followers</p><p className="text-sm font-medium">{data.followersCount?.toLocaleString()}</p></div>
          <div><p className="section-label text-luxury-taupe mb-1">Reach (recent)</p><p className="text-sm font-medium">{data.totals.reach?.toLocaleString() || '—'}</p></div>
          <div><p className="section-label text-luxury-taupe mb-1">Engagements</p><p className="text-sm font-medium">{(data.totals.likes + data.totals.comments).toLocaleString()}</p></div>
        </div>
      )}
    </div>
  )
}

function ListingDateField({ listingDate, onChange }: { listingDate: string; onChange: (v: string) => void }) {
  const days = listingDate
    ? Math.max(0, Math.floor((Date.now() - new Date(listingDate).getTime()) / 86_400_000))
    : 0

  function setFromDom(domStr: string) {
    const dom = parseInt(domStr, 10)
    if (isNaN(dom) || dom < 0) return
    const d = new Date()
    d.setDate(d.getDate() - dom)
    onChange(d.toISOString().slice(0, 10))
  }

  return (
    <div>
      <label className="section-label text-luxury-taupe block mb-1.5">Listing Date</label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={listingDate}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
        />
        <div className="flex items-center gap-1 px-3 py-2 border border-luxury-cream bg-luxury-off">
          <input
            type="number"
            min={0}
            value={days}
            onChange={e => setFromDom(e.target.value)}
            className="w-12 bg-transparent text-sm text-right focus:outline-none"
          />
          <span className="section-label text-luxury-taupe">DOM</span>
        </div>
      </div>
      <p className="text-luxury-taupe/60 text-xs mt-1">Edit either field — the other updates automatically.</p>
    </div>
  )
}

function PhotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="section-label text-luxury-taupe block mb-1.5">Listing Photo</label>
      <div
        className={`relative border-2 border-dashed cursor-pointer transition-colors ${
          dragging ? 'border-luxury-gold bg-luxury-gold/5' : 'border-luxury-cream hover:border-luxury-sand'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {value ? (
          <div className="relative">
            <img src={value} alt="Listing" className="w-full max-h-64 object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 section-label text-white bg-black/60 px-3 py-1.5">Click to replace</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Upload className={`w-6 h-6 mb-2 transition-colors ${dragging ? 'text-luxury-gold' : 'text-luxury-cream'}`} />
            <p className="text-sm font-medium">Drop listing photo here</p>
            <p className="text-luxury-taupe text-xs mt-1">JPG, PNG, WebP — click or drag</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReportForm({ initial }: Props) {
  const router = useRouter()
  const [report, setReport] = useState<WeeklyReport>(initial)
  const [saving, setSaving] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [lookupMsg, setLookupMsg] = useState<string>('')

  async function runLookup(params: { address?: string; url?: string }) {
    if (!params.address && !params.url) return
    setLookupStatus('loading')
    setLookupMsg(params.url ? 'Fetching listing page…' : 'Searching the web for listing details…')
    try {
      // Always pass current address as context — lets the API normalise
      // Compass insights URLs (just an ID) into a public listing URL.
      const ctx = [report.property.address, report.property.unit, report.property.city, report.property.state, report.property.zip]
        .filter(Boolean).join(' ')
      const qs = params.url
        ? `url=${encodeURIComponent(params.url)}&addressContext=${encodeURIComponent(ctx)}`
        : `address=${encodeURIComponent(params.address!)}`
      const res  = await fetch(`/api/lookup-property?${qs}`)
      const data = await res.json()
      if (!res.ok) {
        setLookupStatus('error')
        setLookupMsg(data.error || 'Lookup failed')
        return
      }
      const filled: string[] = []
      setReport(r => {
        const p = { ...r.property }
        const a = { ...p.agent }
        if (data.beds         && !p.beds)         { p.beds         = data.beds;         filled.push('beds') }
        if (data.baths        && !p.baths)        { p.baths        = data.baths;        filled.push('baths') }
        if (data.sqft         && !p.sqft)         { p.sqft         = data.sqft;         filled.push('sqft') }
        if (data.price        && !p.price)        { p.price        = data.price;        filled.push('price') }
        if (data.description  && !p.description)  { p.description  = data.description;  filled.push('description') }
        if (data.mainImageUrl && !p.mainImageUrl) { p.mainImageUrl = data.mainImageUrl; filled.push('photo') }
        // Listing date from the URL is authoritative — always overwrite for accurate DOM
        if (data.listingDate)                     { p.listingDate  = data.listingDate;  filled.push('listing date') }
        if (data.agentName    && !a.name)         { a.name         = data.agentName;    filled.push('agent name') }
        if (data.agentTitle   && !a.title)        { a.title        = data.agentTitle;   filled.push('agent title') }
        if (data.agentPhone   && !a.phone)        { a.phone        = data.agentPhone;   filled.push('agent phone') }
        if (data.agentEmail   && !a.email)        { a.email        = data.agentEmail;   filled.push('agent email') }
        if (data.agentPhotoUrl && !a.photoUrl)    { a.photoUrl     = data.agentPhotoUrl; filled.push('agent photo') }
        p.agent = a
        return { ...r, property: p }
      })
      setLookupStatus('success')
      setLookupMsg(
        filled.length
          ? `Found ${filled.join(', ')} from ${data.source}`
          : `Listing found on ${data.source} — fields already populated`
      )
    } catch (e) {
      setLookupStatus('error')
      setLookupMsg(e instanceof Error ? e.message : 'Network error')
    }
  }

  const lookupProperty = (address: string) => runLookup({ address })
  const lookupByUrl    = (url: string)     => runLookup({ url })
  const [listingUrlInput, setListingUrlInput] = useState('')

  const [recStatus, setRecStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [recMsg,    setRecMsg]    = useState<string>('')

  async function generateRecommendations() {
    setRecStatus('loading')
    setRecMsg('')
    try {
      const feedbackThemes = [
        report.feedback?.commonObjections,
        report.feedback?.pricingFeedback,
        report.feedback?.brokerSentiment,
      ].filter(Boolean).join(' | ')
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            address:      report.property.address,
            unit:         report.property.unit,
            neighborhood: report.property.neighborhood,
            city:         report.property.city,
            price:        report.property.price,
            beds:         report.property.beds,
            baths:        report.property.baths,
            sqft:         report.property.sqft,
            listingDate:  report.property.listingDate,
            description:  report.property.description,
          },
          weekNumber: report.weekNumber,
          currentMetrics:  report.currentMetrics,
          previousMetrics: report.previousMetrics,
          openHouseCount:  report.openHouses?.length ?? 0,
          feedbackThemes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRecStatus('error')
        setRecMsg(data.error || 'Failed to generate recommendations')
        return
      }
      const filled: string[] = []
      setReport(r => {
        const s = { ...r.strategy }
        if (data.keyRecommendations    && !s.keyRecommendations)    { s.keyRecommendations    = data.keyRecommendations;    filled.push('key recommendations') }
        if (data.marketingPlanNextWeek && !s.marketingPlanNextWeek) { s.marketingPlanNextWeek = data.marketingPlanNextWeek; filled.push('marketing plan') }
        if (data.pricingStrategy       && !s.pricingStrategy)       { s.pricingStrategy       = data.pricingStrategy;       filled.push('pricing strategy') }
        if (data.upcomingCampaigns     && !s.upcomingCampaigns)     { s.upcomingCampaigns     = data.upcomingCampaigns;     filled.push('campaigns') }
        if (data.brokerEvents          && !s.brokerEvents)          { s.brokerEvents          = data.brokerEvents;          filled.push('broker events') }
        if (data.openHousesPlanned     && !s.openHousesPlanned)     { s.openHousesPlanned     = data.openHousesPlanned;     filled.push('open houses') }
        return { ...r, strategy: s }
      })
      setRecStatus('success')
      setRecMsg(filled.length ? `Filled ${filled.join(', ')}` : 'All sections already filled — recommendations not overwritten')
    } catch (e) {
      setRecStatus('error')
      setRecMsg(e instanceof Error ? e.message : 'Network error')
    }
  }

  function setProperty(key: string, value: string | number) {
    setReport(r => ({ ...r, property: { ...r.property, [key]: value } }))
  }
  function setAgent(key: string, value: string) {
    setReport(r => ({ ...r, property: { ...r.property, agent: { ...r.property.agent, [key]: value } } }))
  }
  function setMetric(key: keyof WeeklyMetrics, value: string) {
    const num = parseInt(value) || 0
    setReport(r => ({ ...r, currentMetrics: { ...r.currentMetrics, [key]: num } }))
  }
  function setPrevMetric(key: keyof WeeklyMetrics, value: string) {
    const num = parseInt(value) || 0
    setReport(r => ({
      ...r,
      previousMetrics: { ...(r.previousMetrics ?? r.currentMetrics), [key]: num },
    }))
  }

  function addOpenHouse() {
    setReport(r => ({
      ...r,
      openHouses: [...r.openHouses, {
        id: uuidv4(), date: '', startTime: '12:00', endTime: '14:00',
        totalAttendees: 0, brokers: 0, buyers: 0,
        seriousInterestLevel: 3,
        commonFeedback: '', questionsAsked: '', followUpActions: '',
      }],
    }))
  }
  function updateOpenHouse(id: string, key: string, value: string | number) {
    setReport(r => ({
      ...r,
      openHouses: r.openHouses.map(oh => oh.id === id ? { ...oh, [key]: value } : oh),
    }))
  }
  function removeOpenHouse(id: string) {
    setReport(r => ({ ...r, openHouses: r.openHouses.filter(oh => oh.id !== id) }))
  }

  function addMarketing() {
    setReport(r => ({
      ...r,
      marketing: [...r.marketing, {
        id: uuidv4(), type: 'instagram_post', name: '', date: '',
        impressions: 0, engagement: 0, clicks: 0, reach: 0, notes: '',
      }],
    }))
  }
  function updateMarketing(id: string, key: string, value: string | number) {
    setReport(r => ({
      ...r,
      marketing: r.marketing.map(m => m.id === id ? { ...m, [key]: value } : m),
    }))
  }
  function removeMarketing(id: string) {
    setReport(r => ({ ...r, marketing: r.marketing.filter(m => m.id !== id) }))
  }

  function setSocial(idx: number, key: string, value: string | number) {
    setReport(r => {
      const arr = [...r.socialMedia]
      arr[idx] = { ...arr[idx], [key]: value }
      return { ...r, socialMedia: arr }
    })
  }
  function setFeedback(key: string, value: string) {
    setReport(r => ({ ...r, feedback: { ...r.feedback, [key]: value } }))
  }
  function setStrategy(key: string, value: string) {
    setReport(r => ({ ...r, strategy: { ...r.strategy, [key]: value } }))
  }
  function setMarketActivity(key: string, value: string) {
    setReport(r => ({ ...r, marketActivity: { ...r.marketActivity, [key]: value } }))
  }

  async function handleSave(andView = false) {
    setSaving(true)
    try {
      await saveReport(report)
    } catch (e) {
      alert(`Save failed: ${e instanceof Error ? e.message : 'unknown error'}`)
      setSaving(false)
      return
    }
    if (andView) {
      router.push(`/report/${report.id}`)
    } else {
      setSaving(false)
    }
  }

  const ig    = report.socialMedia?.find(s => s.platform === 'instagram')
  const tt    = report.socialMedia?.find(s => s.platform === 'tiktok')
  const igIdx = report.socialMedia?.findIndex(s => s.platform === 'instagram') ?? -1
  const ttIdx = report.socialMedia?.findIndex(s => s.platform === 'tiktok') ?? -1

  function handleCompassApply(data: ParsedCompassData) {
    setReport(r => ({
      ...r,
      property: {
        ...r.property,
        ...(data.address && { address: data.address }),
        ...(data.price   && { price:   data.price }),
      },
      currentMetrics: { ...r.currentMetrics, ...data.metrics },
    }))
    // Prefer URL-based lookup (most reliable); fall back to address search
    if (data.listingUrl)      lookupByUrl(data.listingUrl)
    else if (data.address)    lookupProperty(data.address)
  }

  /**
   * Merge an AI-extracted payload into the report. Tries to be smart about routing:
   * - web metrics → currentMetrics
   * - ad numbers → digitalAds (replacing reportingPeriod if new one provided)
   * - social traffic share → digitalAds.socialTrafficShare
   * - open-house attendance → updates last openHouse OR appends new one
   * - instagram stats → socialMedia[]
   *
   * Existing non-zero / non-empty values are preserved.
   */
  function handleAIExtract(payload: ExtractedPayload) {
    const e = payload.extracted as Record<string, unknown>
    const num = (k: string): number | undefined => {
      const v = e[k]
      return typeof v === 'number' && Number.isFinite(v) ? v : undefined
    }
    const str = (k: string): string | undefined => {
      const v = e[k]
      return typeof v === 'string' && v.trim() ? v.trim() : undefined
    }
    const arr = <T,>(k: string): T[] | undefined => {
      const v = e[k]
      return Array.isArray(v) && v.length ? (v as T[]) : undefined
    }
    const obj = (k: string): Record<string, unknown> | undefined => {
      const v = e[k]
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
    }

    setReport(r => {
      const next = { ...r }

      // --- Currentweekly metrics (only fill where existing value is 0/empty) ---
      const metricUpdates: Record<string, number> = {}
      const tryFill = (key: keyof typeof r.currentMetrics, val: number | undefined) => {
        if (val == null) return
        if ((r.currentMetrics[key] ?? 0) === 0) metricUpdates[key] = val
      }
      tryFill('totalViews',          num('totalViews'))
      tryFill('compassViews',        num('compassViews'))
      tryFill('streetEasyViews',     num('streetEasyViews'))
      tryFill('zillowViews',         num('zillowViews'))
      tryFill('saves',               num('saves'))
      tryFill('inquiries',           num('inquiries'))
      tryFill('showingRequests',     num('showingRequests'))
      tryFill('openHouseAttendees',  num('openHouseAttendees'))
      if (Object.keys(metricUpdates).length) {
        next.currentMetrics = { ...r.currentMetrics, ...metricUpdates }
      }

      // --- Digital ads merge ---
      const existingAds = r.digitalAds
      const adsUpdates: Partial<NonNullable<typeof r.digitalAds>> = {}
      const period = str('reportingPeriod')
      if (period && !existingAds?.reportingPeriod)               adsUpdates.reportingPeriod = period
      if (num('totalImpressions') && !existingAds?.totalImpressions) adsUpdates.totalImpressions = num('totalImpressions')!
      if (num('totalClicks')      && !existingAds?.totalClicks)      adsUpdates.totalClicks      = num('totalClicks')!
      const tc = obj('topChannel')
      if (tc && !existingAds?.topChannel) {
        const name = typeof tc.name === 'string' ? tc.name : ''
        const ctr  = typeof tc.ctr  === 'number' ? tc.ctr  : 0
        if (name) adsUpdates.topChannel = { name, ctr }
      }
      const byCh = arr<{ channel?: string; clicks?: number; ctr?: number }>('byChannel')
      if (byCh && (!existingAds?.byChannel || existingAds.byChannel.length === 0)) {
        adsUpdates.byChannel = byCh
          .filter(c => c.channel && typeof c.clicks === 'number')
          .map(c => ({ channel: String(c.channel), clicks: Number(c.clicks), ctr: Number(c.ctr ?? 0) }))
      }
      const sts = arr<{ channel?: string; share?: number }>('socialTrafficShare')
      if (sts && (!existingAds?.socialTrafficShare || existingAds.socialTrafficShare.length === 0)) {
        adsUpdates.socialTrafficShare = sts
          .filter(s => s.channel && typeof s.share === 'number')
          .map(s => ({ channel: String(s.channel), share: Number(s.share) }))
      }
      const pubs = arr<{ publisher?: string; views?: number }>('topPublishers')
      if (pubs && (!existingAds?.topPublishers || existingAds.topPublishers.length === 0)) {
        adsUpdates.topPublishers = pubs
          .filter(p => p.publisher && typeof p.views === 'number')
          .map(p => ({ publisher: String(p.publisher), views: Number(p.views) }))
      }
      if (Object.keys(adsUpdates).length) {
        next.digitalAds = {
          reportingPeriod:     '',
          totalImpressions:    0,
          totalClicks:         0,
          byChannel:           [],
          socialTrafficPeriod: '',
          socialTrafficShare:  [],
          ...existingAds,
          ...adsUpdates,
        }
      }

      // --- Open house attendance ---
      const ohDate     = str('openHouseDate')
      const ohAttendees = num('openHouseAttendees')
      const ohBrokers   = num('openHouseBrokers')
      const ohBuyers    = num('openHouseBuyers')
      if (ohDate && (ohAttendees != null || ohBrokers != null || ohBuyers != null)) {
        const existing = (r.openHouses ?? []).find(o => o.date === ohDate)
        if (existing) {
          next.openHouses = (r.openHouses ?? []).map(o => o.date === ohDate ? {
            ...o,
            totalAttendees: ohAttendees ?? o.totalAttendees,
            brokers:        ohBrokers   ?? o.brokers,
            buyers:         ohBuyers    ?? o.buyers,
          } : o)
        } else {
          next.openHouses = [...(r.openHouses ?? []), {
            id: `oh-ai-${Date.now()}`,
            date: ohDate,
            startTime: '12:00',
            endTime: '13:30',
            totalAttendees: ohAttendees ?? 0,
            brokers: ohBrokers ?? 0,
            buyers:  ohBuyers  ?? 0,
            seriousInterestLevel: 3,
            commonFeedback: '',
            questionsAsked: '',
            followUpActions: '',
          }]
        }
      }

      // --- Instagram social media stats ---
      const igMetrics = {
        reelViews: num('instagramReelViews'),
        likes:     num('instagramLikes'),
        comments:  num('instagramComments'),
        shares:    num('instagramShares'),
        saves:     num('instagramSaves'),
      }
      if (Object.values(igMetrics).some(v => v != null)) {
        const idx = (r.socialMedia ?? []).findIndex(s => s.platform === 'instagram')
        const base = idx >= 0 ? r.socialMedia[idx] : {
          platform: 'instagram' as const,
          reelViews: 0, likes: 0, comments: 0, shares: 0, saves: 0,
          engagementRate: 0, followerGrowth: 0,
        }
        const merged = {
          ...base,
          reelViews: base.reelViews || igMetrics.reelViews || 0,
          likes:     base.likes     || igMetrics.likes     || 0,
          comments:  base.comments  || igMetrics.comments  || 0,
          shares:    base.shares    || igMetrics.shares    || 0,
          saves:     base.saves     || igMetrics.saves     || 0,
        }
        const arr2 = [...(r.socialMedia ?? [])]
        if (idx >= 0) arr2[idx] = merged
        else arr2.push(merged)
        next.socialMedia = arr2
      }

      return next
    })
  }

  return (
    <div className="space-y-2">

      {/* === AI DROP ZONE — any screenshot/PDF, auto-extract === */}
      <AIImport onApply={handleAIExtract} />

      {/* === COMPASS IMPORT (legacy parser for the specific Compass HTML/JSON shape) === */}
      <div className="mb-6">
        <CompassUpload onApply={handleCompassApply} />
      </div>

      {/* === SECTIONS TO INCLUDE === */}
      <div className="border border-luxury-cream bg-white p-6 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-medium text-sm">Sections to Include in the Final Report</p>
          <button
            type="button"
            onClick={() => {
              const allOn = SECTION_DISPLAY.every(s => (report.includedSections ?? DEFAULT_INCLUDED_SECTIONS)[s.key])
              setReport(r => ({
                ...r,
                includedSections: Object.fromEntries(SECTION_DISPLAY.map(s => [s.key, !allOn])) as unknown as IncludedSections,
              }))
            }}
            className="section-label text-luxury-taupe hover:text-luxury-black transition-colors"
          >
            {SECTION_DISPLAY.every(s => (report.includedSections ?? DEFAULT_INCLUDED_SECTIONS)[s.key]) ? 'deselect all' : 'select all'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SECTION_DISPLAY.map(({ key, num, label }) => {
            const inc = report.includedSections ?? DEFAULT_INCLUDED_SECTIONS
            const on = inc[key]
            return (
              <label
                key={key}
                className={`flex items-center gap-3 px-3 py-2.5 border cursor-pointer transition-colors ${
                  on ? 'border-luxury-gold/40 bg-luxury-gold/5' : 'border-luxury-cream hover:border-luxury-sand'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={e => setReport(r => ({
                    ...r,
                    includedSections: { ...(r.includedSections ?? DEFAULT_INCLUDED_SECTIONS), [key]: e.target.checked },
                  }))}
                  className="accent-luxury-gold flex-shrink-0 w-4 h-4"
                />
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="section-label text-luxury-gold" style={{ fontSize: '0.55rem' }}>{num}</p>
                  <p className="text-xs text-luxury-black truncate mt-0.5">{label}</p>
                </div>
              </label>
            )
          })}
        </div>
        <p className="text-xs text-luxury-taupe/70 mt-3">The cover page is always included. Unchecked sections are hidden from the report and the PDF export.</p>
      </div>

      {/* === PROPERTY === */}
      <SectionPanel title="Property & Agent" num="01" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Street Address" name="address" value={report.property.address} onChange={v => setProperty('address', v)} required placeholder="432 Park Avenue" />
              </div>
              <button
                type="button"
                onClick={() => lookupProperty(`${report.property.address}${report.property.unit ? ' ' + report.property.unit : ''}, ${report.property.city}, ${report.property.state}`)}
                disabled={lookupStatus === 'loading' || !report.property.address}
                className="h-[38px] px-4 bg-luxury-black text-white text-xs whitespace-nowrap hover:bg-luxury-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {lookupStatus === 'loading' ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>Look up on web</>
                )}
              </button>
            </div>
            {lookupStatus !== 'idle' && lookupMsg && (
              <p className={`text-xs mt-1.5 ${
                lookupStatus === 'success' ? 'text-success' :
                lookupStatus === 'error'   ? 'text-danger'  :
                'text-luxury-taupe'
              }`}>{lookupMsg}</p>
            )}
            <div className="mt-2 flex items-end gap-2">
              <div className="flex-1">
                <label className="section-label text-luxury-taupe block mb-1.5">Or paste any Compass URL (public listing, /app/listing/, or /listing-insights/)</label>
                <input
                  type="url"
                  value={listingUrlInput}
                  onChange={e => setListingUrlInput(e.target.value)}
                  placeholder="https://www.compass.com/listing-insights/my-listings/..."
                  className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                />
                <p className="text-luxury-taupe/60 text-xs mt-1">Insights URLs need a street address filled in above — used to construct the public listing URL.</p>
              </div>
              <button
                type="button"
                onClick={() => lookupByUrl(listingUrlInput)}
                disabled={lookupStatus === 'loading' || !listingUrlInput.trim()}
                className="h-[38px] px-4 bg-luxury-gold text-luxury-black text-xs whitespace-nowrap hover:bg-luxury-gold/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Fetch from URL
              </button>
            </div>
          </div>
          <Field label="Unit" name="unit" value={report.property.unit ?? ''} onChange={v => setProperty('unit', v)} placeholder="Unit 87B" />
          <Field label="Neighborhood" name="neighborhood" value={report.property.neighborhood} onChange={v => setProperty('neighborhood', v)} placeholder="Midtown East" />
          <Field label="City"  name="city"  value={report.property.city}  onChange={v => setProperty('city', v)}  placeholder="New York" />
          <Field label="State" name="state" value={report.property.state} onChange={v => setProperty('state', v)} placeholder="NY" />
          <Field label="ZIP"   name="zip"   value={report.property.zip}   onChange={v => setProperty('zip', v)}   placeholder="10022" />
          <Field label="List Price" name="price" value={report.property.price} type="number" onChange={v => setProperty('price', parseInt(v) || 0)} />
          <Field label="Bedrooms"   name="beds"  value={report.property.beds}  type="number" onChange={v => setProperty('beds',  parseFloat(v) || 0)} />
          <Field label="Bathrooms"  name="baths" value={report.property.baths} type="number" onChange={v => setProperty('baths', parseFloat(v) || 0)} />
          <Field label="Square Feet" name="sqft" value={report.property.sqft}  type="number" onChange={v => setProperty('sqft',  parseInt(v) || 0)} />
          <ListingDateField
            listingDate={report.property.listingDate}
            onChange={v => setProperty('listingDate', v)}
          />
          <div className="md:col-span-2">
            <PhotoUpload
              value={report.property.mainImageUrl ?? ''}
              onChange={v => setProperty('mainImageUrl', v)}
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Property Description" name="description" value={report.property.description ?? ''} onChange={v => setProperty('description', v)} rows={4} placeholder="Describe the property..." />
          </div>

          <div className="md:col-span-2 pt-4 border-t border-luxury-cream">
            <p className="section-label text-luxury-taupe mb-4">Agent Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Agent Name"  name="agentName"  value={report.property.agent.name}       onChange={v => setAgent('name', v)} />
              <Field label="Title"       name="agentTitle" value={report.property.agent.title}      onChange={v => setAgent('title', v)} />
              <Field label="Team Name"   name="agentTeam"  value={report.property.agent.team}       onChange={v => setAgent('team', v)} />
              <Field label="Brokerage"   name="brokerage"  value={report.property.agent.brokerage}  onChange={v => setAgent('brokerage', v)} />
              <Field label="Phone"       name="phone"      value={report.property.agent.phone}      onChange={v => setAgent('phone', v)} type="tel" />
              <Field label="Email"       name="email"      value={report.property.agent.email}      onChange={v => setAgent('email', v)} type="email" />
              <Field label="Agent Photo URL" name="photoUrl" value={report.property.agent.photoUrl ?? ''} onChange={v => setAgent('photoUrl', v)} placeholder="https://..." />
            </div>
          </div>

          <div className="md:col-span-2 pt-4 border-t border-luxury-cream">
            <p className="section-label text-luxury-taupe mb-4">Report Period</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Week Number" name="weekNumber" value={report.weekNumber} type="number" onChange={v => setReport(r => ({ ...r, weekNumber: parseInt(v) || 1 }))} />
              <Field label="Week Start"  name="weekStart"  value={report.weekStartDate} type="date" onChange={v => setReport(r => ({ ...r, weekStartDate: v }))} />
              <Field label="Week End"    name="weekEnd"    value={report.weekEndDate}   type="date" onChange={v => setReport(r => ({ ...r, weekEndDate: v }))} />
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* === METRICS === */}
      <SectionPanel title="Weekly Metrics" num="02">
        <div className="mt-4 space-y-6">
          <div>
            <p className="section-label text-luxury-gold mb-3">This Week</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {METRIC_KEYS.map(key => (
                <div key={key}>
                  <label className="section-label text-luxury-taupe block mb-1" style={{ fontSize: '0.6rem' }}>{METRIC_LABELS[key]}</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                    value={report.currentMetrics[key]}
                    onChange={e => setMetric(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="section-label text-luxury-taupe mb-3">Previous Week (for % change comparison)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {METRIC_KEYS.map(key => (
                <div key={key}>
                  <label className="section-label text-luxury-taupe block mb-1" style={{ fontSize: '0.6rem' }}>{METRIC_LABELS[key]}</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold transition-colors"
                    value={report.previousMetrics?.[key] ?? 0}
                    onChange={e => setPrevMetric(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* === OPEN HOUSES === */}
      <SectionPanel title="Open Houses" num="03">
        <div className="mt-4 space-y-6">
          {report.openHouses.map((oh, i) => (
            <div key={oh.id} className="border border-luxury-cream p-5 relative">
              <button
                type="button"
                onClick={() => removeOpenHouse(oh.id)}
                className="absolute top-3 right-3 text-luxury-taupe hover:text-danger transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <p className="section-label text-luxury-gold mb-4">Event {i + 1}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Date"       name={`date-${oh.id}`}      value={oh.date}       type="date" onChange={v => updateOpenHouse(oh.id, 'date', v)} />
                <Field label="Start Time" name={`start-${oh.id}`}     value={oh.startTime}  type="time" onChange={v => updateOpenHouse(oh.id, 'startTime', v)} />
                <Field label="End Time"   name={`end-${oh.id}`}       value={oh.endTime}    type="time" onChange={v => updateOpenHouse(oh.id, 'endTime', v)} />
                <Field label="Total Attendees" name={`att-${oh.id}`}  value={oh.totalAttendees} type="number" onChange={v => updateOpenHouse(oh.id, 'totalAttendees', parseInt(v) || 0)} />
                <Field label="Buyers"     name={`buy-${oh.id}`}       value={oh.buyers}     type="number" onChange={v => updateOpenHouse(oh.id, 'buyers', parseInt(v) || 0)} />
                <Field label="Brokers"    name={`bro-${oh.id}`}       value={oh.brokers}    type="number" onChange={v => updateOpenHouse(oh.id, 'brokers', parseInt(v) || 0)} />
                <div>
                  <label className="section-label text-luxury-taupe block mb-1.5">Interest Level (1–5)</label>
                  <select
                    className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                    value={oh.seriousInterestLevel}
                    onChange={e => updateOpenHouse(oh.id, 'seriousInterestLevel', parseInt(e.target.value) as 1|2|3|4|5)}
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <Field label="Common Feedback"   name={`fb-${oh.id}`}  value={oh.commonFeedback}  rows={3} onChange={v => updateOpenHouse(oh.id, 'commonFeedback', v)} />
                <Field label="Questions Asked"   name={`qa-${oh.id}`}  value={oh.questionsAsked}  rows={3} onChange={v => updateOpenHouse(oh.id, 'questionsAsked', v)} />
                <Field label="Follow-Up Actions" name={`fu-${oh.id}`}  value={oh.followUpActions} rows={3} onChange={v => updateOpenHouse(oh.id, 'followUpActions', v)} />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addOpenHouse}
            className="flex items-center gap-2 text-sm text-luxury-gold hover:text-luxury-sand transition-colors section-label"
          >
            <Plus className="w-4 h-4" /> Add Open House Event
          </button>
        </div>
      </SectionPanel>

      {/* === MARKETING === */}
      <SectionPanel title="Marketing Activities" num="04">
        <div className="mt-4 space-y-4">
          {report.marketing.map((m, i) => (
            <div key={m.id} className="border border-luxury-cream p-5 relative">
              <button type="button" onClick={() => removeMarketing(m.id)} className="absolute top-3 right-3 text-luxury-taupe hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <p className="section-label text-luxury-gold mb-4">Activity {i + 1}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="section-label text-luxury-taupe block mb-1.5">Type</label>
                  <select
                    className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                    value={m.type}
                    onChange={e => updateMarketing(m.id, 'type', e.target.value as MarketingType)}
                  >
                    {Object.entries(MARKETING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <Field label="Name/Title" name={`mname-${m.id}`} value={m.name} onChange={v => updateMarketing(m.id, 'name', v)} placeholder="e.g. Sunrise Reel" />
                <Field label="Date" name={`mdate-${m.id}`} value={m.date} type="date" onChange={v => updateMarketing(m.id, 'date', v)} />
                <Field label="Impressions" name={`imp-${m.id}`}  value={m.impressions ?? 0}  type="number" onChange={v => updateMarketing(m.id, 'impressions', parseInt(v) || 0)} />
                <Field label="Reach"       name={`rch-${m.id}`}  value={m.reach ?? 0}        type="number" onChange={v => updateMarketing(m.id, 'reach', parseInt(v) || 0)} />
                <Field label="Engagement"  name={`eng-${m.id}`}  value={m.engagement ?? 0}   type="number" onChange={v => updateMarketing(m.id, 'engagement', parseInt(v) || 0)} />
                <Field label="Clicks"      name={`clk-${m.id}`}  value={m.clicks ?? 0}       type="number" onChange={v => updateMarketing(m.id, 'clicks', parseInt(v) || 0)} />
                <Field label="Link (optional)" name={`lnk-${m.id}`} value={m.link ?? ''} onChange={v => updateMarketing(m.id, 'link', v)} placeholder="https://..." />
              </div>
              <div className="mt-3">
                <Field label="Notes" name={`mnotes-${m.id}`} value={m.notes ?? ''} rows={2} onChange={v => updateMarketing(m.id, 'notes', v)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addMarketing} className="flex items-center gap-2 text-sm text-luxury-gold hover:text-luxury-sand transition-colors section-label">
            <Plus className="w-4 h-4" /> Add Marketing Activity
          </button>
        </div>
      </SectionPanel>

      {/* === SOCIAL MEDIA === */}
      <SectionPanel title="Social Media" num="05">
        <div className="mt-4 space-y-6">

          {/* Instagram connect */}
          <InstagramConnect
            onApply={(stats) => {
              const igCurrent = report.socialMedia?.findIndex(s => s.platform === 'instagram') ?? -1
              setReport(r => {
                const sm = [...(r.socialMedia ?? [])]
                const merged = {
                  platform: 'instagram' as const,
                  reelViews:      stats.reach,
                  likes:          stats.likes,
                  comments:       stats.comments,
                  shares:         igCurrent >= 0 ? sm[igCurrent].shares : 0,
                  saves:          igCurrent >= 0 ? sm[igCurrent].saves : 0,
                  engagementRate: stats.followers > 0 ? Math.round(((stats.likes + stats.comments) / stats.followers) * 1000) / 10 : 0,
                  followerGrowth: igCurrent >= 0 ? sm[igCurrent].followerGrowth : 0,
                }
                if (igCurrent >= 0) sm[igCurrent] = merged
                else sm.push(merged)
                return { ...r, socialMedia: sm }
              })
            }}
            listingAddress={report.property.address}
          />

          {[{ label: 'Instagram', platform: 'instagram' as const, idx: igIdx, stats: ig },
            { label: 'TikTok',    platform: 'tiktok'    as const, idx: ttIdx, stats: tt }].map(({ label, platform, idx, stats }) => (
            <div key={platform}>
              <p className="section-label text-luxury-gold mb-3">{label}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'reelViews', label: 'Reel Views' },
                  { key: 'likes',     label: 'Likes' },
                  { key: 'comments',  label: 'Comments' },
                  { key: 'shares',    label: 'Shares' },
                  { key: 'saves',     label: 'Saves' },
                  { key: 'followerGrowth', label: 'New Followers' },
                ].map(({ key, label: l }) => (
                  <div key={key}>
                    <label className="section-label text-luxury-taupe block mb-1.5">{l}</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                      value={stats?.[key as keyof typeof stats] ?? 0}
                      onChange={e => {
                        if (idx >= 0) {
                          setSocial(idx, key, parseFloat(e.target.value) || 0)
                        } else {
                          setReport(r => ({
                            ...r,
                            socialMedia: [...r.socialMedia, {
                              platform, reelViews: 0, likes: 0, comments: 0,
                              shares: 0, saves: 0, engagementRate: 0, followerGrowth: 0,
                              [key]: parseFloat(e.target.value) || 0,
                            }],
                          }))
                        }
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label className="section-label text-luxury-taupe block mb-1.5">Engagement Rate %</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                    value={stats?.engagementRate ?? 0}
                    onChange={e => idx >= 0 && setSocial(idx, 'engagementRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="section-label text-luxury-taupe block mb-1.5">Best Performing Content Description</label>
                <input
                  type="text"
                  className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                  value={stats?.bestContentDescription ?? ''}
                  placeholder="e.g. Sunrise cinematic reel"
                  onChange={e => idx >= 0 && setSocial(idx, 'bestContentDescription', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>

      {/* === DIGITAL ADS === */}
      <SectionPanel title="Digital Ads & Reach" num="06a">
        <div className="mt-4 space-y-4">
          <p className="text-xs text-luxury-taupe">
            Paste numbers from Compass ad performance + social traffic dashboards. Leave blank to hide the section.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Ad Reporting Period"
              name="dareportperiod"
              placeholder="May 8 – May 21, 2026"
              value={report.digitalAds?.reportingPeriod ?? ''}
              onChange={v => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), reportingPeriod: v } }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Total Impressions" type="number" name="daimpr"
                value={report.digitalAds?.totalImpressions ?? 0}
                onChange={v => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), totalImpressions: parseInt(v) || 0 } }))}
              />
              <Field
                label="Total Clicks" type="number" name="daclicks"
                value={report.digitalAds?.totalClicks ?? 0}
                onChange={v => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), totalClicks: parseInt(v) || 0 } }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Top Channel Name" name="datopname"
              placeholder="Instagram"
              value={report.digitalAds?.topChannel?.name ?? ''}
              onChange={v => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), topChannel: { name: v, ctr: r.digitalAds?.topChannel?.ctr ?? 0 } } }))}
            />
            <Field
              label="Top Channel CTR %" type="number" name="datopctr"
              value={report.digitalAds?.topChannel?.ctr ?? 0}
              onChange={v => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), topChannel: { name: r.digitalAds?.topChannel?.name ?? '', ctr: parseFloat(v) || 0 } } }))}
            />
          </div>

          {/* Per-channel breakdown */}
          <div>
            <p className="section-label text-luxury-gold mb-3">Ad Clicks by Channel</p>
            <div className="space-y-2">
              {(report.digitalAds?.byChannel ?? []).map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5"><Field label="Channel"      name={`ch${i}`}      value={c.channel} onChange={v => setReport(r => { const arr=[...(r.digitalAds?.byChannel ?? [])]; arr[i]={...arr[i], channel:v}; return { ...r, digitalAds: { ...(r.digitalAds!), byChannel:arr } } })} /></div>
                  <div className="col-span-3"><Field label="Clicks" type="number" name={`cc${i}`} value={c.clicks} onChange={v => setReport(r => { const arr=[...(r.digitalAds?.byChannel ?? [])]; arr[i]={...arr[i], clicks: parseInt(v) || 0}; return { ...r, digitalAds: { ...(r.digitalAds!), byChannel:arr } } })} /></div>
                  <div className="col-span-3"><Field label="CTR %" type="number" name={`ct${i}`} value={c.ctr} onChange={v => setReport(r => { const arr=[...(r.digitalAds?.byChannel ?? [])]; arr[i]={...arr[i], ctr: parseFloat(v) || 0}; return { ...r, digitalAds: { ...(r.digitalAds!), byChannel:arr } } })} /></div>
                  <button type="button" className="col-span-1 h-[38px] flex items-center justify-center text-luxury-taupe hover:text-danger" onClick={() => setReport(r => { const arr=[...(r.digitalAds?.byChannel ?? [])]; arr.splice(i,1); return { ...r, digitalAds: { ...(r.digitalAds!), byChannel:arr } } })}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), byChannel: [...(r.digitalAds?.byChannel ?? []), { channel:'', clicks:0, ctr:0 }] } }))} className="mt-2 flex items-center gap-2 text-sm text-luxury-gold hover:text-luxury-sand section-label">
              <Plus className="w-4 h-4" /> Add Channel
            </button>
          </div>

          {/* Social traffic share */}
          <div className="border-t border-luxury-cream pt-4">
            <p className="section-label text-luxury-gold mb-3">Social Traffic Share</p>
            <Field
              label="Period (e.g. April 22 – May 22, 2026)" name="dasocialp"
              placeholder="April 22 – May 22, 2026"
              value={report.digitalAds?.socialTrafficPeriod ?? ''}
              onChange={v => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), socialTrafficPeriod: v } }))}
            />
            <div className="space-y-2 mt-3">
              {(report.digitalAds?.socialTrafficShare ?? []).map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-7"><Field label="Channel" name={`st${i}`} value={s.channel} onChange={v => setReport(r => { const arr=[...(r.digitalAds?.socialTrafficShare ?? [])]; arr[i]={...arr[i], channel:v}; return { ...r, digitalAds: { ...(r.digitalAds!), socialTrafficShare:arr } } })} /></div>
                  <div className="col-span-4"><Field label="Share %" type="number" name={`sp${i}`} value={s.share} onChange={v => setReport(r => { const arr=[...(r.digitalAds?.socialTrafficShare ?? [])]; arr[i]={...arr[i], share: parseFloat(v) || 0}; return { ...r, digitalAds: { ...(r.digitalAds!), socialTrafficShare:arr } } })} /></div>
                  <button type="button" className="col-span-1 h-[38px] flex items-center justify-center text-luxury-taupe hover:text-danger" onClick={() => setReport(r => { const arr=[...(r.digitalAds?.socialTrafficShare ?? [])]; arr.splice(i,1); return { ...r, digitalAds: { ...(r.digitalAds!), socialTrafficShare:arr } } })}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setReport(r => ({ ...r, digitalAds: { ...(r.digitalAds ?? { reportingPeriod:'', totalImpressions:0, totalClicks:0, byChannel:[], socialTrafficPeriod:'', socialTrafficShare:[] }), socialTrafficShare: [...(r.digitalAds?.socialTrafficShare ?? []), { channel:'', share:0 }] } }))} className="mt-2 flex items-center gap-2 text-sm text-luxury-gold hover:text-luxury-sand section-label">
              <Plus className="w-4 h-4" /> Add Channel
            </button>
          </div>
        </div>
      </SectionPanel>

      {/* === FEEDBACK === */}
      <SectionPanel title="Buyer & Broker Feedback" num="06">
        <div className="mt-4 space-y-4">
          <Field label="Common Objections"           name="objections"   value={report.feedback?.commonObjections ?? ''}   rows={3} onChange={v => setFeedback('commonObjections', v)} />
          <Field label="Pricing Feedback"            name="pricing"      value={report.feedback?.pricingFeedback ?? ''}    rows={3} onChange={v => setFeedback('pricingFeedback', v)} />
          <Field label="Layout Feedback"             name="layout"       value={report.feedback?.layoutFeedback ?? ''}     rows={3} onChange={v => setFeedback('layoutFeedback', v)} />
          <Field label="Competing Properties Mentioned" name="comps"     value={report.feedback?.competingProperties ?? ''} rows={2} onChange={v => setFeedback('competingProperties', v)} />
          <Field label="Broker Sentiment"            name="brokerSent"   value={report.feedback?.brokerSentiment ?? ''}    rows={3} onChange={v => setFeedback('brokerSentiment', v)} />
          <Field label="Recommended Adjustments"    name="adjustments"  value={report.feedback?.recommendedAdjustments ?? ''} rows={3} onChange={v => setFeedback('recommendedAdjustments', v)} />
        </div>
      </SectionPanel>

      {/* === MARKET ACTIVITY === */}
      <SectionPanel title="Market Activity" num="07">
        <div className="mt-4">
          <Field label="Neighborhood Trends" name="trends" value={report.marketActivity?.neighborhoodTrends ?? ''} rows={4} onChange={v => setMarketActivity('neighborhoodTrends', v)} />
          <p className="section-label text-luxury-taupe mt-6 mb-3">Note: Add comparable listings through the report editor (coming in v2). Manually enter below as text for now.</p>
        </div>
      </SectionPanel>

      {/* === STRATEGY === */}
      <SectionPanel title="Agent Strategy & Next Steps" num="08">
        <div className="mt-4 space-y-4">
          <div className="flex items-start justify-between gap-4 bg-luxury-off border border-luxury-cream p-4">
            <div>
              <p className="font-medium text-sm">AI Recommendations</p>
              <p className="text-xs text-luxury-taupe mt-0.5">
                Generate next-step recommendations from this week's metrics. Only empty fields are filled — your existing notes are preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={generateRecommendations}
              disabled={recStatus === 'loading'}
              className="h-[38px] px-4 bg-luxury-gold text-luxury-black text-xs whitespace-nowrap hover:bg-luxury-gold/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              {recStatus === 'loading' ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>Generate with AI</>
              )}
            </button>
          </div>
          {recMsg && (
            <p className={`text-xs ${recStatus === 'error' ? 'text-danger' : 'text-luxury-taupe'}`}>{recMsg}</p>
          )}
          <Field label="Key Recommendations (one per line)"      name="rec"      value={report.strategy?.keyRecommendations ?? ''}   rows={4} onChange={v => setStrategy('keyRecommendations', v)} />
          <Field label="Marketing Plan — Next Week (one per line)" name="mktplan" value={report.strategy?.marketingPlanNextWeek ?? ''} rows={4} onChange={v => setStrategy('marketingPlanNextWeek', v)} />
          <Field label="Pricing Strategy"                         name="pricing"  value={report.strategy?.pricingStrategy ?? ''}      rows={3} onChange={v => setStrategy('pricingStrategy', v)} />
          <Field label="Upcoming Campaigns (one per line)"        name="campaigns" value={report.strategy?.upcomingCampaigns ?? ''}   rows={3} onChange={v => setStrategy('upcomingCampaigns', v)} />
          <Field label="Broker Events (one per line)"             name="bkrevents" value={report.strategy?.brokerEvents ?? ''}        rows={3} onChange={v => setStrategy('brokerEvents', v)} />
          <Field label="Open Houses Planned (one per line)"       name="ohplanned" value={report.strategy?.openHousesPlanned ?? ''}   rows={3} onChange={v => setStrategy('openHousesPlanned', v)} />
        </div>
      </SectionPanel>

      {/* Save buttons */}
      <div className="flex items-center gap-3 pt-4 pb-12">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-luxury-black text-white text-sm hover:bg-luxury-dark transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Report
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 border border-luxury-black text-luxury-black text-sm hover:bg-luxury-off transition-colors"
        >
          <Eye className="w-4 h-4" />
          Save & View Report
        </button>
      </div>
    </div>
  )
}
