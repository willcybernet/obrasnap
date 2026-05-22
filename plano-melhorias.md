# Plano de Melhorias - ObraSnap

> Documento gerado em: 21/05/2026
> Baseado na análise do código-fonte do projeto ObraSnap

---

## Sumário

1. [Integrar Dashboard com dados reais do Supabase](#1-integrar-dashboard-com-dados-reais-do-supabase)
2. [Implementar autenticação no servidor (Server Components + Middleware)](#2-implementar-autenticação-no-servidor-server-components--middleware)
3. [Criar Middleware de proteção de rotas](#3-criar-middleware-de-proteção-de-rotas)
4. [Completar página de detalhes do projeto](#4-completar-página-de-detalhes-do-projeto)
5. [Implementar fila/retry para envio de emails](#5-implementar-filaretry-para-envio-de-emails)
6. [Adicionar paginação nas listagens](#6-adicionar-paginação-nas-listagens)
7. [Melhorar tratamento de erros nas operações do Supabase](#7-melhorar-tratamento-de-erros-nas-operações-do-supabase)
8. [Configurar variáveis de ambiente para produção](#8-configurar-variáveis-de-ambiente-para-produção)
9. [Otimizações adicionais recomendadas](#9-otimizações-adicionais-recomendadas)

---

## 1. Integrar Dashboard com dados reais do Supabase

**Prioridade:** Alta | **Complexidade:** Média | **Tempo estimado:** 2-3 dias

### Problema
O dashboard atual (`src/app/dashboard/page.tsx`) exibe dados mockados (`mockProjects`). As funções de CRUD já existem em `src/lib/db.ts` mas não estão sendo utilizadas.

### Objetivo
Substituir os dados mockados por dados reais do Supabase, mantendo a mesma estrutura visual e experiência do usuário.

### Etapas de Implementação

#### 1.1 Refatorar `src/app/dashboard/page.tsx` para Server Component
- [ ] Remover `'use client'` do topo do arquivo
- [ ] Importar `createServerClient` do `@supabase/ssr` usando `cookies()`
- [ ] Buscar projetos reais do usuário logado com `getProjects()`
- [ ] Buscar dados do usuário (office_name, logo, cor)

#### 1.2 Criar função helper para calcular métricas
- [ ] Criar `src/lib/metrics.ts`
- [ ] Implementar `calculateDashboardMetrics(projects: Project[])`:
  - Contagem de projetos ativos (`is_active = true`)
  - Contagem de projetos concluídos (`is_active = false`)
  - Identificar projetos "em atraso" (lógica a definir: progresso < 50% E data prevista passada)
  - Média de eficiência/progresso entre projetos ativos

#### 1.3 Integrar progresso real dos projetos
- [ ] Modificar `getProjects()` em `db.ts` para fazer JOIN com stages
- [ ] Calcular `progress` dinamicamente: `(stages_concluídas / total_stages) * 100`
- [ ] Identificar `stage` atual (última etapa não concluída ou em andamento)

#### 1.4 Adaptar o layout dos cards de projeto
- [ ] Substituir `mockProjects.map()` pela lista real
- [ ] Garantir que campos opcionais (`address`, `city`) não quebrem o layout
- [ ] Adicionar estado de loading (skeleton) enquanto carrega

#### 1.5 Adicionar estado vazio (empty state)
- [ ] Criar componente `EmptyProjects` para quando não há projetos
- [ ] Exibir mensagem amigável + CTA para criar primeiro projeto

### Critérios de Aceitação
- [ ] Dashboard carrega projetos reais do usuário logado
- [ ] Progresso exibido corresponde ao cálculo de stages concluídas
- [ ] Métricas (ativos, atraso, eficiência, concluídos) são calculadas em tempo real
- [ ] Layout permanece responsivo e fiel ao design system
- [ ] Estado de loading e empty state estão implementados

---

## 2. Implementar autenticação no servidor (Server Components + Middleware)

**Prioridade:** Alta | **Complexidade:** Média | **Tempo estimado:** 2 dias

### Problema
A verificação de autenticação está apenas no cliente (`useEffect` no `dashboard/layout.tsx`), causando:
- Flash de conteúdo antes do redirecionamento
- Dependência de JavaScript para segurança
- Possibilidade de leak de dados no SSR

### Objetivo
Migra a autenticação para o servidor usando Server Components, garantindo que rotas protegidas só renderizem para usuários autenticados.

### Etapas de Implementação

#### 2.1 Instalar e configurar `@supabase/ssr` para Server Components
- [ ] Verificar se `@supabase/ssr` está atualizado (^0.1.0 é antigo, atualizar para ^0.5.0+)
- [ ] Criar `src/lib/supabase-server.ts` com `createServerClient` usando `cookies()` do Next.js

```typescript
// src/lib/supabase-server.ts (exemplo)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
```

#### 2.2 Refatorar `dashboard/layout.tsx` para Server Component
- [ ] Remover `'use client'`
- [ ] Remover `useEffect` de verificação de auth
- [ ] Usar `createServerSupabaseClient()` para obter sessão
- [ ] Redirecionar no servidor se não autenticado (`redirect('/login')`)
- [ ] Passar dados do usuário para os children via props ou context server

#### 2.3 Extrair partes interativas para Client Components
- [ ] Criar `DashboardShell` ou similar para a parte interativa da UI (sidebar toggle, etc.)
- [ ] Manter apenas o necessário como `'use client'`

#### 2.4 Atualizar páginas internas do dashboard
- [ ] `dashboard/settings/page.tsx` - usar server-side para buscar dados iniciais
- [ ] `dashboard/new/page.tsx` - manter formulário como client, mas usar server actions

### Critérios de Aceitação
- [ ] Rotas do dashboard são Server Components por padrão
- [ ] Não há flash de conteúdo não autenticado
- [ ] Redirecionamento para `/login` acontece no servidor (HTTP 307)
- [ ] Dados do usuário são buscados server-side e hidratados

---

## 3. Criar Middleware de proteção de rotas

**Prioridade:** Alta | **Complexidade:** Baixa | **Tempo estimado:** 1 dia

### Problema
Não existe `middleware.ts` na raiz do projeto. A proteção de rotas depende inteiramente do client-side JavaScript.

### Objetivo
Criar um middleware Next.js que intercepte requisições para rotas protegidas e valide a sessão do Supabase antes de permitir o acesso.

### Etapas de Implementação

#### 3.1 Criar `src/middleware.ts`
- [ ] Criar arquivo `src/middleware.ts`
- [ ] Importar `createServerClient` do `@supabase/ssr`
- [ ] Implementar função `middleware(request: NextRequest)`
- [ ] Verificar se a rota começa com `/dashboard` ou `/api/protected`
- [ ] Validar sessão usando cookies
- [ ] Redirecionar para `/login` se sessão inválida/ausente
- [ ] Atualizar cookies da sessão se necessário (refresh token)

#### 3.2 Configurar matcher no middleware
```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
}
```

#### 3.3 Testar cenários
- [ ] Acessar `/dashboard` sem sessão → redireciona para `/login`
- [ ] Acessar `/dashboard` com sessão válida → permite acesso
- [ ] Acessar `/login` com sessão válida → redireciona para `/dashboard`
- [ ] Acessar `/obra/[slug]` sem sessão → permite (rota pública)

#### 3.4 Integrar com o layout do dashboard
- [ ] Remover verificação client-side do `dashboard/layout.tsx` (ou mantê-la como redundância leve)

### Critérios de Aceitação
- [ ] `src/middleware.ts` existe e está configurado
- [ ] Rotas `/dashboard/*` exigem autenticação no nível de middleware
- [ ] Rotas públicas (`/obra/*`, `/login`, `/register`) não são afetadas
- [ ] Refresh de token acontece automaticamente via middleware

---

## 4. Completar página de detalhes do projeto

**Prioridade:** Alta | **Complexidade:** Média-Alta | **Tempo estimado:** 3-4 dias

### Problema
A página `dashboard/projects/[id]/page.tsx` não foi analisada (pode estar incompleta ou ausente). O resumo menciona um "modal de registro com 3 passos" para adicionar atualizações.

### Objetivo
Criar uma página completa de detalhes do projeto com: visualização de informações, lista de etapas, timeline de updates, galeria de fotos e modal de registro de nova atualização.

### Etapas de Implementação

#### 4.1 Estruturar a página de detalhes
- [ ] Verificar/criar `src/app/dashboard/projects/[id]/page.tsx`
- [ ] Usar Server Component para buscar dados iniciais do projeto
- [ ] Layout com: header do projeto, tabs ou seções (Visão Geral, Etapas, Timeline, Fotos)

#### 4.2 Seção "Visão Geral"
- [ ] Exibir informações do projeto: nome, endereço, cliente, datas
- [ ] Mostrar progresso geral com barra visual
- [ ] Exibir etapa atual em destaque
- [ ] Link público para o portal do cliente (`/obra/[slug]`)

#### 4.3 Seção "Etapas"
- [ ] Listar todas as etapas do projeto em ordem
- [ ] Permitir marcar etapa como concluída (checkbox/toggle)
- [ ] Atualizar progresso automaticamente ao concluir etapa
- [ ] Permitir adicionar/remover etapas customizadas

#### 4.4 Seção "Timeline de Updates"
- [ ] Listar updates em ordem cronológica reversa (mais recentes primeiro)
- [ ] Exibir nota, etapa relacionada e data
- [ ] Mostrar thumbnails das fotos vinculadas
- [ ] Expandir para ver fotos em tamanho maior

#### 4.5 Modal/Criar Nova Atualização (3 passos)
- [ ] Criar componente `CreateUpdateModal`
- [ ] **Passo 1 - Selecionar Etapa:** Dropdown com etapas do projeto
- [ ] **Passo 2 - Fotos:** Upload de até 3 fotos (drag & drop ou input file), preview, remover
- [ ] **Passo 3 - Nota:** Campo de texto para descrição da atualização
- [ ] Validar dados antes de enviar
- [ ] Ao salvar: criar update → fazer upload das fotos → enviar notificação por email
- [ ] Feedback de sucesso/erro e refresh da timeline

#### 4.6 Galeria de Fotos
- [ ] Grid/masonry de todas as fotos do projeto
- [ ] Agrupar por update/etapa
- [ ] Lightbox para visualização em tamanho real
- [ ] Lazy loading de imagens

### Critérios de Aceitação
- [ ] Página carrega dados reais do projeto especificado
- [ ] Usuário pode registrar nova atualização com 3 passos
- [ ] Upload de até 3 fotos por update funciona corretamente
- [ ] Timeline exibe updates com fotos em formato legível
- [ ] Progresso é atualizado em tempo real ao concluir etapas
- [ ] Notificação por email é disparada ao criar update (se configurada)

---

## 5. Implementar fila/retry para envio de emails

**Prioridade:** Média | **Complexidade:** Média | **Tempo estimado:** 2 dias

### Problema
O envio de email é síncrono na API route (`/api/send-email`). Se a API do Resend falhar, o update do usuário pode ser comprometido ou o erro pode passar despercebido.

### Objetivo
Tornar o envio de email assíncrono e robusto, com retry automático e tratamento de falhas.

### Etapas de Implementação

#### 5.1 Criar tabela de fila de emails no Supabase
```sql
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5.2 Refatorar `sendUpdateNotification`
- [ ] Em vez de chamar `/api/send-email` diretamente, inserir na `email_queue`
- [ ] Retornar imediatamente para não bloquear a criação do update
- [ ] O processamento da fila acontece de forma assíncrona

#### 5.3 Criar Edge Function ou cron job para processar fila
- [ ] **Opção A (Supabase Edge Functions):**
  - Criar Edge Function `process-email-queue`
  - Executar a cada X minutos via cron do Supabase
  - Processar emails pendentes (`status = 'pending' AND attempts < max_attempts`)
  - Enviar via Resend e atualizar status
  
- [ ] **Opção B (API Route + Vercel Cron):**
  - Criar API route `/api/process-email-queue`
  - Configurar cron no `vercel.json` para chamar a cada 5 minutos
  - Implementar lógica de retry com exponential backoff

#### 5.4 Implementar retry com exponential backoff
- [ ] Se falhar, incrementar `attempts`
- [ ] Agendar próxima tentativa: `2^attempts` minutos depois
- [ ] Após `max_attempts` (3), marcar como `failed` e logar erro

#### 5.5 Adicionar logs e monitoramento
- [ ] Logar todos os envios (sucesso e falha)
- [ ] Criar interface simples no dashboard para ver status de emails enviados

### Critérios de Aceitação
- [ ] Envio de email não bloqueia a criação de update
- [ ] Emails são enfileirados e processados assincronamente
- [ ] Retry automático acontece em caso de falha (até 3x)
- [ ] Falhas permanentes são registradas e notificadas
- [ ] Sistema funciona mesmo se Resend estiver temporariamente fora do ar

---

## 6. Adicionar paginação nas listagens

**Prioridade:** Média | **Complexidade:** Baixa-Média | **Tempo estimado:** 1-2 dias

### Problema
As funções `getProjects()` e `getUpdates()` buscam todos os registros sem limite, o que pode causar problemas de performance com grandes volumes de dados.

### Objetivo
Implementar paginação server-side em todas as listagens do sistema.

### Etapas de Implementação

#### 6.1 Atualizar funções em `src/lib/db.ts`
- [ ] Modificar `getProjects(userId, { page = 1, limit = 20 })`
  - Usar `.range((page - 1) * limit, page * limit - 1)` do Supabase
  - Retornar metadados de paginação (total, totalPages, currentPage)
  
- [ ] Modificar `getUpdates(projectId, { page = 1, limit = 20 })`
  - Mesma lógica de range
  - Ordenar por `created_at DESC`

#### 6.2 Criar componente `Pagination`
- [ ] Criar `src/components/ui/pagination.tsx`
- [ ] Props: `currentPage`, `totalPages`, `onPageChange`
- [ ] Design minimalista alinhado ao design system
- [ ] Mostrar: Primeira, Anterior, [intervalo], Próxima, Última
- [ ] Esconder se totalPages <= 1

#### 6.3 Integrar paginação no Dashboard
- [ ] Buscar apenas primeira página de projetos inicialmente
- [ ] Adicionar `Pagination` abaixo da grid de projetos
- [ ] Atualizar lista ao mudar de página

#### 6.4 Integrar paginação na Timeline de Updates
- [ ] Carregar updates em lotes (ex: 10 por página)
- [ ] Usar "Load more" (infinito) ou paginação numérica

#### 6.5 Implementar cursor-based pagination (opcional/futuro)
- [ ] Para melhor performance em datasets muito grandes
- [ ] Usar `cursor` baseado em `created_at` + `id`

### Critérios de Aceitação
- [ ] Dashboard lista no máximo 20 projetos por página
- [ ] Paginação funciona corretamente com múltiplas páginas
- [ ] Timeline de updates suporta paginação
- [ ] URLs podem refletir página atual (?page=2)
- [ ] Performance mantida com 100+ registros

---

## 7. Melhorar tratamento de erros nas operações do Supabase

**Prioridade:** Média | **Complexidade:** Média | **Tempo estimado:** 2 dias

### Problema
O tratamento de erros é superficial (`if (error) throw error`). Não há feedback claro para o usuário em caso de falhas de rede, permissões ou validação.

### Objetivo
Implementar tratamento de erros robusto, com mensagens amigáveis para o usuário e logs detalhados para debug.

### Etapas de Implementação

#### 7.1 Criar sistema de erro customizado
- [ ] Criar `src/lib/errors.ts`
- [ ] Definir classes de erro:
  - `AppError` (base)
  - `AuthError` (problemas de autenticação)
  - `PermissionError` (RLS/sem permissão)
  - `ValidationError` (dados inválidos)
  - `NetworkError` (problemas de conexão)
  - `NotFoundError` (recurso não encontrado)

#### 7.2 Criar wrapper seguro para chamadas Supabase
- [ ] Criar `src/lib/safe-db.ts` ou `withErrorHandling()`
- [ ] Interceptar erros do Supabase e traduzir para AppErrors
- [ ] Identificar tipo de erro por código:
  - `PGRST116` → NotFoundError
  - `42501` (RLS) → PermissionError
  - `23505` → ValidationError (duplicate)
  - `23503` → ValidationError (foreign key)

#### 7.3 Implementar Toast/Notification system
- [ ] Criar `src/components/ui/toast.tsx` ou usar uma biblioteca como `sonner`
  - Instalar: `npm install sonner`
  - Configurar provider no layout
- [ ] Criar hook `useErrorHandler()`
- [ ] Exibir toast com mensagem amigável ao usuário

#### 7.4 Atualizar todas as chamadas do Supabase
- [ ] Dashboard: envolver busca de projetos em try/catch
- [ ] Login/Register: mostrar erro específico (senha fraca, email existente, etc.)
- [ ] Upload de fotos: tratar erro de tamanho, formato, quota
- [ ] Settings: tratar erro ao salvar configurações
- [ ] Criar Update: tratar falha em cada etapa

#### 7.5 Implementar fallback UI
- [ ] Criar componente `ErrorBoundary` para capturar erros de React
- [ ] Criar página `error.tsx` nas rotas do dashboard (Next.js error handling)
- [ ] Mostrar mensagem genérica + botão "Tentar novamente"

### Critérios de Aceitação
- [ ] Erros de autenticação mostram mensagem clara (ex: "Sessão expirada, faça login novamente")
- [ ] Erros de permissão são identificados e logados
- [ ] Erros de validação destacam os campos problemáticos
- [ ] Erros de rede mostram mensagem de "Sem conexão, tente novamente"
- [ ] Todos os fluxos principais têm tratamento de erro

---

## 8. Configurar variáveis de ambiente para produção

**Prioridade:** Baixa (bloqueante para deploy) | **Complexidade:** Baixa | **Tempo estimado:** 0.5 dia

### Problema
`.env.example` existe mas `.env.local` precisa ser configurado. Credenciais reais do Supabase e Resend são necessárias para o funcionamento completo.

### Etapas de Implementação

#### 8.1 Configurar projeto no Supabase
- [ ] Criar projeto em https://supabase.com
- [ ] Copiar URL e ANON_KEY para `.env.local`
- [ ] Configurar SITE_URL e redirecionamentos em Authentication > URL Configuration
- [ ] Criar bucket `photos` em Storage (ou executar schema.sql que já faz isso)

#### 8.2 Executar schema no banco
- [ ] Abrir SQL Editor no Supabase Dashboard
- [ ] Copiar e executar `supabase/schema.sql`
- [ ] Verificar se todas as tabelas e policies foram criadas
- [ ] Testar inserção manual em cada tabela

#### 8.3 Configurar Resend
- [ ] Criar conta em https://resend.com
- [ ] Verificar domínio ou usar email de teste
- [ ] Copiar API key para `.env.local` como `RESEND_API_KEY`
- [ ] Testar envio via API route

#### 8.4 Configurar Vercel
- [ ] Criar projeto no Vercel
- [ ] Adicionar variáveis de ambiente no dashboard da Vercel
- [ ] Configurar `NEXT_PUBLIC_APP_URL` com URL de produção
- [ ] Fazer deploy e verificar se as variáveis estão injetadas

#### 8.5 Documentar
- [ ] Atualizar `.env.example` com todas as variáveis necessárias
- [ ] Adicionar comentários explicando cada variável
- [ ] Criar `README.md` ou atualizar `resumo.md` com instruções de setup

### Critérios de Aceitação
- [ ] `.env.local` preenchido com credenciais reais
- [ ] Supabase schema aplicado e funcionando
- [ ] Upload de imagens funciona em produção
- [ ] Emails são enviados corretamente (com Resend)
- [ ] Aplicação deployada e acessível na Vercel

---

## 9. Otimizações adicionais recomendadas

### 9.1 Otimizar imagens
- [ ] Usar componente `<Image>` do Next.js em vez de `<img>`
- [ ] Configurar `sizes` adequado para fotos em grid/galeria
- [ ] Implementar lazy loading nativo

### 9.2 Adicionar cache e revalidação
- [ ] Usar `unstable_cache` ou `revalidate` em Server Components
- [ ] Cachear listagem de projetos por alguns segundos
- [ ] Implementar revalidação ao criar/editar projeto

### 9.3 Implementar Server Actions
- [ ] Migrar formulários de cliente para Server Actions (Next.js 14+)
- [ ] `createProjectAction`, `updateSettingsAction`, etc.
- [ ] Reduzir código client-side e API routes

### 9.4 Adicionar busca global de projetos
- [ ] Implementar busca por nome, endereço ou nome do cliente
- [ ] Usar full-text search do PostgreSQL via Supabase
- [ ] Integrar ao campo de busca no header do dashboard

### 9.5 Melhorar SEO e meta tags
- [ ] Adicionar `metadata` object em cada página
- [ ] OG Tags para compartilhamento do portal do cliente
- [ ] `robots.ts` e `sitemap.ts`

### 9.6 Testes
- [ ] Configurar Playwright para E2E testing
- [ ] Testar fluxos críticos: login, criar projeto, adicionar update, visualizar portal
- [ ] Configurar GitHub Actions para CI/CD

---

## Roadmap Sugerido

| Semana | Foco | Tarefas |
|--------|------|---------|
| **Semana 1** | Fundação | 3 (Middleware), 2 (Server Auth), 8 (Config Ambiente) |
| **Semana 2** | Dados Reais | 1 (Dashboard), 4 (Detalhes do Projeto - parte 1) |
| **Semana 3** | Funcionalidades | 4 (Detalhes do Projeto - parte 2), 7 (Erros) |
| **Semana 4** | Robustez | 5 (Fila Email), 6 (Paginação), 9 (Otimizações) |

---

## Checklist Final

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Middleware de auth implementado e testado
- [ ] Dashboard carrega dados reais do Supabase
- [ ] Página de detalhes do projeto funcional
- [ ] Upload de fotos e registro de updates funcionando
- [ ] Email assíncrono com retry implementado
- [ ] Paginação aplicada nas listagens
- [ ] Tratamento de erros robusto em todos os fluxos
- [ ] Testes E2E cobrindo fluxos críticos
- [ ] Deploy realizado na Vercel e funcionando

---

*Este plano deve ser revisado e priorizado conforme as necessidades do negócio e restrições de tempo.*
