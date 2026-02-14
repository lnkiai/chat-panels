import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'

import './globals.css'
import 'streamdown/styles.css'

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
  title: 'Longcat AI Playground',
  description:
    'Minimal multi-pane chat playground for comparing Longcat API model responses side by side.',
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
        {children}
      </body>
    </html>
  )
}
