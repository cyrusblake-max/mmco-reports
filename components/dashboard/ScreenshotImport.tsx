'use client'
/**
 * Screenshot import & review — the human-in-the-loop extraction pipeline.
 *
 * 1. Add files: camera capture, multi-select, drag-drop. JPG/PNG/WEBP/HEIC/PDF.
 * 2. Images are downscaled client-side (~1568px JPEG) before upload; exact
 *    duplicates are caught by content hash and never double-counted.
 * 3. /api/extract returns per-file structured metrics with confidence scores.
 * 4. Every metric renders beside its source screenshot: editable value,
 *    period type, target report field, include toggle. Low-confidence rows
 *    are flagged; two included rows aimed at the same report field block
 *    Apply until resolved. Nothing is written without approval.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Upload, Camera, X, Loader2, AlertTriangle, CheckCircle2, FileText,
  ScanSearch, ChevronUp, ChevronDown, Sparkles,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { WeeklyReport, WeeklyMetrics } from '@/lib/types'
import { METRIC_LABELS } from '@/lib/types'
import {
  type ExtractionResult, type ExtractionRecord, type ApprovedMetric,
  type MetricTarget, PLATFORM_LABELS, PERIOD_LABELS, PERIOD_TYPES,
  suggestTarget, applyExtractions,
} from '@/lib/extraction'

type ShotStatus = 'ready' | 'extracting' | 'done' | 'error' | 'duplicate'

interface Shot {
  id: string
  name: string
  mediaType: string
  /** Full-res-ish JPEG data URL used for preview + API upload (null for PDFs). */
  previewUrl: string | null
  /** Base64 payload (no prefix) sent to the API. */
  base64: string
  /** ~400px thumbnail kept in the report's provenance log. */
  thumb: string | null
  hash: string
  status: ShotStatus
  duplicateOfName?: string
  result?: ExtractionResult
  error?: string
}

/** Editable review row derived from one extracted metric. */
interface Row {
  include: boolean
  target: MetricTarget
  finalValue: number
}

interface Props {
  report: WeeklyReport
  onApply: (updated: WeeklyReport) => void
}

const METRIC_KEYS = Object.keys(METRIC_LABELS) as (keyof WeeklyMetrics)[]
const MAX_BATCH = 12

// ---------------------------------------------------------------------------
// File preparation
// ---------------------------------------------------------------------------

function djb2(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i += 7) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return (h >>> 0).toString(36) + ':' + str.length
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result as string)
    fr.onerror = () => reject(new Error('Could not read file'))
    fr.readAsDataURL(file)
  })
}

async function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('decode-failed'))
    el.src = dataUrl
  })
}

function drawToJpeg(img: HTMLImageElement, maxSize: number, quality: number): string {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

const isHeic = (f: File) =>
  /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name)

