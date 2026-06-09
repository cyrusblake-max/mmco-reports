'use client'
import { useCallback, useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

interface Props {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
  /** Max display dimension per image (client-side resize keeps storage small). */
  maxSize?: number
  /** Max images allowed in the gallery. */
  maxCount?: number
}

/**
 * Drag-drop or click-to-upload gallery editor.
 * Multiple files can be dropped at once. Each is resized client-side and
 * appended as a JPEG data URL.
 */
export default function GalleryDrop({
  label, value, onChange, maxSize = 1200, maxCount = 12,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleFiles = useCallback(async (files: FileList) => {
    setBusy(true)
    setErr('')
    try {
      const images = Array.from(files).filter(f => f.type.startsWith('image/'))
      if (!images.length) { setErr('No images in dropped files'); return }
      const room = maxCount - value.length
      if (room <= 0) { setErr(`Gallery is full (max ${maxCount}).`); return }
      const toProcess = images.slice(0, room)
      const newUrls: string[] = []
      for (const f of toProcess) {
        try { newUrls.push(await resizeAndEncode(f, maxSize)) }
        catch { /* skip bad file */ }
      }
      if (newUrls.length) onChange([...value, ...newUrls])
      if (toProcess.length < images.length) setErr(`Only added ${room} — gallery full at ${maxCount} images.`)
    } finally {
      setBusy(false)
    }
  }, [maxCount, maxSize, value, onChange])

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function moveLeft(i: number) {
    if (i === 0) return
    const arr = [...value]
    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    onChange(arr)
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="section-label text-luxury-taupe">{label}</label>
        <span className="text-xs text-luxury-taupe/70">{value.length} / {maxCount}</span>
      </div>

      {/* Thumbnails grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-3">
          {value.map((src, i) => (
            <div key={i} className="relative group bg-luxury-off border border-luxury-cream aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-luxury-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => moveLeft(i)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-luxury-black/70 text-white flex items-center justify-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-luxury-gold hover:text-luxury-black"
                  title="Move left"
                >
                  ←
                </button>
              )}
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] section-label text-white bg-luxury-black/70">#{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {value.length < maxCount && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed py-6 text-center transition-colors ${
            dragOver ? 'border-luxury-gold bg-luxury-gold/5' : 'border-luxury-cream hover:border-luxury-sand bg-luxury-off'
          }`}
        >
          {busy ? (
            <Loader2 className="w-5 h-5 mx-auto text-luxury-gold animate-spin" />
          ) : (
            <>
              <Upload className={`w-5 h-5 mx-auto mb-1.5 ${dragOver ? 'text-luxury-gold' : 'text-luxury-taupe'}`} strokeWidth={1.5} />
              <p className="text-sm font-medium">Drop more photos here, or click to upload</p>
              <p className="text-xs text-luxury-taupe mt-1">Multiple selection OK — JPG, PNG, WebP, HEIC</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      )}
      {err && <p className="text-xs text-danger mt-2">{err}</p>}
    </div>
  )
}

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
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}
