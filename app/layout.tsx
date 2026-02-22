import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'

import './globals.css'
import 'streamdown/styles.css'
import { I18nProvider } from '@/lib/i18n/context'

const lineSeedRegular = localFont({
  src: '../public/fonts/LINESeedJP-Regular.ttf',
  weight: '400',
  variable: '--font-lineseed',
  display: 'swap',
})

const lineSeedBold = localFont({
  src: '../public/fonts/LINESeedJP-Bold.ttf',
  weight: '700',
  variable: '--font-lineseed-bold',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://chat-panels.pages.dev'
  ),
  title: 'Chat Panels - AI Playground',
  description: 'Minimal multi-pane AI playground for interacting with Dify, OpenAI, Gemini, Anthropic, and other top-tier models side by side.',
  icons: {
    icon: '/images/chat-panels.svg',
    shortcut: '/images/chat-panels.svg',
  },
  openGraph: {
    title: 'Chat Panels - Multi-Model AI Playground',
    description: 'Compare AI models, interact side-by-side, and craft robust prompts easily.',
    url: 'https://chat-panels.pages.dev',
    siteName: 'Chat Panels',
    images: [
      {
        url: '/og-image.png',
        width: 1280,
        height: 720,
        alt: 'Chat Panels AI Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chat Panels - Multi-Model AI Playground',
    description: 'Compare AI models, interact side-by-side, and craft robust prompts easily.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${lineSeedRegular.variable} ${lineSeedBold.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
