'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

const mockProjects = [
  {
    id: '1',
    name: 'Casa Silva',
    address: 'Av. Paulista, 1500',
    city: 'São Paulo, SP',
    progress: 75,
    is_active: true,
    stage: 'Acabamento',
    status: 'emprogresso',
  },
  {
    id: '2',
    name: 'Edifício Horizonte',
    address: 'Rua das Flores, 45',
    city: 'Curitiba, PR',
    progress: 15,
    is_active: true,
    stage: 'Estrutura',
    status: 'planejamento',
  },
  {
    id: '3',
    name: 'Galpão Logístico',
    address: 'Rod. Castelo Branco, KM 22',
    city: 'Barueri, SP',
    progress: 98,
    is_active: true,
    stage: 'Entrega',
    status: 'finalizando',
  },
  {
    id: '4',
    name: 'Residencial Park',
    address: 'Al. Gabriel Monteiro, 300',
    city: 'São Paulo, SP',
    progress: 45,
    is_active: true,
    stage: 'Fundação',
    status: 'critico',
  },
]

export default function DashboardPage() {
  const activeProjects = mockProjects.filter(p => p.is_active)
  const completedProjects = mockProjects.filter(p => !p.is_active)
  const delayedProjects = activeProjects.filter(p => p.progress < 50)

  const avgEfficiency = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((acc, p) => acc + p.progress, 0) / activeProjects.length)
    : 0

  return (
    <>
      <section className="mb-12 lg:mb-20">
        <div className="flex flex-col gap-2">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline hidden md:block">Atelier Construct • Dashboard</span>
          <h2 className="font-headline text-3xl lg:text-6xl tracking-tighter text-on-background font-medium">Meus Projetos</h2>
          <p className="font-body text-base lg:text-lg text-on-surface-variant mt-2 lg:mt-4">
            Você tem <span className="text-on-background font-semibold">{activeProjects.length} obras ativas</span> sob sua supervisão.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-8 mb-12 lg:mb-20">
        <div className="bg-surface-container-low p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all hover:bg-surface-container border border-outline-variant/10">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Ativos</span>
          <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter">{activeProjects.length}</span>
        </div>
        
        <div className="bg-surface-container-low p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all hover:bg-surface-container border border-outline-variant/10">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Em Atraso</span>
          <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter text-error">{delayedProjects.length}</span>
        </div>
        
        <div className="bg-tertiary-container p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all hover:bg-tertiary-fixed-dim border border-outline-variant/10">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-tertiary-container">Eficiência</span>
          <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter text-on-tertiary-container">{avgEfficiency}%</span>
        </div>
        
        <div className="bg-surface-container-highest p-4 lg:p-8 flex flex-col justify-between h-32 lg:h-48 rounded-xl transition-all hover:bg-outline-variant/20 border border-outline-variant/10">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface">Concluídos</span>
          <span className="font-headline text-3xl lg:text-6xl font-light tracking-tighter text-on-surface">{completedProjects.length}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-12">
        {mockProjects.map((project) => {
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
          
          return (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="group cursor-pointer">
              <div className="relative h-48 lg:h-72 mb-4 lg:mb-6 overflow-hidden rounded-xl bg-surface-container-low">
                <div className={`absolute top-3 lg:top-4 left-3 lg:left-4 ${bgColors[project.status]} backdrop-blur-md px-2 lg:px-3 py-1 rounded-full flex items-center gap-1 lg:gap-2`}>
                  <span className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${statusColors[project.status]} animate-pulse`}></span>
                  <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">
                    {project.status === 'emprogresso' && 'Em Progresso'}
                    {project.status === 'planejamento' && 'Planejamento'}
                    {project.status === 'finalizando' && 'Finalizando'}
                    {project.status === 'critico' && 'Crítico'}
                  </span>
                </div>
              </div>
              <div className="space-y-2 lg:space-y-4">
                <div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline">{project.city}</span>
                  <h3 className="font-headline text-lg lg:text-2xl font-bold tracking-tight">{project.name}</h3>
                  <p className="text-sm text-on-surface-variant">{project.address}</p>
                </div>
                <div className="pt-2 lg:pt-4 border-t border-surface-container">
                  <div className="flex justify-between items-end mb-1 lg:mb-2">
                    <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">{project.stage}</span>
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

        <Link href="/dashboard/new" className="group cursor-pointer border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-8 lg:p-12 transition-all hover:bg-surface-container-low hover:border-primary/40 min-h-[280px] lg:min-h-[420px]">
          <div className="w-12 lg:w-16 h-12 lg:h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 lg:mb-6 group-hover:bg-primary transition-colors">
            <Plus className="text-outline text-2xl lg:text-3xl group-hover:text-on-primary" />
          </div>
          <h4 className="font-headline text-lg lg:text-xl font-bold tracking-tight text-on-background">Novo Projeto</h4>
          <p className="text-sm text-on-surface-variant text-center mt-2 max-w-[200px]">Inicie uma nova jornada de construção agora.</p>
        </Link>
      </section>
    </>
  )
}
