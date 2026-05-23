export interface User {
  id: string
  email: string
  name: string | null
  office_name: string | null
  logo_url: string | null
  primary_color: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  address: string | null
  client_name: string | null
  client_email: string | null
  start_date: string | null
  end_date: string | null
  public_slug: string | null
  cover_image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  office_name?: string | null
  logo_url?: string | null
  primary_color?: string | null
}

export interface Stage {
  id: string
  project_id: string
  name: string
  order_index: number
  start_date: string | null
  end_date: string | null
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export interface Update {
  id: string
  project_id: string
  stage_id: string | null
  note: string | null
  created_at: string
}

export interface UpdateUpdateData {
  stage_id?: string | null
  note?: string | null
}

export interface Photo {
  id: string
  update_id: string
  storage_path: string
  storage_url: string
  width: number | null
  height: number | null
  taken_at: string | null
  created_at: string
}

export interface ProjectWithStages extends Project {
  stages: Stage[]
}

export interface UpdateWithPhotos extends Update {
  photos: Photo[]
  stage?: Stage
}

export interface ProjectProgress {
  total_stages: number
  completed_stages: number
  percentage: number
}

export const DEFAULT_STAGES = [
  { name: 'Fundação', order: 1 },
  { name: 'Estrutura', order: 2 },
  { name: 'Alvenaria', order: 3 },
  { name: 'Instalações Elétricas', order: 4 },
  { name: 'Instalações Hidráulicas', order: 5 },
  { name: 'Pintura', order: 6 },
  { name: 'Acabamento', order: 7 },
]
