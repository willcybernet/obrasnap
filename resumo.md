# ObraSnap - Resumo do Projeto

## Conceito
**SaaS de acompanhamento de obras** - Plataforma que permite arquitetos, engenheiros e construtores oferecerem aos clientes acompanhamento visual e em tempo real do progresso de projetos e obras.

## Modelo de Negócio
- **Target**: Pequenos e médios escritórios de arquitetura/engenharia e construtoras de pequeno porte
- **Valor**: Transparência com cliente → menos perguntas → menos estresse → cliente mais feliz

---

## Funcionalidades do MVP

### Profissional
- Criar projeto (nome, endereço, data início/fim)
- Definir etapas do projeto (template padrão + customização)
- Registrar presença (1-3 fotos + texto curto)
- Visualizar progresso por etapa (%)
- Lista de clientes e projetos
- Dashboard com métricas
- Configurações do escritório (logo, cor, nome)

### Cliente
- Acesso via link público (sem login)
- Dashboard com progresso (%)
- Feed de atualizações (timeline vertical)
- Galeria de fotos por etapa

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router) |
| Estilização | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (fotos) |
| Email | Resend (API) |
| Hospedagem | Vercel |

---

## Design System: "Architectural Monograph"

### Cores
- **Primary**: #5f5e5e (Steel Gray)
- **Background**: #faf9f5 (Bone/Parchment)
- **Surface Container Low**: #f4f4f4
- **Surface Container Highest**: #e0e4db
- **Error**: #9f403d
- **Tertiary**: #625f55 (Beige/Gold)

### Tipografia
- **Headlines**: Manrope (geometric, bold)
- **Body/Labels**: Inter (legible, modern)

### Princípios
- Sem bordas de 1px - usar contraste de cores
- Espaçamento generoso (whitespace)
- Sombras arquitetônicas sutis
- Mobile-first (responsivo)

---

## Banco de Dados (Schema)

### Tabelas
1. **users** - Perfil do profissional (id, email, name, office_name, logo_url, primary_color)
2. **projects** - Projetos das obras (name, address, client_name, client_email, public_slug)
3. **stages** - Etapas do projeto (name, order_index, is_completed)
4. **updates** - Registros/atualizações diárias (note, stage_id)
5. **photos** - Fotos das atualizações (storage_path, storage_url)

### Arquivo
`supabase/schema.sql` - Script completo com RLS policies, índices e triggers

---

## Páginas Criadas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Login de profissionais |
| `/register` | Cadastro de novos usuários |
| `/dashboard` | Dashboard com lista de projetos e métricas |
| `/dashboard/new` | Formulário para criar novo projeto |
| `/dashboard/projects/[id]` | Detalhes do projeto com registro diário (modal 3 passos) |
| `/dashboard/settings` | Configurações do escritório (logo, cor, nome) |
| `/obra/[slug]` | Portal público do cliente |

---

## Funcionalidades Implementadas

### 1. Upload de Fotos
- Modal de registro com 3 passos
- Upload de até 3 fotos por atualização
- Preview das fotos antes de salvar
- Armazenamento no Supabase Storage

### 2. Notificações por Email
- API route em `/api/send-email`
- Template HTML profissional
- Envio automático ao cliente quando há nova atualização
- Integração com Resend (configurável)

### 3. Autenticação Completa
- Verificação em todas as páginas do dashboard
- Redirecionamento para login se não autenticado
- Funções helper em `src/lib/auth.ts`

### 4. Configurações do Escritório
- Upload de logo
- Nome do escritório
- Cor de destaque (8 opções)
- Preview em tempo real

---

## Componentes Criados

- **Sidebar** - Menu lateral responsivo (colapsável em mobile)
- **Botões** - Primary, Secondary, Tertiary
- **Inputs** - Campos de formulário minimalistas
- **Cards** - Cards de projetos com progresso
- **Modal de Registro** - 3 passos (etapas → fotos → nota)

---

## Arquivos Principais

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz com fontes
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Variáveis CSS + design system
│   ├── login/page.tsx         # Login
│   ├── register/page.tsx       # Registro
│   ├── dashboard/
│   │   ├── layout.tsx         # Layout com sidebar + auth
│   │   ├── page.tsx           # Dashboard
│   │   ├── new/page.tsx       # Novo projeto
│   │   ├── settings/page.tsx  # Configurações do escritório
│   │   └── projects/[id]/page.tsx  # Detalhes + registro
│   ├── obra/[slug]/page.tsx   # Portal cliente
│   └── api/
│       └── send-email/route.ts # API de emails
├── components/
│   ├── sidebar.tsx            # Menu lateral responsivo
│   ├── ui/                   # Componentes base
│   └── theme-provider.tsx
└── lib/
    ├── supabase.ts            # Cliente Supabase
    ├── auth.ts                # Funções de autenticação
    ├── db.ts                  # Funções helpers do banco
    ├── types.ts               # Tipos TypeScript
    └── notifications.ts       # Sistema de notificações
```

---

## Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=photos

# Email (Resend)
RESEND_API_KEY=re_sua_chave
```

---

## Como Rodar

```bash
# Instalação de dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## Próximos Passos (Para Production)

1. ✅ ~~Configurar credenciais reais do Supabase~~
2. ✅ ~~Executar schema no banco de dados~~ (pendente - precisa das credenciais)
3. ✅ ~~Implementar upload de fotos~~
4. ✅ ~~Adicionar notificações por email~~
5. ✅ ~~Implementar autenticação completa~~
6. ✅ ~~Adicionar página de configurações do escritório~~

### Para finalizar:
1. Criar projeto em https://supabase.com
2. Executar `supabase/schema.sql` no SQL Editor
3. Preencher `.env.local` com credenciais reais
4. Configurar domínio customizado (opcional)

---

## Status Atual

- **Frontend**: Completo ✅
- **Backend/DB**: Schema pronto, falta configurar credenciais
- **Email**: API pronta, precisa de chave Resend
- **Design**: 100% conforme design system

---

*Projeto criado em 28/03/2026*
*Última atualização: 28/03/2026*
