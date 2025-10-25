import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Saintara - Kenali Karakter Alami dan Potensi Diri Anda',
  description: 'Peta sempurna kehidupan untuk menggali potensi dan menjadi diri sendiri seutuhnya',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body>{children}</body>
    </html>
  )
}
