import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'

const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
]

function findChrome(): string {
  // Allow override
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  // Fall back to first known path; if none of these exist puppeteer.launch will throw.
  return CHROME_PATHS[0]
}

// Same DOM manipulation as our verified gen-pdf.mjs pipeline — hides the dev nav,
// compresses sectional padding, lets natural page breaks happen, and (critically)
// moves the agent contact out of the strategy section into its own dark wrapper
// so Chrome paints its background correctly on continuation pages.
const TUNE_SCRIPT = `
  document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none')
  document.querySelectorAll('.numeral-outline').forEach(el => el.style.display = 'none')

  document.querySelectorAll('.section-mast').forEach(mast => {
    mast.style.marginBottom = '1rem'
    const inner = mast.querySelector('div > div')
    if (inner) inner.style.paddingTop = '0.25rem'
  })

  document.querySelectorAll('.report-section, .report-section-beige, .report-section-ivory')
    .forEach(el => el.style.padding = '1.5rem 0')
  document.querySelectorAll('.report-section-dark').forEach(el => {
    el.style.padding = '1.5rem 0'
    el.style.backgroundColor = '#1E1F19'
  })

  document.querySelectorAll('.text-center.mb-10').forEach(el => {
    el.style.paddingTop = '1.75rem'
    el.style.paddingBottom = '1.75rem'
  })
  document.querySelectorAll('.py-28').forEach(el => {
    el.style.paddingTop = '0'
    el.style.paddingBottom = '0'
  })
  document.querySelectorAll('.mt-16').forEach(el => el.style.marginTop = '1rem')
  document.querySelectorAll('.mb-16').forEach(el => el.style.marginBottom = '1rem')
  document.querySelectorAll('.mb-12').forEach(el => el.style.marginBottom = '0.75rem')
  document.querySelectorAll('.mb-10').forEach(el => el.style.marginBottom = '0.6rem')

  document.querySelectorAll('.print-page-break').forEach(el => {
    el.style.pageBreakBefore = 'auto'
    el.style.breakBefore = 'auto'
  })

  document.body.style.webkitPrintColorAdjust = 'exact'
  document.body.style.printColorAdjust = 'exact'

  document.querySelectorAll('.pt-12').forEach(el => el.style.paddingTop = '0.75rem')

  const allDark = document.querySelectorAll('.report-section-dark')
  const strategySection = allDark[allDark.length - 1]
  if (strategySection) {
    strategySection.style.paddingBottom = '0'
    strategySection.style.backgroundColor = '#1E1F19'
    const strategyInner = strategySection.querySelector('.max-w-6xl')
    if (strategyInner) strategyInner.style.backgroundColor = '#1E1F19'
  }

  // Move agent contact out of strategy section into its own dark wrapper before any colophon
  const agentContactFlex = strategySection
    ? strategySection.querySelector('.flex.items-center.justify-between')
    : null
  if (agentContactFlex && agentContactFlex.parentNode) {
    agentContactFlex.style.marginTop = '0'
    agentContactFlex.style.paddingTop = '1rem'
    agentContactFlex.style.breakInside = 'avoid'
    agentContactFlex.style.pageBreakInside = 'avoid'
    agentContactFlex.parentNode.removeChild(agentContactFlex)

    const sigOuter = document.createElement('div')
    sigOuter.style.cssText = 'background-color:#1E1F19;color:#FAFAF7;padding:0;break-inside:avoid;page-break-inside:avoid;'
    const sigInner = document.createElement('div')
    sigInner.style.cssText = 'max-width:72rem;margin:0 auto;padding:0 3rem;'
    sigInner.appendChild(agentContactFlex)
    sigOuter.appendChild(sigInner)
    strategySection.parentNode.insertBefore(sigOuter, strategySection.nextSibling)
  }

  document.querySelectorAll('.overflow-hidden').forEach(el => el.style.overflow = 'visible')

  // Keep chart label + chart together; tighten heights — but only for line/bar/area
  // charts, NOT pie/donut charts (their radii get clipped if forced smaller).
  document.querySelectorAll('.recharts-responsive-container').forEach(el => {
    const isPie = !!el.querySelector('.recharts-pie, .recharts-radar')
    if (!isPie) el.style.height = '160px'
    let wrapper = el.closest('.bg-white.border') || el.parentElement
    if (wrapper && wrapper.parentElement &&
        !wrapper.parentElement.matches('section, [class*="report-section"]')) {
      wrapper = wrapper.parentElement
    }
    if (wrapper) {
      wrapper.style.pageBreakInside = 'avoid'
      wrapper.style.breakInside = 'avoid'
    }
  })

  // Keep aggregate tiles together (label + value)
  document.querySelectorAll('.grid .bg-white.border').forEach(tile => {
    tile.style.breakInside = 'avoid'
    tile.style.pageBreakInside = 'avoid'
  })
`

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Puppeteer is on the same host as Next.js — always hit the local dev server directly.
  // Going through any public proxy (cloudflared, ngrok, etc.) introduces SSL/protocol
  // mismatches like ERR_SSL_PROTOCOL_ERROR.
  const port = process.env.PORT || '3031'
  const reportUrl = `http://127.0.0.1:${port}/report/${id}`

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
  try {
    browser = await puppeteer.launch({
      executablePath: findChrome(),
      headless: 'shell',
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.goto(reportUrl, { waitUntil: 'networkidle0', timeout: 30_000 })
    // Recharts can render after networkidle; wait for any responsive containers to settle.
    await page.waitForSelector('.recharts-responsive-container, [id="weekly-snapshot"]', { timeout: 5_000 }).catch(() => {})
    await new Promise(r => setTimeout(r, 1200))

    await page.evaluate(TUNE_SCRIPT)
    await new Promise(r => setTimeout(r, 400))

    const pdf = await page.pdf({
      printBackground: true,
      displayHeaderFooter: false,
      width: '8.5in',
      height: '11in',
      margin: { top: '0.4in', bottom: '0.4in', left: '0in', right: '0in' },
      scale: 0.78,
    })

    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}
