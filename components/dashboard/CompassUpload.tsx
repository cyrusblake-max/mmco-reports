'use client'
import { useCallback, useRef, useState } from 'react'
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Loader2, X, Info,
} from 'lucide-react'
import {
  extractTextFromPdf, parseCompassText,
  type ParsedCompassData,
} from '@/lib/compass-parser'
import { WeeklyMetrics, METRIC_LABELS } from '@/lib/types'
import { formatNumber } from '@/lib/utils'

interface Props {
  onApply: (data: ParsedCompassData) => void
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'High confidence — most fields extracted',   color: 'text-success',     dot: 'bg-success' },
  medium: { label: 'Medium confidence — some fields extracted', color: 'text-luxury-gold', dot: 'bg-luxury-gold' },
  low:    { label: 'Low confidence — few fields extracted',     color: 'text-danger',      dot: 'bg-danger' },
}

type Stage = 'idle' | 'parsing' | 'done' | 'error'

export default function CompassUpload({ onApply }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging,     setDragging]     = useState(false)
  const [stage,        setStage]        = useState<Stage>('idle')
  const [error,        setError]        = useState<string | null>(null)
  const [fileName,     setFileName]     = useState<string | null>(null)
  const [parsed,       setParsed]       = useState<ParsedCompassData | null>(null)
  const [showRaw,      setShowRaw]      = useState(false)
  const [showSources,  setShowSources]  = useState(false)
  const [applied,      setApplied]      = useState(false)

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }
    reset()
    setFileName(file.name)
    setStage('parsing')

    try {
      const { lines, rawText } = await extractTextFromPdf(file)
      const result = parseCompassText(lines, rawText)
      setParsed(result)
      setStage('done')
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Could not read the PDF — ${msg}`)
      setStage('error')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function handleApply() {
    if (!parsed) return
    onApply(parsed)
    setApplied(true)
  }

  function reset() {
    setStage('idle')
    setError(null)
    setFileName(null)
    setParsed(null)
    setShowRaw(false)
    setShowSources(false)
    setApplied(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const metricEntries = parsed
    ? (Object.entries(parsed.metrics) as [keyof WeeklyMetrics, number][]).filter(([, v]) => v > 0)
    : []

  return (
    <div className="border border-luxury-gold/30 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-luxury-cream bg-luxury-off">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-luxury-black flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-luxury-gold" />
          </div>
          <div>
            <p className="font-medium text-sm">Compass Report Import</p>
            <p className="text-luxury-taupe text-xs">Upload your Compass seller PDF to auto-fill metrics</p>
          </div>
        </div>
        {stage !== 'idle' && (
          <button onClick={reset} className="text-luxury-taupe hover:text-luxury-black transition-colors ml-4 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6">

        {/* ── IDLE ── */}
        {stage === 'idle' && (
          <div
            className={`relative border-2 border-dashed cursor-pointer transition-colors ${
              dragging ? 'border-luxury-gold bg-luxury-gold/5' : 'border-luxury-cream hover:border-luxury-sand'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Upload className={`w-8 h-8 mb-3 transition-colors ${dragging ? 'text-luxury-gold' : 'text-luxury-cream'}`} />
              <p className="font-medium text-sm mb-1">Drop your Compass seller report here</p>
              <p className="text-luxury-taupe text-xs">Drag & drop or click to browse — PDF only</p>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {stage === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 text-luxury-gold animate-spin" />
            <p className="text-sm text-luxury-taupe">Reading PDF and extracting metrics…</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {stage === 'error' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger">Import failed</p>
              <p className="text-xs text-danger/70 mt-0.5">{error}</p>
              <button onClick={reset} className="text-xs text-luxury-taupe underline mt-2">Try another file</button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {stage === 'done' && parsed && (
          <div className="space-y-5">

            {/* File + confidence */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-luxury-taupe flex-shrink-0" />
                <span className="text-sm text-luxury-taupe truncate max-w-[260px]">{fileName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CONFIDENCE_CONFIG[parsed.confidence].dot}`} />
                <span className={`section-label ${CONFIDENCE_CONFIG[parsed.confidence].color}`}>
                  {CONFIDENCE_CONFIG[parsed.confidence].label}
                </span>
              </div>
            </div>

            {/* Address / price detected */}
            {(parsed.address || parsed.price) && (
              <div className="bg-luxury-off border border-luxury-cream px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parsed.address && (
                  <div>
                    <p className="section-label text-luxury-taupe mb-1">Address detected</p>
                    <p className="text-sm font-medium">{parsed.address}</p>
                  </div>
                )}
                {parsed.price && (
                  <div>
                    <p className="section-label text-luxury-taupe mb-1">Price detected</p>
                    <p className="text-sm font-medium">${parsed.price.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {/* Extracted metrics */}
            {metricEntries.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="section-label text-luxury-taupe">
                    {metricEntries.length} of 13 metrics extracted
                  </p>
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-1 section-label text-luxury-taupe hover:text-luxury-black transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    {showSources ? 'hide' : 'show'} sources
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-luxury-cream">
                  {metricEntries.map(([key, value]) => (
                    <div key={key} className="bg-white px-4 py-3">
                      <p className="section-label text-luxury-taupe leading-tight mb-1.5" style={{ fontSize: '0.58rem' }}>
                        {METRIC_LABELS[key]}
                      </p>
                      <p className="font-serif-display text-2xl font-light">{formatNumber(value, value >= 10_000)}</p>
                      {showSources && parsed.fieldSources[key] && (
                        <p className="text-luxury-taupe/60 text-xs mt-1 font-mono truncate" title={parsed.fieldSources[key]}>
                          "{parsed.fieldSources[key].slice(0, 40)}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {metricEntries.length < 13 && (
                  <p className="text-xs text-luxury-taupe mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {13 - metricEntries.length} field{13 - metricEntries.length !== 1 ? 's' : ''} not found — enter them manually in Section 02 below.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-luxury-off border border-luxury-cream p-5 text-center">
                <p className="text-sm text-luxury-taupe">No metrics could be automatically extracted.</p>
                <p className="text-xs text-luxury-taupe/60 mt-1">Use the raw text view below to find values and enter them manually.</p>
              </div>
            )}

            {/* Apply button */}
            <div className="flex items-center gap-3 pt-1 border-t border-luxury-cream">
              {!applied ? (
                <>
                  <button
                    onClick={handleApply}
                    className="flex items-center gap-2 px-5 py-2.5 bg-luxury-black text-white text-sm hover:bg-luxury-dark transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Apply to Report
                  </button>
                  <button onClick={reset} className="text-sm text-luxury-taupe hover:text-luxury-black transition-colors">
                    Cancel
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Applied — review the metrics in Section 02 and adjust any values as needed.
                </div>
              )}
            </div>

            {/* Raw text */}
            <div className="border-t border-luxury-cream pt-3">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex items-center gap-2 section-label text-luxury-taupe hover:text-luxury-black transition-colors"
              >
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? 'Hide' : 'Show'} extracted text ({parsed.lines.length} lines)
              </button>
              {showRaw && (
                <textarea
                  readOnly
                  value={parsed.rawText}
                  rows={14}
                  className="mt-3 w-full bg-luxury-off border border-luxury-cream px-3 py-2 text-xs font-mono text-luxury-taupe resize-y focus:outline-none"
                />
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
