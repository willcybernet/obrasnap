'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Search, Bell, Settings, Headphones } from 'lucide-react'
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
        <header className="flex justify-between items-center w-full px-4 md:px-8 lg:px-16 h-20 sticky top-0 z-30 bg-surface-container-low">
          <div className="flex items-center gap-4 lg:gap-8">
            <span className="text-xl lg:text-2xl font-bold tracking-tighter text-on-background hidden lg:block">ObraSnap</span>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="relative hidden md:flex items-center bg-surface-container rounded-full px-4 py-2 w-48 lg:w-64">
              <Search className="text-outline w-5 h-5" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm font-body w-full placeholder:text-outline-variant ml-2" 
                placeholder="Buscar projeto..." 
                type="text"
              />
            </div>
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
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                U
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 md:px-8 lg:px-16 pt-8 md:pt-12 pb-16 lg:pb-24 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <div className="fixed bottom-8 right-8 z-50 hidden md:block">
        <button className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
          <Headphones className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
