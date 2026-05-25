-- ObraSnap - Migração para Tabela de Clientes e Associação de Projetos

-- 1. Criar a Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security) para Clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas de RLS para Clientes
CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "clients_insert_own" ON public.clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "clients_delete_own" ON public.clients
  FOR DELETE USING (user_id = auth.uid());

-- Acesso público se necessário para páginas públicas do portal do cliente
CREATE POLICY "clients_select_public" ON public.clients
  FOR SELECT USING (true);

-- 4. Adicionar a coluna client_id na tabela de projetos
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- 5. Trigger para atualizar updated_at automaticamente na tabela de clientes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Migrar dados de clientes já existentes em projetos
-- Insere os dados dos clientes na tabela clients a partir do que já existe nos projetos
INSERT INTO public.clients (user_id, name, email, created_at, updated_at)
SELECT DISTINCT user_id, client_name, client_email, NOW(), NOW()
FROM public.projects
WHERE client_name IS NOT NULL AND client_name <> ''
ON CONFLICT (id) DO NOTHING;

-- Associa os projetos já existentes aos clientes recém-criados
UPDATE public.projects p
SET client_id = c.id
FROM public.clients c
WHERE p.user_id = c.user_id 
  AND p.client_name = c.name 
  AND (p.client_email = c.email OR (p.client_email IS NULL AND c.email IS NULL));
