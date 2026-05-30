'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, Trash2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ConfirmModal from '@/components/ui/confirm-modal'
import Button from '@/components/ui/button'
import type { Project } from '@/lib/types'

interface ProjectWithProgress extends Project {
  progress: number
  current_stage: string
  status: string
  deadlineLabel: string
  deadlineType: string
}

interface FilterState {
  search: string
  status: 'all' | 'active' | 'archived'
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'active',
  })
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
          console.error('Auth error:', authError)
          setError('Erro de autenticação. Por favor, faça login novamente.')
          return
        }

        if (!user) {
          router.push('/login')
          return
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*, stages(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (projectsError) {
          console.error('Erro ao buscar projetos:', projectsError)
          throw new Error(projectsError.message)
        }

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
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Erro ao carregar projetos')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [retryCount, router])

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

      setProjects(prev => prev.filter(project => project.id !== deleteProjectId))
      
      setDeleteModalOpen(false)
      setDeleteProjectId(null)
      setDeleteLoading(false)
    } catch (error: any) {
      console.error('Delete error:', error)
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

  return (
    <>
      <section className="mb-8 lg:mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline hidden md:block">ObraSnap • Projetos</span>
            <h2 className="font-headline text-3xl lg:text-6xl tracking-tighter text-on-background font-medium">Todos os Projetos</h2>
            <p className="font-body text-base lg:text-lg text-on-surface-variant mt-1">
              Visualize, busque e filtre todos os seus projetos ativos ou concluídos/arquivados.
            </p>
          </div>
          <Link href="/dashboard/new" className="self-start md:self-auto">
            <Button className="bg-primary text-primary-foreground py-3 px-5 rounded-md font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
              <Plus className="w-[18px] h-[18px]" />
              Novo Projeto
            </Button>
          </Link>
        </div>
      </section>

      {error && (
        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <section className="mb-10 bg-surface-container-low p-4 lg:p-6 rounded-2xl border border-outline-variant/10">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1 relative bg-surface-container rounded-lg px-4 py-2.5 flex items-center border border-outline-variant/10">
            <Search className="text-outline w-5 h-5 shrink-0" />
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm font-body w-full placeholder:text-outline-variant ml-2 outline-none"
              placeholder="Buscar projetos..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Status filter */}
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterState['status'] }))}
            className="px-4 py-2 bg-surface-container rounded-lg border border-outline-variant/10 text-sm font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="archived">Arquivados</option>
          </select>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {projects
          .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                                  p.address?.toLowerCase().includes(filters.search.toLowerCase())
            const matchesStatus = filters.status === 'all' ? true : 
                                  filters.status === 'active' ? p.is_active : 
                                  !p.is_active
            return matchesSearch && matchesStatus
          })
          .map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="group">
              <div className="relative h-48 lg:h-64 mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-primary/80 to-secondary/60 transition-all duration-300 group-hover:shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-[100px] lg:text-[160px] font-bold text-white/10 select-none">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {project.cover_image_url && (
                  <img src={project.cover_image_url} alt="" className="relative w-full h-full object-cover" />
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${project.progress === 100 ? 'bg-green-500' : project.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-[10px] font-bold text-on-background">{project.progress}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-background mb-1">{project.name}</h3>
                  <p className="text-xs text-on-surface-variant">{project.address || 'Sem endereço'}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                  <div>
                    <p className="text-[10px] font-label uppercase tracking-widest text-outline font-bold">Andamento</p>
                    <p className="text-sm font-headline font-light">{project.progress}%</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteClick(project.id)
                    }}
                    className="text-outline hover:text-error transition-colors p-2 rounded-lg hover:bg-error-container/20"
                    title="Excluir projeto"
                    disabled={deleteLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
      </section>

      {projects.length === 0 && (
        <section className="flex flex-col items-center justify-center py-16">
          <FolderOpen className="w-16 h-16 text-outline mb-4" />
          <h3 className="font-headline text-2xl font-bold text-on-background mb-2">Nenhum projeto encontrado</h3>
          <p className="text-on-surface-variant text-center mb-6">Comece criando um novo projeto para ver aqui.</p>
          <Link href="/dashboard/new">
            <Button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </Link>
        </section>
      )}

      {/* Delete Confirmation Modal */}
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
