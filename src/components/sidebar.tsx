'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Building2, 
  Settings,
  Plus,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'

const navItems = [
  { icon: Building2, label: 'Projetos', href: '/dashboard' },
  { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [officeName, setOfficeName] = useState('ObraSnap')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('office_name')
          .eq('id', user.id)
          .single()
        
        if (userData?.office_name) {
          setOfficeName(userData.office_name)
        }
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 h-full flex flex-col p-8 z-50 w-72 transition-transform duration-300 lg:translate-x-0 bg-background ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-headline font-black text-xl tracking-tighter text-on-background">{officeName}</h1>
            <p className="font-label uppercase tracking-widest text-[11px] text-outline">OBRASNAP</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X className="w-6 h-6 text-on-background" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-surface-container text-on-background font-bold shadow-soft'
                    : 'text-outline hover:bg-surface-container-low hover:text-on-surface hover:shadow-soft'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-label uppercase tracking-widest text-[11px]">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <Link href="/dashboard/new" onClick={() => setIsOpen(false)}>
            <Button className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-md font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
              <Plus className="w-[18px] h-[18px]" />
              Novo Projeto
            </Button>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-outline hover:text-on-background transition-all duration-200 opacity-90 hover:opacity-100"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-label uppercase tracking-widest text-[11px]">Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
