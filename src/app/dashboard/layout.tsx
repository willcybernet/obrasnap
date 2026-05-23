'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Search, Bell, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-headline text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-72 min-h-screen">
        <header className="flex items-center w-full px-4 lg:px-8 h-20 sticky top-0 z-40 bg-background border-b border-outline-variant/10">
          <div className="flex-1" />
          <div className="relative hidden md:flex items-center bg-surface-container rounded-full px-4 py-2 w-72 lg:w-96">
            <Search className="text-outline w-5 h-5 shrink-0" />
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm font-body w-full placeholder:text-outline-variant ml-2" 
              placeholder="Buscar projeto..." 
              type="text"
            />
          </div>
          <div className="flex-1 flex items-center justify-end gap-3 lg:gap-4">
            <ThemeToggle />
            <button className="text-outline hover:text-on-background transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="text-outline hover:text-on-background transition-all hidden md:block"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>
        <div className="px-4 pt-6 md:pt-10 pb-16 lg:pb-24 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}
