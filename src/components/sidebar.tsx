'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Archive,
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
  const [deadlines, setDeadlines] = useState<{ id: string; name: string; end_date: string; progress: number }[]>([])
  const [archivedProjects, setArchivedProjects] = useState<{ id: string; name: string }[]>([])
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

        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, end_date, stages(is_completed)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .not('end_date', 'is', null)

        if (projects) {
          type Deadline = { id: string; name: string; end_date: string; progress: number }
          const now = new Date()
          const withProgress: Deadline[] = projects.map((p: any) => {
            const stages = p.stages || []
            const completed = stages.filter((s: any) => s.is_completed).length
            const progress = stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0
            return { id: p.id, name: p.name, end_date: p.end_date, progress }
          })
          const sorted = withProgress
            .filter(p => new Date(p.end_date) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) && p.progress < 100)
            .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
            .slice(0, 3)
          setDeadlines(sorted)
        }

        const { data: archived } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('is_active', false)
          .order('updated_at', { ascending: false })

        if (archived) {
          setArchivedProjects(archived)
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

        <nav className="space-y-2">
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

        {deadlines.length > 0 && (
          <div className="mt-4 mb-2">
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-2 px-4">Prazos Próximos</p>
            <div className="space-y-1">
              {deadlines.map(p => {
                const end = new Date(p.end_date)
                const now = new Date()
                const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const isOverdue = diffDays < 0
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="text-xs text-on-surface truncate">{p.name}</p>
                      <p className="text-[10px] text-outline">{p.progress}% concluído</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning-foreground'}`}>
                      {isOverdue ? `${Math.abs(diffDays)}d` : `${diffDays}d`}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {archivedProjects.length > 0 && (
          <div className="mt-4 mb-2">
            <p className="font-label text-[9px] uppercase tracking-widest text-outline mb-2 px-4">Projetos Arquivados</p>
            <div className="space-y-1">
              {archivedProjects.map(project => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
                >
                  <Archive className="w-4 h-4 shrink-0" />
                  <span className="text-xs truncate">{project.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />
        
        <div className="space-y-4">
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
