'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Camera, Share2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Timeline } from '@/components/timeline'
import { createClient } from '@/lib/supabase'
import { sendUpdateNotification } from '@/lib/notifications'
import type { Photo, Project, Stage, UpdateWithPhotos } from '@/lib/types'

interface ProjectDetails extends Project {
  stages: Stage[]
  updates: UpdateWithPhotos[]
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [registerStep, setRegisterStep] = useState(1)
  const [selectedStageId, setSelectedStageId] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

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

      setProject({
        ...data,
        stages: [...(data.stages || [])].sort((a: Stage, b: Stage) => a.order_index - b.order_index),
        updates: [...(data.updates || [])].sort(
          (a: UpdateWithPhotos, b: UpdateWithPhotos) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
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

  const completedStages = project?.stages.filter((stage) => stage.is_completed).length || 0
  const totalStages = project?.stages.length || 0
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0
  const latestPhoto = project?.updates.flatMap((update) => update.photos || [])[0] as Photo | undefined

  const handleToggleStageComplete = async (stageId: string) => {
    const stage = project?.stages.find((item) => item.id === stageId)
    if (!stage) return

    try {
      const supabase = createClient()
      const isCompleted = !stage.is_completed
      const { error: updateError } = await supabase
        .from('stages')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', stageId)

      if (updateError) throw updateError
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao atualizar etapa:', err)
      setError(err.message || 'Erro ao atualizar etapa')
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return
    const newPhotos = Array.from(event.target.files).slice(0, 6 - photos.length)
    setPhotos((current) => [...current, ...newPhotos].slice(0, 6))
  }

  const resetRegister = () => {
    setShowRegister(false)
    setRegisterStep(1)
    setSelectedStageId('')
    setPhotos([])
    setNote('')
  }

  const handleSaveUpdate = async () => {
    if (!project || !selectedStageId) return

    try {
      setSaving(true)
      setError('')

      const supabase = createClient()
      const { data: update, error: updateError } = await supabase
        .from('updates')
        .insert({
          project_id: projectId,
          stage_id: selectedStageId,
          note: note || null,
        })
        .select()
        .single()

      if (updateError) throw updateError

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
      resetRegister()
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse font-headline text-xl text-on-surface-variant">
          Carregando projeto...
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="rounded-lg bg-error-container p-6 text-sm text-on-error-container">
        {error || 'Projeto nao encontrado.'}
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 lg:mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-outline transition-colors hover:text-on-surface">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-label text-[10px] uppercase tracking-widest">Voltar</span>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-error-container p-4 text-sm text-on-error-container">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <main className="col-span-1 space-y-6 lg:col-span-8 lg:space-y-8">
          <section>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Projeto</span>
            <h2 className="mt-2 font-headline text-3xl font-medium tracking-tighter text-on-background lg:text-5xl">
              {project.name}
            </h2>
            <p className="mt-2 font-body text-base text-on-surface-variant lg:text-lg">
              {project.address || 'Sem endereco cadastrado'}
            </p>
          </section>

          <section className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-container-low">
            {latestPhoto ? (
              <img src={latestPhoto.storage_url} alt="Foto mais recente do projeto" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-container-highest">
                <ImageIcon className="h-12 w-12 text-outline/30" />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 lg:p-12">
              <span className="mb-1 font-label text-xs font-bold uppercase tracking-widest text-on-primary/70">
                Projeto atual
              </span>
              <h3 className="font-headline text-2xl font-medium italic text-on-primary lg:text-4xl">
                {project.name}
              </h3>
            </div>
          </section>

          <section>
            <h3 className="mb-4 font-headline text-lg font-bold text-on-surface lg:mb-6 lg:text-xl">
              Atualizacoes Recentes
            </h3>
            <div className="space-y-4 lg:space-y-6">
              {project.updates.length === 0 && (
                <div className="rounded-xl bg-surface-container-low p-6 text-sm text-on-surface-variant">
                  Nenhum registro foi adicionado a este projeto ainda.
                </div>
              )}

              {project.updates.map((update) => (
                <article key={update.id} className="rounded-xl bg-surface-container-low p-4 lg:p-6">
                  <div className="mb-3 flex items-center gap-2 lg:mb-4 lg:gap-3">
                    <Camera className="h-4 w-4 text-outline lg:h-5 lg:w-5" />
                    <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                      {new Date(update.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {update.stage && (
                      <>
                        <span className="text-outline">-</span>
                        <span className="text-sm font-bold text-on-surface lg:text-base">{update.stage.name}</span>
                      </>
                    )}
                  </div>

                  {update.note && (
                    <p className="mb-3 text-sm text-on-surface-variant lg:mb-4 lg:text-base">{update.note}</p>
                  )}

                  {update.photos && update.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:gap-3">
                      {update.photos.map((photo) => (
                        <div key={photo.id} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-highest lg:h-24 lg:w-24">
                          <img src={photo.storage_url} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="col-span-1 space-y-4 lg:col-span-4 lg:space-y-6">
          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 lg:p-8">
            <h4 className="mb-4 font-headline text-lg font-bold">Metricas</h4>
            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface-variant">Progresso Global</span>
                <span className="font-headline text-2xl font-bold lg:text-3xl">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 lg:gap-4 lg:pt-4">
                <div className="rounded-lg bg-surface-container-highest p-3 lg:p-4">
                  <span className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                    Etapas
                  </span>
                  <span className="font-headline text-xl font-bold lg:text-2xl">{totalStages}</span>
                </div>
                <div className="rounded-lg bg-surface-container-highest p-3 lg:p-4">
                  <span className="mb-1 block font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                    Concluidas
                  </span>
                  <span className="font-headline text-xl font-bold lg:text-2xl">{completedStages}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 lg:p-8">
            <h4 className="mb-4 font-headline text-lg font-bold">Etapas</h4>
            <Timeline stages={project.stages} onToggleComplete={handleToggleStageComplete} />
          </section>

          {!showRegister ? (
            <button
              onClick={() => setShowRegister(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold uppercase tracking-widest text-primary-foreground shadow-architectural transition-colors hover:bg-primary-dim lg:py-6"
            >
              <Camera className="h-5 w-5" />
              Registrar Hoje
            </button>
          ) : (
            <section className="rounded-xl bg-surface-container-lowest p-6 shadow-architectural lg:p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-label text-[10px] font-semibold uppercase tracking-[0.15em] text-outline">
                  Registro Diario
                </span>
                <button onClick={resetRegister} className="p-1 text-on-surface-variant transition-colors hover:text-on-surface">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 flex gap-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-all ${step <= registerStep ? 'bg-primary' : 'bg-surface-container-highest'}`}
                  />
                ))}
              </div>

              {registerStep === 1 && (
                <div className="space-y-4">
                  <h2 className="font-headline text-lg font-bold text-on-surface lg:text-xl">Qual etapa recebeu registro?</h2>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {project.stages.map((stage) => (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`w-full rounded-lg border-b-2 p-3 text-left text-sm font-medium transition-all lg:p-4 ${
                          selectedStageId === stage.id
                            ? 'border-primary bg-surface-container'
                            : 'border-transparent bg-surface-container-low hover:bg-surface-container'
                        }`}
                      >
                        {stage.name}
                      </button>
                    ))}
                  </div>
                  <Button onClick={() => setRegisterStep(2)} disabled={!selectedStageId} className="w-full">
                    Continuar
                  </Button>
                </div>
              )}

              {registerStep === 2 && (
                <div className="space-y-4">
                  <h2 className="font-headline text-lg font-bold text-on-surface lg:text-xl">Fotos (maximo 6)</h2>
                  <div className="grid grid-cols-3 gap-2 lg:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        onClick={() => fileInputRef.current?.click()}
                        className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low transition-colors hover:bg-surface-container"
                      >
                        {photos[index] ? (
                          <>
                            <img src={URL.createObjectURL(photos[index])} alt="" className="h-full w-full rounded-lg object-cover" />
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))
                              }}
                              className="absolute right-1 top-1 rounded-full bg-error p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-outline lg:h-5 lg:w-5" />
                            <span className="font-label text-[8px] font-bold uppercase tracking-widest text-outline">Upload</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
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
                  <h2 className="font-headline text-lg font-bold text-on-surface lg:text-xl">Nota (opcional)</h2>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ex: Atraso na entrega de materiais..."
                    className="h-28 w-full resize-none rounded-t-lg border-none border-b-2 border-outline-variant bg-surface-container-low p-3 text-sm transition-all placeholder:text-outline/50 focus:border-primary focus:ring-0 lg:h-32 lg:p-4"
                  />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setRegisterStep(2)} className="flex-1">
                      Voltar
                    </Button>
                    <Button onClick={handleSaveUpdate} disabled={saving} className="flex-1">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          <Button variant="secondary" className="w-full" onClick={copyLink}>
            <Share2 className="mr-2 h-4 w-4" />
            {copied ? 'Link copiado' : 'Compartilhar'}
          </Button>
        </aside>
      </div>
    </>
  )
}
