'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react'
import { Asset, AssetCategory, addAsset, deleteAsset, getAssets, CATEGORY_LABEL } from '@/lib/assets-store'

const CATEGORIES: AssetCategory[] = ['headshot', 'logo', 'listing', 'gallery', 'other']

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Add-form state
  const [form, setForm] = useState<{ name: string; url: string; category: AssetCategory }>({
    name: '', url: '', category: 'listing',
  })

  useEffect(() => { setAssets(getAssets()) }, [])

  const refresh = () => setAssets(getAssets())

  const filtered = activeCategory === 'all' ? assets : assets.filter(a => a.category === activeCategory)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.url.trim()) return
    addAsset({ name: form.name.trim(), url: form.url.trim(), category: form.category })
    setForm({ name: '', url: '', category: 'listing' })
    setShowAdd(false)
    refresh()
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this asset from your library?')) return
    deleteAsset(id)
    refresh()
  }

  async function handleCopy(asset: Asset) {
    try { await navigator.clipboard.writeText(asset.url) } catch {}
    setCopiedId(asset.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="min-h-screen bg-luxury-off">
      {/* Header */}
      <header className="bg-luxury-black text-white px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <div>
              <p className="section-label text-luxury-gold mb-0.5">Asset Library</p>
              <h1 className="font-serif-display text-2xl font-light">Headshots, Logos, Photos</h1>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-luxury-gold text-luxury-black text-sm font-medium hover:bg-luxury-sand transition-colors"
          >
            <Plus className="w-4 h-4" /> Add asset
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {(['all', ...CATEGORIES] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-xs section-label transition-colors border ${
                activeCategory === cat
                  ? 'bg-luxury-black text-luxury-gold border-luxury-black'
                  : 'bg-white text-luxury-taupe border-luxury-cream hover:border-luxury-sand'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABEL(cat as AssetCategory)}
              <span className="ml-2 text-luxury-taupe/60">
                {(cat === 'all' ? assets : assets.filter(a => a.category === cat)).length}
              </span>
            </button>
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white border border-luxury-cream p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="section-label text-luxury-taupe block mb-1.5">Name</label>
                <input
                  className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                  placeholder="e.g. 613 Baltic — Sunset"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="md:col-span-1">
                <label className="section-label text-luxury-taupe block mb-1.5">Category</label>
                <select
                  className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as AssetCategory })}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL(c)}</option>)}
                </select>
              </div>
              <div className="md:col-span-1 flex items-end gap-2">
                <button type="submit" className="flex-1 px-4 py-2 bg-luxury-black text-white text-sm hover:bg-luxury-dark">
                  Add
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-2 border border-luxury-cream text-sm text-luxury-taupe hover:bg-luxury-off">
                  Cancel
                </button>
              </div>
            </div>
            <div>
              <label className="section-label text-luxury-taupe block mb-1.5">URL</label>
              <input
                className="w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold"
                placeholder="/folder/image.jpg  or  https://example.com/image.jpg"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
              />
              <p className="text-xs text-luxury-taupe mt-2">
                Local files in <code className="bg-luxury-off px-1">/public</code> use a leading slash (e.g. <code className="bg-luxury-off px-1">/613-baltic-listing.jpg</code>).
                External URLs work too (Compass CDN, Google Drive direct links, Imgur, etc.).
              </p>
            </div>
          </form>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-luxury-cream">
            <ImageIcon className="w-10 h-10 text-luxury-cream mx-auto mb-3" />
            <p className="text-luxury-taupe text-sm">No assets in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(asset => (
              <div key={asset.id} className="bg-white border border-luxury-cream group">
                <div className="aspect-square overflow-hidden bg-luxury-beige relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.currentTarget
                      t.style.display = 'none'
                      const ph = t.parentElement?.querySelector('[data-ph]') as HTMLElement | null
                      if (ph) ph.style.display = 'flex'
                    }}
                  />
                  <div data-ph className="absolute inset-0 hidden items-center justify-center text-luxury-taupe/40 text-xs section-label">
                    URL unreachable
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate" title={asset.name}>{asset.name}</p>
                  <p className="section-label text-luxury-taupe mt-0.5">
                    {CATEGORY_LABEL(asset.category)}
                    {asset.bundled && <span className="text-luxury-gold ml-2">· bundled</span>}
                  </p>
                  <div className="flex items-center gap-1 mt-3">
                    <button onClick={() => handleCopy(asset)} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-luxury-taupe hover:text-luxury-black border border-luxury-cream hover:border-luxury-sand">
                      {copiedId === asset.id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy URL</>}
                    </button>
                    {!asset.bundled && (
                      <button onClick={() => handleDelete(asset.id)} className="px-2 py-1.5 text-luxury-taupe hover:text-danger border border-luxury-cream" title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help */}
        <div className="mt-12 p-5 bg-luxury-off border border-luxury-cream">
          <p className="section-label text-luxury-gold mb-2">How this works</p>
          <ul className="text-xs text-luxury-taupe leading-relaxed space-y-1">
            <li>• <span className="font-medium">Bundled</span> assets ship with the app (everyone sees them).</li>
            <li>• Assets you add live in your browser&apos;s local storage — useful while you&apos;re experimenting.</li>
            <li>• To share an asset with the team permanently, drop the file into <code className="bg-white px-1">/public/</code> and push (or paste a public URL anywhere — Compass CDN, Google Drive direct link, Imgur, etc.).</li>
            <li>• Use <span className="font-medium">Copy URL</span> on any asset and paste into the report editor&apos;s photo/logo fields.</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