async function prepareFile(file: File): Promise<Omit<Shot, 'id' | 'status'>> {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    if (file.size > 8 * 1024 * 1024) throw new Error('PDF is over 8 MB — export a smaller PDF or screenshot the pages instead.')
    const dataUrl = await readAsDataUrl(file)
    const base64 = dataUrl.split(',')[1] ?? ''
    return { name: file.name, mediaType: 'application/pdf', previewUrl: null, base64, thumb: null, hash: djb2(base64) }
  }

  let dataUrl = await readAsDataUrl(file)
  let img: HTMLImageElement
  try {
    img = await decodeImage(dataUrl)
  } catch {
    if (!isHeic(file)) throw new Error('Could not read this image')
    // Safari decodes HEIC natively; other browsers need heic2any (lazy-loaded).
    const { default: heic2any } = await import('heic2any')
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    dataUrl = await readAsDataUrl(Array.isArray(out) ? out[0] : out)
    img = await decodeImage(dataUrl)
  }

  const full = drawToJpeg(img, 1568, 0.87)   // resolution Claude reads best
  const thumb = drawToJpeg(img, 400, 0.75)
  return {
    name: file.name,
    mediaType: 'image/jpeg',
    previewUrl: full,
    base64: full.split(',')[1] ?? '',
    thumb,
    hash: djb2(full.split(',')[1] ?? ''),
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ScreenshotImport({ report, onApply }: Props) {
  const [shots, setShots] = useState<Shot[]>([])
  const [rows, setRows] = useState<Record<string, Row>>({})   // key: shotId:metricIdx
  const [busy, setBusy] = useState(false)
  const [prepBusy, setPrepBusy] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setGlobalError('')
    setPrepBusy(true)
    const incoming = Array.from(files)
    for (const file of incoming) {
      try {
        const prepped = await prepareFile(file)
        setShots(prev => {
          if (prev.length >= MAX_BATCH) return prev
          const dup = prev.find(s => s.hash === prepped.hash)
          return [...prev, {
            ...prepped,
            id: uuidv4(),
            status: dup ? 'duplicate' : 'ready',
            duplicateOfName: dup?.name,
          }]
        })
      } catch (e) {
        setGlobalError(`${file.name}: ${e instanceof Error ? e.message : 'could not read file'}`)
      }
    }
    setPrepBusy(false)
  }, [])

  function removeShot(id: string) {
    setShots(prev => prev.filter(s => s.id !== id))
    setRows(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(id + ':'))))
  }

  function moveShot(id: string, dir: -1 | 1) {
    setShots(prev => {
      const i = prev.findIndex(s => s.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  // -- Extraction ----------------------------------------------------------
  async function runExtraction() {
    const pending = shots.filter(s => s.status === 'ready' || s.status === 'error')
    if (pending.length === 0) return
    setBusy(true)
    setGlobalError('')
    setShots(prev => prev.map(s => pending.some(p => p.id === s.id) ? { ...s, status: 'extracting', error: undefined } : s))

    // Batches of 4 keep each request comfortably under serverless body limits.
    for (let i = 0; i < pending.length; i += 4) {
      const batch = pending.slice(i, i + 4)
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: batch.map(s => ({ id: s.id, name: s.name, mediaType: s.mediaType, data: s.base64 })),
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `Extraction failed (${res.status})`)
        const byId = new Map<string, { ok: boolean; result?: ExtractionResult; error?: string }>(
          (json.results as { fileId: string; ok: boolean; result?: ExtractionResult; error?: string }[]).map(r => [r.fileId, r]),
        )
        setShots(prev => prev.map(s => {
          const r = byId.get(s.id)
          if (!r) return s
          return r.ok && r.result
            ? { ...s, status: 'done', result: r.result }
            : { ...s, status: 'error', error: r.error || 'Extraction failed' }
        }))
        // Seed review rows for each newly-extracted metric
        setRows(prev => {
          const next = { ...prev }
          for (const s of batch) {
            const r = byId.get(s.id)
            if (!r?.ok || !r.result) continue
            r.result.metrics.forEach((m, idx) => {
              const target = suggestTarget(r.result!.sourcePlatform, m.normalizedMetric)
              next[`${s.id}:${idx}`] = {
                // Flagged rows start unchecked — the reviewer must opt in.
                include: target !== 'skip' && !m.requiresReview && m.periodType !== 'lifetime',
                target,
                finalValue: m.value,
              }
            })
          }
          return next
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Extraction failed'
        setGlobalError(msg)
        setShots(prev => prev.map(s => batch.some(b => b.id === s.id) ? { ...s, status: 'error', error: msg } : s))
      }
    }
    setBusy(false)
  }

  // -- Review derived state ------------------------------------------------
  const doneShots = shots.filter(s => s.status === 'done' && s.result)

  const conflicts = useMemo(() => {
    const byTarget = new Map<string, string[]>()   // target -> ["ShotName · Label"]
    for (const s of doneShots) {
      s.result!.metrics.forEach((m, idx) => {
        const row = rows[`${s.id}:${idx}`]
        if (!row?.include || row.target === 'skip') return
        const list = byTarget.get(row.target) ?? []
        list.push(`${PLATFORM_LABELS[s.result!.sourcePlatform]} · ${m.originalLabel}`)
        byTarget.set(row.target, list)
      })
    }
    return [...byTarget.entries()].filter(([, list]) => list.length > 1)
  }, [doneShots, rows])

  const includedCount = Object.values(rows).filter(r => r.include && r.target !== 'skip').length

  function setRow(key: string, patch: Partial<Row>) {
    setRows(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  // -- Apply ---------------------------------------------------------------
  function handleApply() {
    if (conflicts.length > 0 || includedCount === 0) return
    const records: ExtractionRecord[] = doneShots.map(s => {
      const metrics: ApprovedMetric[] = s.result!.metrics
        .map((m, idx): ApprovedMetric | null => {
          const row = rows[`${s.id}:${idx}`]
          if (!row?.include || row.target === 'skip') return null
          return { ...m, target: row.target, finalValue: row.finalValue, corrected: row.finalValue !== m.value }
        })
        .filter((m): m is ApprovedMetric => m !== null)
      return {
        id: uuidv4(),
        fileName: s.name,
        importedAt: new Date().toISOString(),
        sourcePlatform: s.result!.sourcePlatform,
        reportType: s.result!.reportType,
        periodLabel: s.result!.reportingPeriod.label
          ?? (s.result!.reportingPeriod.startDate ? `${s.result!.reportingPeriod.startDate} – ${s.result!.reportingPeriod.endDate ?? ''}` : null),
        thumbnail: s.thumb ?? undefined,
        metrics,
        warnings: s.result!.warnings,
      }
    }).filter(r => r.metrics.length > 0)
    onApply(applyExtractions(report, records))
  }

  const canExtract = shots.some(s => s.status === 'ready' || s.status === 'error')

  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-28">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed p-6 sm:p-10 text-center transition-colors ${
          dragOver ? 'border-luxury-gold bg-luxury-gold/5' : 'border-luxury-cream bg-white'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files) }}
      >
        <ScanSearch className="w-8 h-8 text-luxury-gold mx-auto mb-3" strokeWidth={1.25} />
        <p className="font-serif-display text-xl text-luxury-black mb-1">Add analytics screenshots</p>
        <p className="text-xs text-luxury-taupe mb-5 max-w-md mx-auto">
          Compass, StreetEasy, Zillow, Instagram, email reports — JPG, PNG, WEBP, HEIC, or PDF.
          Up to {MAX_BATCH} files. Numbers are extracted for your review; nothing is saved until you approve it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={prepBusy}
            className="inline-flex items-center gap-2 px-5 py-3 bg-luxury-black text-white text-sm hover:bg-luxury-dark transition-colors disabled:opacity-50"
          >
            {prepBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Choose files
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={prepBusy}
            className="sm:hidden inline-flex items-center gap-2 px-5 py-3 border border-luxury-black text-luxury-black text-sm hover:bg-luxury-off transition-colors disabled:opacity-50"
          >
            <Camera className="w-4 h-4" /> Take photo
          </button>
        </div>
        <input
          ref={fileRef} type="file" multiple className="hidden"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf,.heic,.heif,.pdf"
          onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
        />
        <input
          ref={cameraRef} type="file" className="hidden" accept="image/*" capture="environment"
          onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {globalError && (
        <div className="flex items-start gap-2 bg-danger/5 border border-danger/30 text-danger text-xs p-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {globalError}
        </div>
      )}

      {/* File cards */}
      {shots.map((s, i) => (
        <div key={s.id} className="bg-white border border-luxury-cream">
          {/* Card header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-luxury-cream/70">
            <span className="section-label text-luxury-taupe flex-shrink-0" style={{ fontSize: '0.58rem' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="text-xs font-medium text-luxury-black truncate flex-1">{s.name}</p>
            <StatusBadge shot={s} />
            <div className="flex items-center flex-shrink-0">
              <button type="button" disabled={i === 0} onClick={() => moveShot(s.id, -1)} className="p-1.5 text-luxury-taupe hover:text-luxury-black disabled:opacity-30" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" disabled={i === shots.length - 1} onClick={() => moveShot(s.id, 1)} className="p-1.5 text-luxury-taupe hover:text-luxury-black disabled:opacity-30" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => removeShot(s.id)} className="p-1.5 text-luxury-taupe hover:text-danger" title="Remove"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-0">
            {/* Preview */}
            <div className="border-b md:border-b-0 md:border-r border-luxury-cream/70 bg-luxury-off flex items-center justify-center p-3">
              {s.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.previewUrl} alt={s.name}
                  onClick={() => setLightbox(s.previewUrl)}
                  className="max-h-52 md:max-h-64 w-auto object-contain cursor-zoom-in shadow-sm"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-luxury-taupe">
                  <FileText className="w-8 h-8" strokeWidth={1.25} />
                  <span className="text-xs">PDF document</span>
                </div>
              )}
            </div>

            {/* Extraction detail */}
            <div className="p-4">
              {s.status === 'duplicate' && (
                <p className="text-xs text-luxury-taupe flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-luxury-gold" />
                  Exact duplicate of <span className="font-medium">{s.duplicateOfName}</span> — excluded so nothing is double-counted. Remove it, or remove the original.
                </p>
              )}
              {s.status === 'ready' && <p className="text-xs text-luxury-taupe">Ready to extract.</p>}
              {s.status === 'extracting' && (
                <p className="text-xs text-luxury-taupe flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-luxury-gold" /> Reading screenshot…</p>
              )}
              {s.status === 'error' && <p className="text-xs text-danger">{s.error}</p>}

              {s.status === 'done' && s.result && (
                <div className="space-y-3">
                  {/* Source + period line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-luxury-black text-white section-label" style={{ fontSize: '0.55rem' }}>
                      {PLATFORM_LABELS[s.result.sourcePlatform]}
                    </span>
                    <span className="text-luxury-taupe">
                      {s.result.reportingPeriod.label
                        || (s.result.reportingPeriod.startDate
                          ? `${s.result.reportingPeriod.startDate} – ${s.result.reportingPeriod.endDate ?? '…'}`
                          : 'No date range detected')}
                    </span>
                  </div>

                  {s.result.warnings.length > 0 && (
                    <ul className="space-y-1">
                      {s.result.warnings.map((w, wi) => (
                        <li key={wi} className="flex items-start gap-1.5 text-xs text-luxury-gold">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {w}
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.result.metrics.length === 0 && (
                    <p className="text-xs text-luxury-taupe">No metrics found in this file.</p>
                  )}

                  {/* Metric rows */}
                  {s.result.metrics.map((m, idx) => {
                    const key = `${s.id}:${idx}`
                    const row = rows[key]
                    if (!row) return null
                    const flagged = m.requiresReview || m.confidence < 0.85
                    return (
                      <div key={key} className={`border p-3 space-y-2 ${row.include ? 'border-luxury-gold/40 bg-luxury-gold/[0.03]' : 'border-luxury-cream'}`}>
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox" checked={row.include}
                            onChange={e => setRow(key, { include: e.target.checked })}
                            className="accent-luxury-gold w-4 h-4 mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-medium text-luxury-black">{m.originalLabel}</span>
                              <ConfidenceBadge confidence={m.confidence} flagged={flagged} />
                              <span className={`text-xs px-1.5 py-0.5 border ${
                                m.periodType === 'lifetime' ? 'border-luxury-gold text-luxury-gold' :
                                m.periodType === 'unknown' ? 'border-danger/40 text-danger' :
                                'border-luxury-cream text-luxury-taupe'
                              }`}>
                                {PERIOD_LABELS[m.periodType]}
                              </span>
                            </div>
                            <p className="text-xs text-luxury-taupe mt-1">{m.evidenceDescription}</p>
                            {m.periodType === 'lifetime' && row.include && row.target !== 'skip' && (
                              <p className="text-xs text-luxury-gold mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                Lifetime total — importing this into a weekly field may overstate the period.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          <div>
                            <label className="section-label text-luxury-taupe block mb-1" style={{ fontSize: '0.55rem' }}>Value {row.finalValue !== m.value && <span className="text-luxury-gold">(corrected from {m.value.toLocaleString()})</span>}</label>
                            <input
                              type="number" inputMode="numeric" value={row.finalValue}
                              onChange={e => setRow(key, { finalValue: Number(e.target.value) || 0 })}
                              className="w-full bg-white border border-luxury-cream px-3 py-2.5 text-sm focus:outline-none focus:border-luxury-gold"
                            />
                          </div>
                          <div>
                            <label className="section-label text-luxury-taupe block mb-1" style={{ fontSize: '0.55rem' }}>Import into</label>
                            <select
                              value={row.target}
                              onChange={e => setRow(key, { target: e.target.value as MetricTarget })}
                              className="w-full bg-white border border-luxury-cream px-2 py-2.5 text-sm focus:outline-none focus:border-luxury-gold"
                            >
                              <option value="skip">Don&rsquo;t import (keep for reference)</option>
                              {METRIC_KEYS.map(k => (
                                <option key={k} value={k}>{METRIC_LABELS[k]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-danger/5 border border-danger/30 p-4 space-y-1.5">
          <p className="text-xs font-medium text-danger flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Two extracted numbers target the same report field — uncheck one or change its destination:
          </p>
          {conflicts.map(([target, list]) => (
            <p key={target} className="text-xs text-danger/80 pl-5">
              <span className="font-medium">{METRIC_LABELS[target as keyof WeeklyMetrics]}</span>: {list.join('  ·  ')}
            </p>
          ))}
        </div>
      )}

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-luxury-cream px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <p className="text-xs text-luxury-taupe flex-1 min-w-0 truncate">
            {shots.length === 0
              ? 'No files added yet'
              : doneShots.length > 0
                ? `${includedCount} metric${includedCount === 1 ? '' : 's'} approved for import`
                : `${shots.filter(sh => sh.status !== 'duplicate').length} file${shots.length === 1 ? '' : 's'} ready`}
          </p>
          {canExtract && (
            <button
              type="button" onClick={runExtraction} disabled={busy || prepBusy}
              className="inline-flex items-center gap-2 px-5 py-3 bg-luxury-black text-white text-sm hover:bg-luxury-dark transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? 'Extracting…' : 'Extract metrics'}
            </button>
          )}
          {doneShots.length > 0 && !canExtract && (
            <button
              type="button" onClick={handleApply}
              disabled={busy || conflicts.length > 0 || includedCount === 0}
              className="inline-flex items-center gap-2 px-5 py-3 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" /> Apply to report
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-luxury-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Screenshot preview" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}

function StatusBadge({ shot }: { shot: Shot }) {
  const map: Record<ShotStatus, { text: string; cls: string }> = {
    ready:      { text: 'Ready',       cls: 'text-luxury-taupe border-luxury-cream' },
    extracting: { text: 'Reading…',    cls: 'text-luxury-gold border-luxury-gold/40' },
    done:       { text: 'Extracted',   cls: 'text-luxury-black border-luxury-gold bg-luxury-gold/10' },
    error:      { text: 'Failed',      cls: 'text-danger border-danger/40' },
    duplicate:  { text: 'Duplicate',   cls: 'text-luxury-gold border-luxury-gold/40' },
  }
  const { text, cls } = map[shot.status]
  return <span className={`text-xs px-2 py-0.5 border flex-shrink-0 ${cls}`}>{text}</span>
}

function ConfidenceBadge({ confidence, flagged }: { confidence: number; flagged: boolean }) {
  const pct = Math.round(confidence * 100)
  return (
    <span className={`text-xs px-1.5 py-0.5 border ${
      flagged ? 'border-danger/40 text-danger' : pct >= 95 ? 'border-luxury-cream text-luxury-taupe' : 'border-luxury-gold/50 text-luxury-gold'
    }`}>
      {flagged ? `Check · ${pct}%` : `${pct}%`}
    </span>
  )
}
