'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Building2, Camera, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-pulse font-headline text-xl">Carregando...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="text-center">
          <h1 className="font-headline text-2xl font-bold text-on-surface mb-2">Projeto não encontrado</h1>
          <p className="text-on-surface-variant">O link pode estar expirado ou inválido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="px-4 lg:px-8 py-4 lg:py-6 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 lg:w-12 h-10 lg:h-12 rounded-xl flex items-center justify-center shadow-architectural"
              style={{ backgroundColor: project.primary_color || '#5f5e5e' }}
            >
              <Building2 className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
            </div>
            <span className="font-headline font-bold text-base lg:text-lg text-on-background">
              {project.office_name || 'ObraSnap'}
            </span>
          </div>
        </div>
      </header>

      <main className="px-4 lg:px-8 py-8 lg:py-12 max-w-3xl mx-auto space-y-8 lg:space-y-12">
        <div className="text-center space-y-2 lg:space-y-3">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline block">Projeto</span>
          <h1 className="font-headline text-3xl lg:text-5xl font-medium tracking-tighter text-on-background">
            {project.name}
          </h1>
          <p className="text-on-surface-variant text-base lg:text-lg">{project.address}</p>
        </div>

        <div className="bg-surface-container-low rounded-xl p-6 lg:p-8 border border-outline-variant/10">
          <div className="flex items-end justify-between mb-4 lg:mb-6">
            <div>
              <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-2">Progresso</span>
              <span className="font-headline text-4xl lg:text-6xl font-light tracking-tighter text-on-background">
                {progress}%
              </span>
            </div>
          </div>
          
          <div className="h-1.5 lg:h-2 bg-surface-container-highest rounded-full overflow-hidden mb-4 lg:mb-8">
            <div
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${progress}%`,
                backgroundColor: project.primary_color || '#5f5e5e'
              }}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium ${
                  stage.is_completed
                    ? 'bg-success text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {stage.is_completed ? (
                  <Check className="w-3 lg:w-4 h-3 lg:h-4 inline mr-1" />
                ) : (
                  <span className="inline-block w-3 lg:w-4 text-center">○</span>
                )} 
                {stage.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline block mb-4 lg:mb-6">Atualizações Recentes</span>
          
          <div className="space-y-4 lg:space-y-6">
            {updates.map((update) => (
              <div key={update.id} className="bg-surface-container-low rounded-xl p-4 lg:p-6">
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
                  <p className="text-on-surface-variant mb-3 lg:mb-4 text-sm lg:text-base">{update.note}</p>
                )}
                
                {update.photos && update.photos.length > 0 && (
                  <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2">
                    {update.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="w-20 lg:w-28 h-20 lg:h-28 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0"
                      >
                        <img 
                          src={photo.storage_url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-6 lg:pt-8 border-t border-surface-container">
          <p className="text-sm text-on-surface-variant">
            Gerenciado por <strong className="text-on-surface">{project.office_name || 'ObraSnap'}</strong>
          </p>
        </div>
      </main>
    </div>
  )
}
