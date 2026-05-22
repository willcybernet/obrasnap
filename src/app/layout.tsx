import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
})

const manrope = Manrope({ 
  subsets: ['latin'], 
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ObraSnap - Acompanhamento de Obras',
  description: 'Plataforma de acompanhamento de projetos e obras para arquitetos, engenheiros e construtores.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
