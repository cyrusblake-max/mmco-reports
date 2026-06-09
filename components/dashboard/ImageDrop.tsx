'use client'
import { useCallback, useRef, useState } from 'react'
import { Upload, X, Link as LinkIcon, Loader2 } from 'lucide-react'

interface Props {
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  /** Max display dimension. Image is resized client-side so the data URL stays small. */
  maxSize?: number
}

/**
 * Headshot / image picker.
 * - Drag-drop OR click-to-upload OR paste URL
 * - Local files are resized client-side via canvas and encoded as JPEG data URL
 *   so headshots stay around 30-60 KB and don't bloat the report JSON
 */
export default function ImageDrop({
  label, value, onChange, placeholder = '/file.jpg or https://...', maxSize = 400,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErr('Not an image file')
      return
    }
    setBusy(true)
    setErr('')
    try {
      const url = await resizeAndEncode(file, maxSize)
      onChange(url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not read image')
    } finally {
      setBusy(false)
    }
  }, [maxSize, onChange])

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div>
      <label className="section-label text-luxury-taupe block mb-1.5">{label}</label>
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div
          className={`flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-dashed flex items-center justify-center transition-colors ${
            dragOver ? 'border-luxury-gold bg-luxury-gold/10' : 'border-luxury-cream bg-luxury-off'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {busy ? (
            <Loader2 className="w-5 h-5 text-luxury-gold animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-5 h-5 text-luxury-taupe" strokeWidth={1.5} />
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs section-label text-luxury-gold border border-luxury-cream hover:border-luxury-sand transition-colors"
              disabled={busy}
            >
              <Upload className="w-3 h-3" /> Upload
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs section-label text-luxury-taupe hover:text-danger border border-luxury-cream hover:border-danger/40 transition-colors"
                title="Remove"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
              className="hidden"
            />
          </div>
          <div className="relative">
            <LinkIcon className="w-3 h-3 text-luxury-taupe absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`or paste URL — ${placeholder}`}
              value={value && value.startsWith('data:') ? '(uploaded file — clear to replace with a URL)' : value}
              onChange={e => onChange(e.target.value)}
              readOnly={value.startsWith('data:')}
              className={`w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-luxury-cream focus:outline-none focus:border-luxury-gold ${
                value.startsWith('data:') ? 'text-luxury-taupe italic' : ''
              }`}
            />
          </div>
          {err && <p className="text-xs text-danger">{err}</p>}
          <p className="text-xs text-luxury-taupe/70">Drag &amp; drop a file onto the circle, or paste any direct image URL.</p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Client-side resize + JPEG encode → base64 data URL.
// Keeps headshots well under 100 KB so the report JSON stays portable.
// ---------------------------------------------------------------------------
async function resizeAndEncode(file: File, maxSize: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader()
    fr.onload  = () => resolve(fr.result as string)
    fr.onerror = () => reject(new Error('Could not read file'))
    fr.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload  = () => resolve(el)
    el.onerror = () => reject(new Error('Could not decode image'))
    el.src = dataUrl
  })

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.round(img.width  * scale)
  const h = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.fillStyle = '#FFFFFF'      // background for transparent PNGs
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}
