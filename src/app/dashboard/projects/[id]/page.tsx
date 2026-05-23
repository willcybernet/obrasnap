'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Share2, X, Upload, MoreVertical, Edit, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [showActions, setShowActions] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editClientName, setEditClientName] = useState('')
  const [editClientEmail, setEditClientEmail] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [editingUpdate, setEditingUpdate] = useState<string | null>(null)
  const [editUpdateNote, setEditUpdateNote] = useState('')
  const [editUpdateStage, setEditUpdateStage] = useState('')
  const [editUpdateSaving, setEditUpdateSaving] = useState(false)
  const [editUpdateExistingPhotos, setEditUpdateExistingPhotos] = useState<any[]>([])
  const [editUpdateNewPhotos, setEditUpdateNewPhotos] = useState<File[]>([])
  const [editUpdateRemovePhotoIds, setEditUpdateRemovePhotoIds] = useState<string[]>([])
  const [filterStage, setFilterStage] = useState<string>('')
  const [completing, setCompleting] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const completedStages = project?.stages.filter((s) => s.is_completed).length || 0
  const progress = project && project.stages.length > 0
    ? Math.round((completedStages / project.stages.length) * 100)
    : 0
  const incompleteStages = project?.stages.filter((s) => !s.is_completed) || []
  const latestPhoto = project?.cover_image_url || project?.updates.flatMap((update) => update.photos || [])[0]?.storage_url
  const stageUpdates = project?.stages.map(stage => ({
    ...stage,
    updateCount: project.updates.filter(u => u.stage_id === stage.id).length
  })) || []
  const filteredUpdates = filterStage
    ? project?.updates.filter(u => u.stage_id === filterStage) || []
    : project?.updates || []
  const stageNames = project?.stages.reduce((acc: Record<string, string>, s) => { acc[s.id] = s.name; return acc }, {}) || {}

  const handleStageToggle = (stageId: string) => {
    setSelectedStages(prev =>
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).slice(0, 6 - photos.length)
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 6))
    }
  }

  const openEditModal = () => {
    if (!project) return
    setEditName(project.name)
    setEditAddress(project.address || '')
    setEditClientName(project.client_name || '')
    setEditClientEmail(project.client_email || '')
    setEditStartDate(project.start_date || '')
    setEditEndDate(project.end_date || '')
    setShowEditModal(true)
    setShowActions(false)
  }

  const handleSaveEdit = async () => {
    if (!project) return
    setEditSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .update({
          name: editName,
          address: editAddress || null,
          client_name: editClientName || null,
          client_email: editClientEmail || null,
          start_date: editStartDate || null,
          end_date: editEndDate || null,
        })
        .eq('id', projectId)

      if (error) throw error
      setShowEditModal(false)
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao editar projeto:', err)
      setError(err.message || 'Erro ao salvar alterações')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Erro ao excluir projeto:', err)
      setError(err.message || 'Erro ao excluir projeto')
      setDeleting(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !project) return

    try {
      const supabase = createClient()
      const filePath = `covers/${projectId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('projects')
        .update({ cover_image_url: urlData.publicUrl })
        .eq('id', projectId)

      if (updateError) throw updateError
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao enviar capa:', err)
      setError(err.message || 'Erro ao alterar imagem de capa')
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

  const handleEditUpdate = (update: UpdateWithPhotos) => {
    setEditingUpdate(update.id)
    setEditUpdateNote(update.note || '')
    setEditUpdateStage(update.stage_id || '')
    setEditUpdateExistingPhotos(update.photos || [])
    setEditUpdateNewPhotos([])
    setEditUpdateRemovePhotoIds([])
  }

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const remaining = 6 - editUpdateExistingPhotos.filter(p => !editUpdateRemovePhotoIds.includes(p.id)).length - editUpdateNewPhotos.length
      const newPhotos = Array.from(e.target.files).slice(0, remaining)
      setEditUpdateNewPhotos(prev => [...prev, ...newPhotos].slice(0, 6))
    }
  }

  const handleSaveUpdateEdit = async (updateId: string) => {
    setEditUpdateSaving(true)
    try {
      const supabase = createClient()

      if (editUpdateRemovePhotoIds.length > 0) {
        const { data: photos } = await supabase
          .from('photos')
          .select('storage_path')
          .in('id', editUpdateRemovePhotoIds)
        if (photos && photos.length > 0) {
          await supabase.storage.from('photos').remove(photos.map((p: any) => p.storage_path))
        }
        await supabase.from('photos').delete().in('id', editUpdateRemovePhotoIds)
      }

      for (const photo of editUpdateNewPhotos) {
        const fileName = `${updateId}/${Date.now()}-${photo.name}`
        const storagePath = `${projectId}/${fileName}`
        const { error: uploadError } = await supabase.storage.from('photos').upload(storagePath, photo)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('photos').getPublicUrl(storagePath)
        await supabase.from('photos').insert({
          update_id: updateId,
          storage_path: storagePath,
          storage_url: urlData.publicUrl,
        })
      }

      const { error } = await supabase
        .from('updates')
        .update({
          note: editUpdateNote || null,
          stage_id: editUpdateStage || null,
        })
        .eq('id', updateId)

      if (error) throw error

      setEditingUpdate(null)
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao editar registro:', err)
      setError(err.message || 'Erro ao salvar alterações')
    } finally {
      setEditUpdateSaving(false)
    }
  }

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      const supabase = createClient()

      const { data: photos } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('update_id', updateId)

      if (photos && photos.length > 0) {
        const paths = photos.map((p: any) => p.storage_path)
        await supabase.storage.from('photos').remove(paths)
      }

      const { error } = await supabase
        .from('updates')
        .delete()
        .eq('id', updateId)

      if (error) throw error
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao excluir registro:', err)
      setError(err.message || 'Erro ao excluir registro')
    }
  }

  const copyLink = () => {
    if (!project?.public_slug) return
    navigator.clipboard.writeText(`${window.location.origin}/obra/${project.public_slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUpdateStageDate = async (stageId: string, startDate: string | null, endDate: string | null) => {
    const supabase = createClient()
    const updates: Record<string, string | null> = {}
    if (startDate !== null) updates.start_date = startDate
    else updates.start_date = null
    if (endDate !== null) updates.end_date = endDate
    else updates.end_date = null
    const { error } = await supabase.from('stages').update(updates).eq('id', stageId)
    if (error) throw error
    await loadProject()
  }

  const handleToggleStageComplete = async (stageId: string) => {
    const supabase = createClient()
    const stage = project?.stages.find(s => s.id === stageId)
    if (!stage) return
    const newCompleted = !stage.is_completed
    await supabase.from('stages').update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null
    }).eq('id', stageId)
    await loadProject()
  }

  const handleUpdateStageDate = async (stageId: string, startDate: string | null, endDate: string | null) => {
    const supabase = createClient()
    const updates: Record<string, string | null> = {}
    if (startDate !== null) updates.start_date = startDate
    else updates.start_date = null
    if (endDate !== null) updates.end_date = endDate
    else updates.end_date = null
    const { error } = await supabase.from('stages').update(updates).eq('id', stageId)
    if (error) throw error
    await loadProject()
  }

  const handleCompleteProject = async () => {
    if (!project) return
    setCompleting(true)
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      for (const stage of project.stages) {
        if (!stage.is_completed) {
          await supabase.from('stages').update({ is_completed: true, completed_at: now }).eq('id', stage.id)
        }
      }
      await supabase.from('projects').update({ is_active: false }).eq('id', projectId)
      await loadProject()
    } catch (err: any) {
      console.error('Erro ao concluir projeto:', err)
      setError(err.message || 'Erro ao concluir projeto')
    } finally {
      setCompleting(false)
    }
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
        Projeto não encontrado.
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 lg:mb-8 flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-outline hover:text-on-surface transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-label text-[10px] uppercase tracking-widest">Voltar</span>
        </Link>

        <div className="relative" ref={actionsRef}>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-10 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 overflow-hidden z-[100]">
              <button
                onClick={openEditModal}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Edit className="w-4 h-4 text-outline" />
                Editar Projeto
              </button>
              <button
                onClick={() => { coverInputRef.current?.click(); setShowActions(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-outline" />
                Alterar Capa
              </button>
              <div className="h-px bg-outline-variant/20 mx-4" />
              <button
                onClick={() => { setShowDeleteConfirm(true); setShowActions(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error-container/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Projeto
              </button>
            </div>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-sm">
          {error}
        </div>
      )}

      {project.end_date && project.is_active && progress < 100 && (() => {
        const end = new Date(project.end_date)
        const now = new Date()
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays < 0) {
          return (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-sm flex items-center gap-2">
              <span className="font-bold">Prazo vencido há {Math.abs(diffDays)} dias.</span>
              <span>Progresso atual: {progress}%.</span>
            </div>
          )
        }
        if (diffDays <= 7) {
          return (
            <div className="mb-6 p-4 bg-warning/10 text-warning-foreground rounded-lg text-sm flex items-center gap-2 border border-warning/20">
              <span className="font-bold">Faltam {diffDays} dias</span>
              <span>para o prazo estimado ({new Date(project.end_date).toLocaleDateString('pt-BR')}). Progresso atual: {progress}%.</span>
            </div>
          )
        }
        return null
      })()}

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

          <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-container-low relative group">
            {latestPhoto ? (
              <img
                src={latestPhoto}
                alt="Foto do projeto"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-outline/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 lg:p-12">
              <span className="text-on-primary/70 text-xs lg:text-sm font-bold tracking-widest mb-1 lg:mb-2">PROJETO ATUAL</span>
              <h3 className="text-on-primary font-headline text-2xl lg:text-4xl font-medium italic">{project.name}</h3>
            </div>
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Alterar Capa
            </button>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Atualizações Recentes</h3>
            </div>

            {project.stages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
                <button
                  onClick={() => setFilterStage('')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${!filterStage ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-outline hover:bg-surface-container-highest'}`}
                >
                  Todas
                </button>
                {stageUpdates.filter(s => s.updateCount > 0).map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => setFilterStage(stage.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${filterStage === stage.id ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-outline hover:bg-surface-container-highest'}`}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4 lg:space-y-6">
              {filteredUpdates.length === 0 && (
                <div className="bg-surface-container-low rounded-xl p-6 text-sm text-on-surface-variant">
                  Nenhum registro encontrado para esta etapa.
                </div>
              )}

              {filteredUpdates.map((update) => (
                <div key={update.id} className="bg-surface-container-low rounded-xl p-4 lg:p-6">
                  {editingUpdate === update.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                          Editando registro de {new Date(update.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <select
                        value={editUpdateStage}
                        onChange={(e) => setEditUpdateStage(e.target.value)}
                        className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary focus:ring-0 rounded-t-lg p-3 text-sm"
                      >
                        <option value="">Nenhuma etapa</option>
                        {project.stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <textarea
                        value={editUpdateNote}
                        onChange={(e) => setEditUpdateNote(e.target.value)}
                        placeholder="Nota do registro..."
                        className="w-full bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary focus:ring-0 rounded-t-lg p-3 text-sm placeholder:text-outline/50 transition-all h-20 resize-none"
                      />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Fotos</span>
                          <button
                            onClick={() => editFileInputRef.current?.click()}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dim transition-colors"
                          >
                            {editUpdateExistingPhotos.filter(p => !editUpdateRemovePhotoIds.includes(p.id)).length + editUpdateNewPhotos.length}/6 Adicionar
                          </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {editUpdateExistingPhotos
                            .filter(p => !editUpdateRemovePhotoIds.includes(p.id))
                            .map((photo: any) => (
                              <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-container-highest flex-shrink-0">
                                <img src={photo.storage_url} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => setEditUpdateRemovePhotoIds(prev => [...prev, photo.id])}
                                  className="absolute top-0.5 right-0.5 bg-error/80 text-white rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          {editUpdateNewPhotos.map((file, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface-container-highest flex-shrink-0">
                              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => setEditUpdateNewPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-0.5 right-0.5 bg-error/80 text-white rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEditPhotoUpload}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingUpdate(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveUpdateEdit(update.id)}
                          disabled={editUpdateSaving}
                        >
                          {editUpdateSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
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
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEditUpdate(update)}
                            className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded transition-colors"
                            title="Editar registro"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Excluir este registro?')) {
                                handleDeleteUpdate(update.id)
                              }
                            }}
                            className="p-1.5 text-outline hover:text-error hover:bg-error-container/30 rounded transition-colors"
                            title="Excluir registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {update.note && (
                        <p className="text-on-surface-variant mb-3 lg:mb-4 text-sm lg:text-base">{update.note}</p>
                      )}

                      {update.photos && update.photos.length > 0 && (
                        <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2">
                          {update.photos.map((photo: any, photoIdx: number) => (
                            <div
                              key={photo.id}
                              className="w-20 lg:w-24 h-20 lg:h-24 bg-surface-container-highest rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                const urls = update.photos.map((p: any) => p.storage_url)
                                setLightboxPhotos(urls)
                                setLightboxIndex(photoIdx)
                                setLightboxPhoto(photo.storage_url)
                              }}
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
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-1 lg:col-span-4 space-y-4 lg:space-y-6">
          <div className="p-6 lg:p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5 animate-fade-in-up">
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

          <div className="p-6 lg:p-8 bg-surface-container-low rounded-xl border border-outline-variant/10 transition-all duration-300 hover:shadow-soft animate-fade-in-up">
            <h4 className="font-headline text-lg font-bold mb-4">Etapas</h4>
            <Timeline stages={project.stages} onUpdateDate={handleUpdateStageDate} />
          </div>

          {!showRegister ? (
            <button
              onClick={() => setShowRegister(true)}
              className="w-full bg-primary text-primary-foreground py-4 lg:py-6 rounded-xl font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary-dim transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
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
                  <h2 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Fotos (máximo 6)</h2>
                  <p className="text-on-surface-variant text-sm">Registre o progresso visual.</p>

                  <div className="grid grid-cols-3 gap-2 lg:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
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

          <Button variant="secondary" className="w-full border border-outline-variant/30 shadow-sm hover:shadow-md hover:bg-surface-container-highest transition-all active:scale-[0.98]" onClick={copyLink}>
            <Share2 className="w-4 h-4 mr-2" />
            {copied ? 'Link Copiado!' : 'Compartilhar'}
          </Button>

            {stageUpdates.filter(s => s.updateCount > 0).length > 0 && (
            <div className="bg-surface-container-low rounded-xl p-4 lg:p-6 border border-outline-variant/10 transition-all duration-300 hover:shadow-soft animate-fade-in-up">
              <h4 className="font-label text-[10px] uppercase tracking-widest text-outline font-semibold mb-3">Registros por Etapa</h4>
              <div className="space-y-2">
                {stageUpdates.filter(s => s.updateCount > 0).map(stage => (
                  <div key={stage.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-on-surface">{stage.name}</span>
                    <span className="text-xs font-bold text-outline bg-surface-container-highest px-2 py-0.5 rounded-full">{stage.updateCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.is_active && progress > 0 && (
            <Button
              variant="secondary"
              className="w-full border border-outline-variant/30 text-sm"
              onClick={handleCompleteProject}
              disabled={completing}
            >
              {completing ? 'Concluindo...' : 'Marcar como Concluído'}
            </Button>
          )}
          {!project.is_active && (
            <Button
              variant="secondary"
              className="w-full border border-outline-variant/30 text-sm"
              onClick={async () => {
                try {
                  const supabase = createClient()
                  await supabase.from('projects').update({ is_active: true }).eq('id', projectId)
                  await loadProject()
                } catch (err: any) {
                  setError(err.message || 'Erro ao reativar projeto')
                }
              }}
            >
              Reativar Projeto
            </Button>
          )}
        </div>
      </div>

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2" onClick={() => setLightboxPhoto(null)}>
            <X className="w-6 h-6" />
          </button>
          {lightboxPhotos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  const next = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length
                  setLightboxIndex(next)
                  setLightboxPhoto(lightboxPhotos[next])
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  const next = (lightboxIndex + 1) % lightboxPhotos.length
                  setLightboxIndex(next)
                  setLightboxPhoto(lightboxPhotos[next])
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {lightboxIndex + 1} / {lightboxPhotos.length}
              </div>
            </>
          )}
          <img
            src={lightboxPhoto}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-lg mx-4 shadow-architectural max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-on-surface">Editar Projeto</h3>
              <button onClick={() => setShowEditModal(false)} className="text-outline hover:text-on-surface p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Nome do Projeto</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Endereço</label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="h-12 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Início</label>
                  <Input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="h-12 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Previsão Término</label>
                  <Input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="h-12 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Cliente</label>
                <Input
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="h-12 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Email do Cliente</label>
                <Input
                  type="email"
                  value={editClientEmail}
                  onChange={(e) => setEditClientEmail(e.target.value)}
                  placeholder="email@cliente.com"
                  className="h-12 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1 h-12">
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={editSaving} className="flex-1 h-12">
                {editSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-sm mx-4 shadow-architectural">
            <h3 className="font-headline text-xl font-bold text-on-surface mb-2">Excluir Projeto</h3>
            <p className="text-on-surface-variant text-sm mb-6">
              Tem certeza que deseja excluir <strong>{project.name}</strong>? Esta ação não pode ser desfeita. Todas as atualizações, fotos e dados associados serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-12">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-1 h-12">
                {deleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}