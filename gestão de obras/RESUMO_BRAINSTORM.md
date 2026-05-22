# Resumo - SaaS de Acompanhamento de Obras

## Conceito

Plataforma SaaS que permite arquitetos, engenheiros e construtores oferecerem aos clientes acompanhamento visual e em tempo real do progresso de projetos e obras.

## Modelo de Negócio

- **Target**: Pequenos e médios escritórios de arquitetura/engenharia e construtoras de pequeno porte
- **Valor**: Transparência com cliente → menos perguntas → menos estresse → cliente mais feliz

---

## Funcionalidades do MVP (Chronos)

### Profissional
- Criar projeto (nome, endereço, data início/fim)
- Definir etapas do projeto (template padrão + customização)
- **"Registrar Presença"**: selecionar etapa → 1-3 fotos + texto curto → salvar (~60 segundos)
- Visualizar progresso por etapa (%)
- Lista de clientes e projetos

### Cliente
- Acesso via link (sem login)
- Dashboard com progresso (%)
- Feed de atualizações (timeline vertical)
- Galeria de fotos por etapa
- Notificação por email

### Princípios UX
- Mínimo de cliques (máximo 3)
- Sem formulários longos
- Mobile-first (uso no canteiro de obras)
- Dark/Light mode

---

## Personalização

Cada profissional pode customizar:
- Logotipo do escritório
- Nome do escritório
- Cor de destaque (aplicada na interface)

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14 (App Router) |
| Estilização | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (fotos) |
| Email | Resend |
| Hospedagem | Vercel |

---

## Modelo de Precificação

| Plano | Preço | Projetos |
|-------|-------|----------|
| Starter | R$ 99/mês | 3 |
| Pro | R$ 249/mês | 10 |
| Enterprise | Sob consulta | Ilimitado |

---

## Hosting

- **Vercel**: Deploy do SaaS (Node.js/Next.js)
- **HostGator** (existente): Manter para domínio e emails

---

## Próximos Passos Sugeridos

1. Detalhamento do banco de dados
2. Wireframe das telas principais
3. Setup do ambiente de desenvolvimento
4. Criação do MVP

---

*Decisões tomadas em sessão de brainstorm.*
