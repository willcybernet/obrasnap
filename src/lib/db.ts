import { createClient } from './supabase'
import type { Project, Stage, Update, Photo, ProjectProgress, DEFAULT_STAGES } from './types'

function generateSlug(name: string): string {
  const timestamp = Date.now().toString(36)
  const slugified = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${slugified}-${timestamp}`
}

export async function createProject(
  userId: string,
  data: {
    name: string
    address?: string
    client_name?: string
    client_email?: string
    start_date?: string
    end_date?: string
  }
) {
  const supabase = createClient()
  const publicSlug = generateSlug(data.name)

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: data.name,
      address: data.address,
      client_name: data.client_name,
      client_email: data.client_email,
      start_date: data.start_date,
      end_date: data.end_date,
      public_slug: publicSlug,
    })
    .select()
    .single()

  if (error) throw error
  return project
}

export async function createStages(projectId: string, stages: { name: string; order: number }[]) {
  const supabase = createClient()

  const stagesData = stages.map((stage) => ({
    project_id: projectId,
    name: stage.name,
    order_index: stage.order,
    is_completed: false,
  }))

  const { data, error } = await supabase
    .from('stages')
    .insert(stagesData)
    .select()

  if (error) throw error
  return data
}

export async function getProjects(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProjectById(projectId: string) {
  const supabase = createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return project
}

export async function getProjectBySlug(slug: string) {
  const supabase = createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('public_slug', slug)
    .single()

  if (error) throw error
  return project
}

export async function getStages(projectId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data
}

export async function updateStage(stageId: string, updates: { is_completed?: boolean; name?: string }) {
  const supabase = createClient()

  const updateData: Record<string, unknown> = { ...updates }
  if (updates.is_completed === true) {
    updateData.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('stages')
    .update(updateData)
    .eq('id', stageId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createUpdate(
  projectId: string,
  stageId: string | null,
  note?: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('updates')
    .insert({
      project_id: projectId,
      stage_id: stageId,
      note: note || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUpdates(projectId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('updates')
    .select('*, stage:stages(*), photos(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function uploadPhoto(
  updateId: string,
  projectId: string,
  file: File
): Promise<Photo> {
  const supabase = createClient()

  const fileName = `${updateId}/${Date.now()}-${file.name}`
  const storagePath = `photos/${projectId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(storagePath)

  const { data: photo, error } = await supabase
    .from('photos')
    .insert({
      update_id: updateId,
      storage_path: storagePath,
      storage_url: urlData.publicUrl,
    })
    .select()
    .single()

  if (error) throw error
  return photo
}

export async function calculateProgress(projectId: string): Promise<ProjectProgress> {
  const supabase = createClient()

  const { data: stages } = await supabase
    .from('stages')
    .select('is_completed')
    .eq('project_id', projectId)

  if (!stages || stages.length === 0) {
    return { total_stages: 0, completed_stages: 0, percentage: 0 }
  }

  const completedStages = stages.filter((s: { is_completed: boolean }) => s.is_completed).length
  const totalStages = stages.length
  const percentage = Math.round((completedStages / totalStages) * 100)

  return {
    total_stages: totalStages,
    completed_stages: completedStages,
    percentage,
  }
}

export async function deleteProject(projectId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw error
  return data
}
