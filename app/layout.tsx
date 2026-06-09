import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const TITLE = 'MM&Co · Seller Performance Reports'
const DESCRIPTION = 'Weekly luxury seller-side performance briefs — Compass insights, paid ads, open houses, and strategy in one place.'

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: '%s · MM&Co Reports',
  },
  description: DESCRIPTION,
  applicationName: 'MM&Co Reports',
  authors: [{ name: 'MM&Co. — Compass' }],
  generator: 'Next.js',
  keywords: ['real estate', 'seller report', 'Compass', 'luxury NYC', 'MM&Co', 'Brooklyn', 'Park Slope'],
  icons: {
    icon: [
      { url: '/mmco-logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/mmco-logo.png' },
    ],
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'MM&Co Reports',
    type: 'website',
    images: [
      { url: '/613-baltic-listing.jpg', width: 1200, height: 630, alt: 'MM&Co Seller Report' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/613-baltic-listing.jpg'],
  },
  robots: {
    index: false,   // private reports — keep out of search indexes
    follow: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#1A211B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
