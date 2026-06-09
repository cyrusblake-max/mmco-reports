'use client'
import { useCallback, useRef, useState } from 'react'
import { Upload, Check, X, Sparkles, AlertCircle, Loader2 } from 'lucide-react'

// What the /api/ai/extract endpoint returns
export interface ExtractedPayload {
  type: string
  extracted: Record<string, unknown>
  confidence: 'high' | 'medium' | 'low'
  notes: string
}

interface Props {
  onApply: (payload: ExtractedPayload) => void
}

const TYPE_LABEL: Record<string, string> = {
  compass_insights:       'Compass Insights',
  digital_ads:            'Digital Ads Report',
  social_traffic:         'Social Traffic Share',
  open_house_attendance:  'Open House Attendance',
  publisher_breakdown:    'Top Publishers',
  social_media_stats:     'Social Media Stats',
  unknown:                'Unrecognized Content',
}

export default function AIImport({ onApply }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [result, setResult] = useState<ExtractedPayload | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const [filename, setFilename] = useState('')

  const handleFile = useCallback(async (file: File) => {
    setStatus('loading')
    setResult(null)
    setErrorMsg('')
    setFilename(file.name)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/ai/extract', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? `Server returned ${res.status}`)
        setErrorDetail(typeof data.detail === 'string' ? data.detail : '')
        return
      }
      setResult(data as ExtractedPayload)
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed')
      setErrorDetail('')
    }
  }, [])

  function reset() {
    setStatus('idle')
    setResult(null)
    setErrorMsg('')
    setErrorDetail('')
    setFilename('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="border border-luxury-cream bg-white p-6 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-luxury-gold" />
            AI Drop Zone
          </p>
          <p className="text-xs text-luxury-taupe mt-0.5">
            Drop a Compass Insights screenshot, ad-report PDF, or social-metrics image —
            AI reads the numbers and proposes them for this week&apos;s report.
          </p>
        </div>
        {status !== 'idle' && (
          <button
            type="button"
            onClick={reset}
            className="p-1 text-luxury-taupe hover:text-luxury-black"
            title="Reset"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {status === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) handleFile(f)
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed transition-colors p-8 text-center ${
            dragOver ? 'border-luxury-gold bg-luxury-gold/5' : 'border-luxury-cream hover:border-luxury-sand bg-luxury-off'
          }`}
        >
          <Upload className={`w-7 h-7 mx-auto mb-3 ${dragOver ? 'text-luxury-gold' : 'text-luxury-taupe'}`} strokeWidth={1.5} />
          <p className="text-sm font-medium">Drop a file here, or click to upload</p>
          <p className="text-xs text-luxury-taupe mt-1">PNG, JPG, WebP, HEIC, or PDF · max 18 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif,application/pdf"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
            className="hidden"
          />
        </div>
      )}

      {status === 'loading' && (
        <div className="border border-luxury-cream bg-luxury-off p-6 text-center">
          <Loader2 className="w-6 h-6 mx-auto mb-3 text-luxury-gold animate-spin" />
          <p className="text-sm text-luxury-taupe">Reading <span className="font-medium text-luxury-black">{filename}</span>…</p>
          <p className="text-xs text-luxury-taupe/70 mt-1">Usually takes 3–10 seconds.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-danger">Couldn&apos;t extract data</p>
              <p className="text-xs text-luxury-taupe mt-1 break-words">{errorMsg}</p>
              {errorDetail && (
                <pre className="text-[10px] text-luxury-taupe/80 mt-2 p-2 bg-white border border-luxury-cream overflow-auto max-h-40 whitespace-pre-wrap break-words font-mono">
                  {errorDetail}
                </pre>
              )}
              <button type="button" onClick={reset} className="text-xs section-label text-luxury-gold hover:text-luxury-sand mt-2">
                try again
              </button>
            </div>
          </div>
        </div>
      )}

      {status === 'ready' && result && (
        <div className="border border-luxury-gold/30 bg-luxury-gold/5 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="section-label text-luxury-gold">
                Detected · {TYPE_LABEL[result.type] ?? result.type}
                <span className="ml-2 text-luxury-taupe">· {result.confidence} confidence</span>
              </p>
              <p className="text-sm mt-1.5 leading-relaxed">{result.notes}</p>
              <p className="text-xs text-luxury-taupe mt-1.5">from <span className="font-medium">{filename}</span></p>
            </div>
          </div>

          <div className="border-t border-luxury-cream pt-3 mb-4 max-h-72 overflow-auto">
            <p className="section-label text-luxury-taupe mb-2">Extracted Fields</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {Object.entries(result.extracted).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-luxury-cream/60 py-1.5">
                  <dt className="section-label text-luxury-taupe truncate" style={{ fontSize: '0.55rem' }}>{k}</dt>
                  <dd className="font-mono text-luxury-black truncate" title={typeof v === 'object' ? JSON.stringify(v) : String(v)}>
                    {typeof v === 'object' ? `${Array.isArray(v) ? v.length + ' items' : 'object'}` : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { onApply(result); reset() }}
              className="flex items-center gap-1.5 px-4 py-2 bg-luxury-black text-white text-xs hover:bg-luxury-dark transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Apply to report
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 border border-luxury-cream text-xs text-luxury-taupe hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-luxury-taupe/70 mt-3 italic">Existing values are preserved — only empty fields and matching new fields are filled.</p>
        </div>
      )}
    </div>
  )
}
