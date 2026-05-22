'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Share2, Check, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { sendUpdateNotification } from '@/lib/notifications'
import type { Photo, Project, Stage, UpdateWithPhotos } from '@/lib/types'

interface ProjectDetails extends Project {
  stages: Stage[]
  updates: UpdateWithPhotos[]
}

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [showRegister, setShowRegister] = useState(false)
  const [registerStep, setRegisterStep] = useState(1)
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [photos, setPhotos] = useState<File[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const unusedMockProject = {
    id: '1',
    name: 'Casa Silva',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    start_date: '2026-01-15',
    public_slug: 'casa-silva-abc123',
    stages: [
      { id: '1', name: 'Fundação', order: 1, is_completed: true, completed_at: '2026-01-20' },
      { id: '2', name: 'Estrutura', order: 2, is_completed: true, completed_at: '2026-02-10' },
      { id: '3', name: 'Alvenaria', order: 3, is_completed: true, completed_at: '2026-03-05' },
      { id: '4', name: 'Instalações Elétricas', order: 4, is_completed: false, completed_at: null },
      { id: '5', name: 'Instalações Hidráulicas', order: 5, is_completed: false, completed_at: null },
      { id: '6', name: 'Pintura', order: 6, is_completed: false, completed_at: null },
      { id: '7', name: 'Acabamento', order: 7, is_completed: false, completed_at: null },
    ],
    updates: [
      {
        id: '1',
        created_at: '2026-03-28',
        note: 'Quadro elétrico instalado na parede sul',
        stage: { name: 'Instalações Elétricas' },
        photos: [
          { id: '1', storage_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
          { id: '2', storage_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
          { id: '3', storage_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
        ]
      },
      {
        id: '2',
        created_at: '2026-03-15',
        note: 'Paredes internas finalizadas',
        stage: { name: 'Alvenaria' },
        photos: [
          { id: '4', storage_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
          { id: '5', storage_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400' },
        ]
      },
    ],
  }

  const loadProject = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const supabase = createClient()
      const { data, error: projectError } = await supabase
        .from('projects')
        .select('*, stages(*), updates(*, stage:stages(*), photos(*))')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      const orderedStages = [...(data.stages || [])].sort((a: Stage, b: Stage) => a.order_index - b.order_index)
      const orderedUpdates = [...(data.updates || [])].sort(
        (a: UpdateWithPhotos, b: UpdateWithPhotos) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setProject({
        ...data,
        stages: orderedStages,
        updates: orderedUpdates,
      })
    } catch (err: any) {
      console.error('Erro ao carregar projeto:', err)
      setError(err.message || 'Erro ao carregar projeto')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const completedStages = project?.stages.filter((s) => s.is_completed).length || 0
  const progress = project && project.stages.length > 0
    ? Math.round((completedStages / project.stages.length) * 100)
    : 0
  const incompleteStages = project?.stages.filter((s) => !s.is_completed) || []
  const latestPhoto = project?.updates.flatMap((update) => update.photos || [])[0] as Photo | undefined

  const handleStageToggle = (stageId: string) => {
    setSelectedStages(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).slice(0, 3 - photos.length)
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 3))
    }
  }

  const handleSaveUpdate = async () => {
    if (selectedStages.length === 0 || !project) return
    
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()

      const { data: update, error } = await supabase
        .from('updates')
        .insert({
          project_id: projectId,
          stage_id: selectedStages[0],
          note: note || null,
        })
        .select()
        .single()

      if (error) throw error

      for (const stageId of selectedStages) {
        const { error: stageError } = await supabase
          .from('stages')
          .update({ 
            is_completed: true, 
            completed_at: new Date().toISOString() 
          })
          .eq('id', stageId)

        if (stageError) throw stageError
      }

      for (const photo of photos) {
        const fileName = `${update.id}/${Date.now()}-${photo.name}`
        const storagePath = `${projectId}/${fileName}`
        
        const { error: uploadError } = await supabase.storage.from('photos').upload(storagePath, photo)
        if (uploadError) throw uploadError
        
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storagePath)
        
        const { error: photoError } = await supabase.from('photos').insert({
          update_id: update.id,
          storage_path: storagePath,
          storage_url: urlData.publicUrl,
        })

        if (photoError) throw photoError
      }

      await sendUpdateNotification(projectId, update.id)

      setShowRegister(false)
      setRegisterStep(1)
      setSelectedStages([])
      setPhotos([])
      setNote('')
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao salvar registro:', err)
      setError(err.message || 'Erro ao salvar registro')
    } finally {
      setSaving(false)
    }
  }

  const copyLink = () => {
    if (!project?.public_slug) return
    navigator.clipboard.writeText(`${window.location.origin}/obra/${project.public_slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-headline text-xl text-on-surface-variant">Carregando projeto...</div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="p-6 bg-error-container text-on-error-container rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 bg-surface-container-low rounded-lg text-sm text-on-surface-variant">
        Projeto nÃ£o encontrado.
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 lg:mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-outline hover:text-on-surface transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-label text-[10px] uppercase tracking-widest">Voltar</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-1 lg:col-span-8 space-y-6 lg:space-y-8">
          <div>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Projeto</span>
            <h2 className="font-headline text-3xl lg:text-5xl font-medium tracking-tighter text-on-background mt-2">
              {project.name}
            </h2>
            <p className="font-body text-base lg:text-lg text-on-surface-variant mt-2">
              {project.address}
            </p>
          </div>

          <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-container-low relative">
            {latestPhoto ? (
              <img 
                src={latestPhoto.storage_url} 
                alt="Foto mais recente do projeto" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-highest" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 lg:p-12">
              <span className="text-on-primary/70 text-xs lg:text-sm font-bold tracking-widest mb-1 lg:mb-2">PROJETO ATUAL</span>
              <h3 className="text-on-primary font-headline text-2xl lg:text-4xl font-medium italic">{project.name}</h3>
            </div>
          </div>

          <section>
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface mb-4 lg:mb-6">Atualizações Recentes</h3>
            <div className="space-y-4 lg:space-y-6">
              {project.updates.length === 0 && (
                <div className="bg-surface-container-low rounded-xl p-6 text-sm text-on-surface-variant">
                  Nenhum registro foi adicionado a este projeto ainda.
                </div>
              )}

              {project.updates.map((update) => (
                <div key={update.id} className="bg-surface-container-low rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                    <Camera className="w-4 lg:w-5 h-4 lg:h-5 text-outline" />
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                      {new Date(update.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {update.stage && (
                      <>
                        <span className="text-outline">—</span>
                        <span className="font-bold text-on-surface text-sm lg:text-base">{update.stage.name}</span>
                      </>
                    )}
                  </div>
                  
                  {update.note && (
                    <p className="text-on-surface-variant mb-3 lg:mb-4 text-sm lg:text-base">{update.note}</p>
                  )}
                  
                  {update.photos && update.photos.length > 0 && (
                    <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2">
                      {update.photos.map((photo: any) => (
                        <div
                          key={photo.id}
                          className="w-20 lg:w-24 h-20 lg:h-24 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0"
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
          </section>
        </div>

        <div className="col-span-1 lg:col-span-4 space-y-4 lg:space-y-6">
          <div className="p-6 lg:p-8 bg-surface-container-low rounded-xl border border-outline-variant/10">
            <h4 className="font-headline text-lg font-bold mb-4">Métricas</h4>
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface-variant">Progresso Global</span>
                <span className="font-headline font-bold text-2xl lg:text-3xl">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="pt-3 lg:pt-4 grid grid-cols-2 gap-3 lg:gap-4">
                <div className="bg-surface-container-highest p-3 lg:p-4 rounded-lg">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Etapas</span>
                  <span className="font-headline text-xl lg:text-2xl font-black">{project.stages.length}</span>
                </div>
                <div className="bg-surface-container-highest p-3 lg:p-4 rounded-lg">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Dias</span>
                  <span className="font-headline text-xl lg:text-2xl font-black">
                    {project.start_date 
                      ? Math.floor((Date.now() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!showRegister ? (
            <button 
              onClick={() => setShowRegister(true)}
              className="w-full bg-primary text-primary-foreground py-4 lg:py-6 rounded-xl font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors shadow-architectural"
            >
              <Camera className="w-5 h-5" />
              Registrar Hoje
            </button>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-architectural">
              <div className="flex items-center justify-between mb-6">
                <span className="font-label text-[10px] uppercase tracking-[0.15em] text-outline font-semibold">Registro Diário</span>
                <button 
                  onClick={() => {
                    setShowRegister(false)
                    setRegisterStep(1)
                    setSelectedStages([])
                    setPhotos([])
                    setNote('')
                  }}
                  className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-1.5 mb-6">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`h-1 rounded-full transition-all duration-500 flex-1 ${
                      step <= registerStep ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}
                  />
                ))}
              </div>

              {registerStep === 1 && (
                <div className="space-y-4">
                  <h2 className="font-headline text-lg lg:text-xl font-bold text-on-surface">O que foi feito hoje?</h2>
                  <p className="text-on-surface-variant text-sm">Selecione as frentes de trabalho.</p>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {incompleteStages.map((stage: any) => (
                      <button
                        key={stage.id}
                        onClick={() => handleStageToggle(stage.id)}
                        className={`w-full flex items-center gap-3 p-3 lg:p-4 rounded-lg text-left transition-all border-b-2 ${
                          selectedStages.includes(stage.id)
                            ? 'bg-surface-container border-primary'
                            : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedStages.includes(stage.id)
                            ? 'bg-primary border-primary'
                            : 'border-outline'
                        }`} />
                        <span className="text-sm font-medium">{stage.name}</span>
                      </button>
                    ))}
                  </div>

                  <Button 
                    onClick={() => setRegisterStep(2)}
                    disabled={selectedStages.length === 0}
                    className="w-full"
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-4">
                  <h2 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Fotos (máximo 3)</h2>
                  <p className="text-on-surface-variant text-sm">Registre o progresso visual.</p>

                  <div className="grid grid-cols-3 gap-2 lg:gap-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-surface-container-low border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-surface-container transition-colors relative"
                      >
                        {photos[i] ? (
                          <>
                            <img 
                              src={URL.createObjectURL(photos[i])} 
                              alt="" 
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setPhotos(prev => prev.filter((_, idx) => idx !== i))
                              }}
                              className="absolute top-1 right-1 bg-error text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload className="text-outline w-4 lg:w-5 h-4 lg:h-5" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-outline">Upload</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setRegisterStep(1)} className="flex-1">
                      Voltar
                    </Button>
                    <Button onClick={() => setRegisterStep(3)} className="flex-1">
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {registerStep === 3 && (
                <div className="space-y-4">
                  <h2 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Nota (opcional)</h2>
                  <p className="text-on-surface-variant text-sm">Adicione observações.</p>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex: Atraso na entrega de materiais..."
                    className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 rounded-t-lg p-3 lg:p-4 text-sm placeholder:text-outline/50 transition-all h-24 lg:h-32 resize-none"
                  />

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setRegisterStep(2)} className="flex-1">
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleSaveUpdate} 
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button variant="secondary" className="w-full" onClick={copyLink}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
    </>
  )
}
