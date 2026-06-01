'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, HardHat, LayoutDashboard, FolderOpen, Users, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ConfirmModal from '@/components/ui/confirm-modal'
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
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (projectsError) throw projectsError

        const processedProjects = (projectsData || []).map((project: any) => {
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

        setProjects(processedProjects)
        setError('')
      } catch (err: any) {
        console.error('Erro ao buscar projetos:', err)
        if (retryCount < 3) {
          setRetryCount(retryCount + 1)
          setTimeout(fetchProjects, 1000 * (retryCount + 1))
        } else {
          setError(err.message || 'Erro ao carregar projetos')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [router, retryCount])

  const handleDeleteClick = (id: string) => {
    setDeleteProjectId(id)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProjectId) return

    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(`/api/projects/${deleteProjectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir projeto')
      }

      setProjects(prev => prev.filter(p => p.id !== deleteProjectId))
      setDeleteModalOpen(false)
      setDeleteProjectId(null)
      setDeleteLoading(false)
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error)
      setDeleteLoading(false)
      alert(error.message || 'Erro ao excluir projeto. Tente novamente.')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setDeleteProjectId(null)
    setDeleteLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-headline text-xl text-on-surface-variant">Carregando projetos...</div>
      </div>
    )
  }

  if (error && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <p className="font-headline text-xl font-bold text-on-background mb-2">Oops! Algo deu errado</p>
          <p className="text-on-surface-variant mb-4">{error}</p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            setRetryCount(0)
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <>
      <section className="mb-8 lg:mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline hidden md:block">ObraSnap • Dashboard</span>
            <h2 className="font-headline text-3xl lg:text-6xl tracking-tighter text-on-background font-medium">Meus Projetos</h2>
            <p className="font-body text-base lg:text-lg text-on-surface-variant mt-1">Acompanhe seus projetos e seu progresso</p>
          </div>
          <Link href="/dashboard/new">
            <button className="bg-primary text-primary-foreground py-3 px-5 rounded-md font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
              <Plus className="w-[18px] h-[18px]" />
              Novo Projeto
            </button>
          </Link>
        </div>
      </section>

      {error && projects.length > 0 && (
        <div className="mb-6 p-4 bg-warning-container text-on-warning-container rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-on-warning-container hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-16 lg:py-24 bg-surface-container-low rounded-2xl border border-outline-variant/10">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <HardHat className="w-8 h-8 text-outline" />
          </div>
          <h3 className="font-headline text-xl font-bold text-on-background mb-2">Nenhum projeto ainda</h3>
          <p className="text-on-surface-variant text-center max-w-sm mb-6 text-sm">Crie seu primeiro projeto para começar a acompanhar suas obras</p>
          <Link href="/dashboard/new">
            <button className="bg-primary text-primary-foreground py-3 px-5 rounded-md font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" />
              Criar Primeiro Projeto
            </button>
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
                   <div className="flex justify-between items-start gap-2">
                     <span className="font-label text-[10px] uppercase tracking-widest text-outline truncate flex-1">{project.address || 'Sem endereço'}</span>
                     {(project as any).client && (
                       <span className="font-label text-[9px] uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded text-on-surface font-semibold max-w-[120px] truncate shrink-0">
                         👤 {(project as any).client.name}
                       </span>
                     )}
                   </div>
                   <div className="flex justify-between items-start gap-2">
                     <h3 className="font-headline text-lg lg:text-2xl font-bold tracking-tight mt-1">{project.name}</h3>
                     <button
                       onClick={(e) => {
                         e.preventDefault()
                         e.stopPropagation()
                         handleDeleteClick(project.id)
                       }}
                       className="text-outline hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/20"
                       title="Excluir projeto"
                       disabled={deleteLoading}
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
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
        </section>
      )}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Projeto"
        description="Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={deleteLoading}
        variant="destructive"
      />
    </>
  )
}
