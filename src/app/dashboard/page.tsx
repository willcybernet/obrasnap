'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, HardHat } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Project } from '@/lib/types'

interface ProjectWithProgress extends Project {
  progress: number
  current_stage: string
  status: string
  deadlineLabel: string
  deadlineType: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Erro de autenticação:', authError)
          setError('Erro de autenticação. Por favor, faça login novamente.')
          return
        }

        if (!user) {
          router.push('/login')
          return
        }

        console.log('Buscando projetos para usuário:', user.id)

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*, stages(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (projectsError) {
          console.error('Erro ao buscar projetos:', projectsError)
          throw new Error(projectsError.message)
        }

        console.log('Projetos encontrados:', projectsData)

        const projectsWithProgress = (projectsData || []).map((project: any) => {
          const stages = project.stages || []
          const totalStages = stages.length
          const completedStages = stages.filter((s: any) => s.is_completed).length
          const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0
          
          const currentStage = stages.find((s: any) => !s.is_completed)?.name || stages[stages.length - 1]?.name || 'Início'
          
          let status = 'emprogresso'
          if (progress === 100) status = 'finalizando'
          else if (progress < 25) status = 'planejamento'
          else if (progress < 50) status = 'critico'

          let deadlineLabel = ''
          let deadlineType = ''
          if (project.end_date && progress < 100) {
            const end = new Date(project.end_date)
            const now = new Date()
            const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays < 0) {
              deadlineLabel = `Vencido há ${Math.abs(diffDays)}d`
              deadlineType = 'overdue'
            } else if (diffDays <= 7) {
              deadlineLabel = `Fecha em ${diffDays}d`
              deadlineType = 'warning'
            }
          }

          return {
            ...project,
            progress,
            current_stage: currentStage,
            status,
            deadlineLabel,
            deadlineType,
          }
        })

        setProjects(projectsWithProgress)
        console.log('Projetos processados:', projectsWithProgress)
      } catch (err: any) {
        console.error('Erro geral ao buscar projetos:', err)
        setError(err.message || 'Erro ao carregar projetos')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [retryCount, router])

  const activeProjects = projects.filter(p => p.is_active)
  const completedProjects = projects.filter(p => !p.is_active)
  const delayedProjects = activeProjects.filter(p => {
    if (!p.end_date) return false
    return new Date(p.end_date) < new Date() && p.progress < 100
  })

  const getEfficiency = (project: ProjectWithProgress): number | null => {
    if (!project.start_date || !project.end_date) return null
    const start = new Date(project.start_date).getTime()
    const end = new Date(project.end_date).getTime()
    const totalDays = (end - start) / (1000 * 60 * 60 * 24)
    if (totalDays <= 0) return null
    const elapsedDays = (Date.now() - start) / (1000 * 60 * 60 * 24)
    if (elapsedDays <= 0) return 100
    const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
    return Math.min(100, Math.round((project.progress / expectedProgress) * 100))
  }

  const avgEfficiency = activeProjects.length > 0
    ? (() => {
        const efficiencies = activeProjects.map(getEfficiency).filter((e): e is number => e !== null)
        return efficiencies.length > 0
          ? Math.round(efficiencies.reduce((acc, e) => acc + e, 0) / efficiencies.length)
          : Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
      })()
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-headline text-xl text-on-surface-variant">Carregando projetos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-lg text-sm">
        <div className="flex flex-col items-center text-center">
          <p className="mb-4">Erro ao carregar projetos: {error}</p>
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:bg-error/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <section className="mb-12 lg:mb-20">
        <div className="flex flex-col gap-2">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline hidden md:block">ObraSnap • Dashboard</span>
          <h2 className="font-headline text-3xl lg:text-6xl tracking-tighter text-on-background font-medium">Meus Projetos</h2>
          <p className="font-body text-base lg:text-lg text-on-surface-variant mt-2 lg:mt-4">
            {activeProjects.length > 0 ? (
              <>Você tem <span className="text-on-background font-semibold">{activeProjects.length} obras ativas</span> sob sua supervisão.</>
            ) : (
              <>Você ainda não tem obras cadastradas. Comece criando seu primeiro projeto!</>
            )}
          </p>
        </div>
      </section>

      {error && (
        <div className="mb-8 p-6 bg-error-container text-on-error-container rounded-lg text-sm">
          <div className="flex flex-col items-center text-center">
            <p className="mb-4">Erro ao carregar projetos: {error}</p>
            <button 
              onClick={() => setRetryCount(prev => prev + 1)}
              className="px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:bg-error/90 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-8 mb-12 lg:mb-20">
        <div className="bg-surface-container-low p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all duration-300 hover:bg-surface-container hover:shadow-soft hover:-translate-y-0.5 border border-outline-variant/10 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Ativos</span>
          <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter">{activeProjects.length}</span>
        </div>
        
        <div className="bg-surface-container-low p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all duration-300 hover:bg-surface-container hover:shadow-soft hover:-translate-y-0.5 border border-outline-variant/10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Em Atraso</span>
          <div>
            <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter text-error">{delayedProjects.length}</span>
            <p className="text-[8px] lg:text-[10px] text-outline mt-1">com prazo vencido</p>
          </div>
        </div>
        
        <div className="bg-tertiary-container p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all duration-300 hover:bg-tertiary-fixed-dim hover:shadow-soft hover:-translate-y-0.5 border border-outline-variant/10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-tertiary-container">Eficiência</span>
          <div>
            <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter text-on-tertiary-container">{avgEfficiency}%</span>
            <p className="text-[8px] lg:text-[10px] text-on-tertiary-container/60 mt-1">progresso real vs cronograma</p>
          </div>
        </div>
        
        <div className="bg-surface-container-highest p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all duration-300 hover:bg-outline-variant/20 hover:shadow-soft hover:-translate-y-0.5 border border-outline-variant/10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface">Concluídos</span>
          <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter text-on-surface">{completedProjects.length}</span>
        </div>
      </section>

      {projects.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-16 lg:py-24">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-surface-container-low flex items-center justify-center mb-6 lg:mb-8">
            <HardHat className="w-10 h-10 lg:w-12 lg:h-12 text-outline" />
          </div>
          <h3 className="font-headline text-2xl lg:text-3xl font-bold text-on-background mb-2 lg:mb-4">Nenhum projeto ainda</h3>
          <p className="text-on-surface-variant text-center max-w-md mb-6 lg:mb-8">
            Comece criando seu primeiro projeto para acompanhar o progresso da obra e compartilhar com seu cliente.
          </p>
          <Link href="/dashboard/new" className="inline-flex items-center gap-2 px-6 lg:px-8 py-3 lg:py-4 bg-primary text-primary-foreground rounded-lg font-bold text-sm lg:text-base tracking-widest uppercase hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            Criar Primeiro Projeto
          </Link>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-12">
          {projects.map((project, idx) => {
            const statusColors: Record<string, string> = {
              emprogresso: 'bg-primary',
              planejamento: 'bg-on-tertiary-container',
              finalizando: 'bg-on-secondary-fixed',
              critico: 'bg-on-error-container',
            }
            const bgColors: Record<string, string> = {
              emprogresso: 'bg-white/80',
              planejamento: 'bg-tertiary-container/80',
              finalizando: 'bg-secondary-fixed-dim/80',
              critico: 'bg-error-container/80',
            }
            
            const gradientColors: Record<string, string> = {
              emprogresso: 'from-primary/80 to-secondary/60',
              planejamento: 'from-tertiary/80 to-tertiary-container/60',
              finalizando: 'from-secondary-fixed/80 to-secondary-fixed-dim/60',
              critico: 'from-error/80 to-error-container/60',
            }
            
            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="group cursor-pointer animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className={`relative h-48 lg:h-72 mb-4 lg:mb-6 overflow-hidden rounded-xl bg-gradient-to-br ${gradientColors[project.status]} transition-all duration-300 group-hover:shadow-lift group-hover:-translate-y-1`}>
                  <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-[120px] lg:text-[180px] font-bold text-white/20 select-none">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt="" className="relative w-full h-full object-cover z-10" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                  ) : null}
                  <div className="absolute top-3 lg:top-4 left-3 lg:left-4 flex items-center gap-2">
                    <div className={`${bgColors[project.status]} backdrop-blur-md px-2 lg:px-3 py-1 rounded-full flex items-center gap-1 lg:gap-2`}>
                      <span className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${statusColors[project.status]} animate-pulse`}></span>
                      <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">
                        {project.status === 'emprogresso' && 'Em Progresso'}
                        {project.status === 'planejamento' && 'Planejamento'}
                        {project.status === 'finalizando' && 'Finalizando'}
                        {project.status === 'critico' && 'Crítico'}
                      </span>
                    </div>
                    {project.deadlineLabel && (
                      <div className={`px-2 lg:px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1 ${project.deadlineType === 'overdue' ? 'bg-error/80 text-white' : 'bg-warning/80 text-warning-foreground'}`}>
                        <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">{project.deadlineLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 lg:space-y-4">
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline">{project.address || 'Sem endereço'}</span>
                    <h3 className="font-headline text-lg lg:text-2xl font-bold tracking-tight">{project.name}</h3>
                  </div>
                  <div className="pt-2 lg:pt-4 border-t border-surface-container">
                    <div className="flex justify-between items-end mb-1 lg:mb-2">
                      <div>
                        <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Andamento</span>
                        <p className="text-[9px] text-outline mt-0.5">{project.current_stage}</p>
                      </div>
                      <span className="font-headline text-lg lg:text-xl font-light">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-[3px] lg:h-[4px] overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          <Link href="/dashboard/new" className="group cursor-pointer border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-8 lg:p-12 transition-all duration-300 hover:bg-surface-container-low hover:border-primary/40 hover:shadow-soft hover:-translate-y-0.5 min-h-[280px] lg:min-h-[420px] animate-fade-in-up" style={{ animationDelay: `${projects.length * 80}ms` }}>
            <div className="w-12 lg:w-16 h-12 lg:h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 lg:mb-6 group-hover:bg-primary transition-colors">
              <Plus className="text-outline text-2xl lg:text-3xl group-hover:text-on-primary" />
            </div>
            <h4 className="font-headline text-lg lg:text-xl font-bold tracking-tight text-on-background">Novo Projeto</h4>
            <p className="text-sm text-on-surface-variant text-center mt-2 max-w-[200px]">Inicie uma nova jornada de construção agora.</p>
          </Link>
        </section>
      )}
    </>
  )
}
