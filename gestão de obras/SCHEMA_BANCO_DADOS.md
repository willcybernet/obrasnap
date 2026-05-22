# Schema do Banco de Dados - ObraSnap

## Visão Geral

**Banco:** PostgreSQL (via Supabase)

---

## Tabelas

### 1. users (Profissionais/Escritórios)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  office_name VARCHAR(255),          -- Nome do escritório
  logo_url TEXT,                     -- URL do logo no Storage
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Cor em hex (#RRGGBB)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. projects (Projetos)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  start_date DATE,
  end_date DATE,
  public_slug VARCHAR(100) UNIQUE,  -- slug público para link (ex: obra-silva-123)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. stages (Etapas do Projeto)

```sql
CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,           -- "Fundação", "Estrutura", etc.
  order_index INTEGER NOT NULL,          -- Ordem de execução (1, 2, 3...)
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4. updates (Registros/Atualizações)

```sql
CREATE TABLE updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  note TEXT,                              -- Nota opcional
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 5. photos (Fotos das Atualizações)

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID REFERENCES updates(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,             -- Path no Supabase Storage
  storage_url TEXT NOT NULL,              -- URL pública da foto
  width INTEGER,                           -- Largura original
  height INTEGER,                          -- Altura original
  taken_at TIMESTAMP,                     -- Data/hora da foto (EXIF ou manual)
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Índices

```sql
-- Performance em consultas frequentes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_stages_project_id ON stages(project_id);
CREATE INDEX idx_updates_project_id ON updates(project_id);
CREATE INDEX idx_updates_stage_id ON updates(stage_id);
CREATE INDEX idx_photos_update_id ON photos(update_id);
CREATE INDEX idx_projects_public_slug ON projects(public_slug);
```

---

## Relacionamentos

```
users (1) ──────< projects (N)
                         │
                         └──< stages (N)
                                  │
                                  └──< updates (N)
                                           │
                                           └──< photos (N)
```

---

## Row Level Security (RLS)

### Policies para users

```sql
-- Usuário só vê seu próprio perfil
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Usuário só atualiza seu próprio perfil
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Policies para projects

```sql
-- Profissional vê apenas seus projetos
CREATE POLICY "projects_select_own" ON projects
  FOR SELECT USING (user_id = auth.uid());

-- Qualquer um com o link público pode ver (read-only)
CREATE POLICY "projects_select_public" ON projects
  FOR SELECT USING (true);
```

### Policies para stages, updates, photos

```sql
-- Profissional acessa seus dados
CREATE POLICY "stages_select_own" ON stages
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Acesso público para visualização
CREATE POLICY "stages_select_public" ON stages
  FOR SELECT USING (true);
```

*(mesma lógica para updates e photos)*

---

## APIs (Supabase)

### Auth
- Login email/senha
- Login Google OAuth

### Storage
- Bucket: `photos`
- Pasta por projeto: `photos/{project_id}/{update_id}/`

---

## Dados de Exemplo

### Etapas Padrão (Template)

```javascript
const defaultStages = [
  { name: "Fundação", order: 1 },
  { name: "Estrutura", order: 2 },
  { name: "Alvenaria", order: 3 },
  { name: "Instalações Elétricas", order: 4 },
  { name: "Instalações Hidráulicas", order: 5 },
  { name: "Pintura", order: 6 },
  { name: "Acabamento", order: 7 }
];
```

---

## Resumo

| Tabela | Campos Principais | Objetivo |
|--------|-------------------|-----------|
| users | email, office_name, logo_url, primary_color | Perfil do profissional |
| projects | name, address, client, public_slug | Projeto da obra |
| stages | name, order, is_completed | Etapas do projeto |
| updates | note, created_at | Registro diário |
| photos | storage_url, taken_at | Fotos do registro |
