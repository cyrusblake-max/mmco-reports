'use client'
/**
 * /dashboard/branding — team branding defaults.
 * Applies to every NEW report created after saving. Existing reports keep the
 * branding they were created with (a rebrand never rewrites a sent report).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Check, RotateCcw } from 'lucide-react'
import { getBranding, saveBranding, resetBranding, DEFAULT_BRANDING, type BrandingSettings } from '@/lib/branding-store'
import ImageDrop from '@/components/dashboard/ImageDrop'

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_BRANDING)
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(getBranding())
    setLoaded(true)
  }, [])

  function set<K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
    setSaved(false)
  }
  function setAgent(key: string, value: string) {
    setSettings(s => ({ ...s, defaultAgent: { ...s.defaultAgent, [key]: value } }))
    setSaved(false)
  }

  function handleSave() {
    saveBranding(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    if (!window.confirm('Restore the default MM&Co branding? Your customizations will be removed.')) return
    resetBranding()
    setSettings(DEFAULT_BRANDING)
  }

  if (!loaded) return null

  const input = 'w-full bg-white border border-luxury-cream px-3 py-2 text-sm focus:outline-none focus:border-luxury-gold transition-colors'
  const label = 'section-label text-luxury-taupe block mb-1.5'

  return (
    <div className="min-h-screen bg-luxury-off">
      <header className="bg-luxury-black text-white px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm flex-shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <div className="min-w-0 flex-1">
            <p className="section-label text-luxury-gold" style={{ fontSize: '0.55rem' }}>MM&amp;Co · Settings</p>
            <p className="text-xs sm:text-sm font-light mt-0.5 text-white/80">Team Branding</p>
          </div>
          <button
            type="button" onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-luxury-gold text-luxury-black font-medium hover:bg-luxury-sand transition-colors flex-shrink-0"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <p className="text-xs text-luxury-taupe">
          These defaults are applied to every <span className="font-medium text-luxury-black">new</span> report.
          Reports you&rsquo;ve already created keep their existing branding, so nothing you&rsquo;ve sent changes.
        </p>

        <section className="bg-white border border-luxury-cream p-5 space-y-4">
          <p className="font-medium text-sm">Identity</p>
          <div>
            <label className={label}>Team Name</label>
            <input className={input} value={settings.teamName} onChange={e => set('teamName', e.target.value)} />
          </div>
          <ImageDrop label="Team Logo" value={settings.logoUrl} onChange={v => set('logoUrl', v)} placeholder="/mmco-logo.png" />
        </section>

        <section className="bg-white border border-luxury-cream p-5 space-y-4">
          <p className="font-medium text-sm">Default Listing Agent</p>
          <p className="text-xs text-luxury-taupe -mt-2">Pre-fills the agent block on new reports — editable per report.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={label}>Name</label><input className={input} value={settings.defaultAgent.name} onChange={e => setAgent('name', e.target.value)} /></div>
            <div><label className={label}>Title</label><input className={input} value={settings.defaultAgent.title} onChange={e => setAgent('title', e.target.value)} /></div>
            <div><label className={label}>Team</label><input className={input} value={settings.defaultAgent.team} onChange={e => setAgent('team', e.target.value)} /></div>
            <div><label className={label}>Brokerage</label><input className={input} value={settings.defaultAgent.brokerage} onChange={e => setAgent('brokerage', e.target.value)} /></div>
            <div><label className={label}>Phone</label><input className={input} value={settings.defaultAgent.phone} onChange={e => setAgent('phone', e.target.value)} /></div>
            <div><label className={label}>Email</label><input className={input} value={settings.defaultAgent.email} onChange={e => setAgent('email', e.target.value)} /></div>
          </div>
          <ImageDrop label="Headshot" value={settings.defaultAgent.photoUrl ?? ''} onChange={v => setAgent('photoUrl', v)} />
        </section>

        <section className="bg-white border border-luxury-cream p-5 space-y-4">
          <p className="font-medium text-sm">Report Footer</p>
          <div>
            <label className={label}>Footer Text</label>
            <textarea className={`${input} resize-y`} rows={2} value={settings.footerText} onChange={e => set('footerText', e.target.value)} />
          </div>
          <div>
            <label className={label}>Legal Disclaimer</label>
            <textarea className={`${input} resize-y`} rows={3} value={settings.disclaimer} onChange={e => set('disclaimer', e.target.value)} />
            <p className="text-xs text-luxury-taupe mt-1.5">Shown in fine print at the end of every report and PDF (Equal Housing Opportunity, license info, etc.).</p>
          </div>
        </section>

        <button
          type="button" onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs text-luxury-taupe border border-luxury-cream hover:border-danger/40 hover:text-danger transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restore defaults
        </button>
      </main>
    </div>
  )
}
