'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Building2, Camera, Check, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { Lightbox } from '@/components/ui/lightbox'
import type { Project, Stage, Update, Photo } from '@/lib/types'

interface UpdateWithPhotos extends Update {
  photos: Photo[]
  stage?: Stage
}

export default function PublicProjectPage() {
  const params = useParams()
  const slug = params.slug as string

  const [project, setProject] = useState<Project | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [updates, setUpdates] = useState<UpdateWithPhotos[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: projectData } = await supabase
        .from('projects')
        .select('*, users(office_name, logo_url, primary_color)')
        .eq('public_slug', slug)
        .single()

      if (projectData) {
        setProject({
          ...projectData,
          office_name: projectData.users?.office_name,
          logo_url: projectData.users?.logo_url,
          primary_color: projectData.users?.primary_color,
        } as Project)

        const { data: stagesData } = await supabase
          .from('stages')
          .select('*')
          .eq('project_id', projectData.id)
          .order('order_index')

        if (stagesData) setStages(stagesData)

        const { data: updatesData } = await supabase
          .from('updates')
          .select('*, stage:stages(*), photos(*)')
          .eq('project_id', projectData.id)
          .order('created_at', { ascending: false })

        if (updatesData) setUpdates(updatesData as UpdateWithPhotos[])
      }

      setLoading(false)
    }

    fetchData()
  }, [slug])

  const completedStages = stages.filter(s => s.is_completed).length
  const progress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-headline text-xl text-on-surface-variant">Carregando...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="font-headline text-2xl font-bold text-on-background mb-2">Projeto não encontrado</h1>
          <p className="text-on-surface-variant">O link pode estar expirado ou inválido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="px-4 lg:px-8 py-4 lg:py-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {project.logo_url ? (
              <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-xl overflow-hidden shadow-architectural">
                <img src={project.logo_url} alt={project.office_name || 'Logo'} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-10 lg:w-12 h-10 lg:h-12 rounded-xl flex items-center justify-center shadow-architectural"
                style={{ backgroundColor: project.primary_color || 'var(--primary)' }}
              >
                <Building2 className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
              </div>
            )}
            <span className="font-headline font-bold text-base lg:text-lg text-on-background">
              {project.office_name || 'ObraSnap'}
            </span>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="px-4 lg:px-8 py-8 lg:py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: FEED DE PUBLICAÇÕES */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
              <h2 className="font-headline text-xl lg:text-2xl font-bold text-on-background">
                Atualizações do Projeto
              </h2>
              <span className="bg-surface-container px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant">
                {updates.length} {updates.length === 1 ? 'publicação' : 'publicações'}
              </span>
            </div>

            <div className="space-y-4 lg:space-y-6">
              {updates.length === 0 && (
                <div className="text-center py-12 bg-surface-container-low rounded-xl border border-outline-variant/10 text-on-surface-variant text-sm">
                  Nenhuma atualização registrada para este projeto ainda.
                </div>
              )}

              {updates.map((update) => (
                <div key={update.id} className="bg-surface-container-low rounded-xl p-4 lg:p-6 border border-outline-variant/10 hover:border-outline-variant/30 transition-all duration-300 shadow-soft">
                  <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                    <Camera className="w-4 lg:w-5 h-4 lg:h-5 text-outline" />
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                      {new Date(update.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                    {update.stage && (
                      <>
                        <span className="text-outline">—</span>
                        <span className="font-bold text-on-surface text-sm">{update.stage.name}</span>
                      </>
                    )}
                  </div>

                  {update.note && (
                    <p className="text-on-surface-variant mb-3 lg:mb-4 text-sm lg:text-base leading-relaxed">{update.note}</p>
                  )}

                  {update.photos && update.photos.length > 0 && (
                    <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2 scrollbar-thin">
                      {update.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="w-20 lg:w-28 h-20 lg:h-28 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/10 cursor-pointer"
                          onClick={() => setActivePhoto(photo.storage_url)}
                        >
                          <img
                            src={photo.storage_url}
                            alt=""
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA: SIDEBAR */}
          <div className="col-span-1 lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Informações do Projeto */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 shadow-soft space-y-4">
              <div className="space-y-2">
                <span className="font-label text-xs uppercase tracking-[0.2em] text-outline block">Projeto</span>
                <h1 className="font-headline text-2xl lg:text-3xl font-bold tracking-tighter text-on-background">
                  {project.name}
                </h1>
                <p className="text-on-surface-variant text-sm">{project.address}</p>
              </div>

              {/* Cover image banner */}
              {(project.cover_image_url || (updates.flatMap(u => u.photos || [])[0]?.storage_url)) && (
                <div 
                  className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-container-low border border-outline-variant/10 shadow-soft cursor-pointer"
                  onClick={() => setActivePhoto(project.cover_image_url || updates.flatMap(u => u.photos || [])[0]?.storage_url)}
                >
                  <img
                    src={project.cover_image_url || updates.flatMap(u => u.photos || [])[0]?.storage_url}
                    alt="Capa do projeto"
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              )}
            </div>

            {/* Progresso e Etapas */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 shadow-soft">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">Progresso</span>
                  <span className="font-headline text-3xl font-light tracking-tighter text-on-background">
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-6">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: project.primary_color || 'var(--primary)'
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-1">Etapas da Obra</span>
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border ${stage.is_completed
                        ? 'bg-success/10 border-success/20 text-success'
                        : 'bg-surface-container border-transparent text-on-surface-variant'
                      }`}
                  >
                    {stage.is_completed ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="inline-block w-3.5 text-center">○</span>
                    )}
                    <span className="truncate">{stage.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Gerenciamento */}
            <div className="text-center py-4 border-t border-outline-variant/10">
              <p className="text-xs text-on-surface-variant">
                Gerenciado por <strong className="text-on-surface">{project.office_name || 'ObraSnap'}</strong>
              </p>
            </div>
            
          </div>
        </div>
      </main>

      {/* Lightbox para visualização de fotos */}
      <Lightbox
        src={activePhoto}
        isOpen={!!activePhoto}
        onClose={() => setActivePhoto(null)}
      />
    </div>
  )
}

