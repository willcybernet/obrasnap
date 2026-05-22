-- ObraSnap - Schema do Banco de Dados
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de Usuários (Profissionais/Escritórios)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  office_name VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  start_date DATE,
  end_date DATE,
  public_slug VARCHAR(100) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Etapas do Projeto
CREATE TABLE IF NOT EXISTS public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  order_index INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Atualizações/Registros
CREATE TABLE IF NOT EXISTS public.updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Fotos
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID REFERENCES public.updates(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON public.stages(project_id);
CREATE INDEX IF NOT EXISTS idx_updates_project_id ON public.updates(project_id);
CREATE INDEX IF NOT EXISTS idx_updates_stage_id ON public.updates(stage_id);
CREATE INDEX IF NOT EXISTS idx_photos_update_id ON public.photos(update_id);
CREATE INDEX IF NOT EXISTS idx_projects_public_slug ON public.projects(public_slug);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Policies para Users
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policies para Projects
CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (user_id = auth.uid());

-- Acesso público para visualização (via slug)
CREATE POLICY "projects_select_public" ON public.projects
  FOR SELECT USING (true);

-- Policies para Stages
CREATE POLICY "stages_select_own" ON public.stages
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "stages_insert_own" ON public.stages
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "stages_update_own" ON public.stages
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "stages_delete_own" ON public.stages
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- Acesso público
CREATE POLICY "stages_select_public" ON public.stages
  FOR SELECT USING (true);

-- Policies para Updates
CREATE POLICY "updates_select_own" ON public.updates
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "updates_insert_own" ON public.updates
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "updates_update_own" ON public.updates
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "updates_delete_own" ON public.updates
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- Acesso público
CREATE POLICY "updates_select_public" ON public.updates
  FOR SELECT USING (true);

-- Policies para Photos
CREATE POLICY "photos_select_own" ON public.photos
  FOR SELECT USING (
    update_id IN (SELECT id FROM public.updates WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()))
  );

CREATE POLICY "photos_insert_own" ON public.photos
  FOR INSERT WITH CHECK (
    update_id IN (SELECT id FROM public.updates WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()))
  );

CREATE POLICY "photos_delete_own" ON public.photos
  FOR DELETE USING (
    update_id IN (SELECT id FROM public.updates WHERE project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()))
  );

-- Acesso público
CREATE POLICY "photos_select_public" ON public.photos
  FOR SELECT USING (true);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage Bucket para fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para acesso público às fotos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Owner Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
