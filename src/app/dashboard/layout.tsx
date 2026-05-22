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
        <header className="flex justify-between items-center w-full px-4 md:px-8 lg:px-16 h-20 sticky top-0 z-40 bg-surface-container-low">
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

          </div>
        </header>
        <div className="px-4 md:px-8 lg:px-16 pt-8 md:pt-12 pb-16 lg:pb-24 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}
