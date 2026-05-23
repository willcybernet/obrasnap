# Plano de Implementação — ObraSnap

## Priorização: 3 clusters em ordem de implementação

---

## Cluster 1 — Notificações Automáticas ao Cliente

**Objetivo**: Quando o profissional registrar um avanço, o cliente recebe um email com fotos, nota e status. Sem configuração extra — usa o `client_email` já preenchido no projeto.

### Já existe
- Função `sendUpdateNotification` em `src/lib/notifications.ts`
- Endpoint `/api/send-email` em `src/app/api/send-email/route.ts`
- Integração Resend configurada (basta adicionar `RESEND_API_KEY` no env)
- Chamada já existe no `handleSaveUpdate` (linha ~269 do `page.tsx`)

### O que precisa ser feito

#### 1.1 Ativar o envio real (configuração)
- Adicionar `RESEND_API_KEY` no `.env.local` e nas variáveis de ambiente da Vercel
- Criar domínio no Resend e configurar DNS (se for produção)
- Atualizar o `from` no endpoint de `noreply@obrasnap.com` para o domínio verificado

#### 1.2 Melhorar o template de email
**Arquivo**: `src/lib/notifications.ts`

- Incluir fotos do update no corpo do email (atualmente só texto)
- Mostrar barrinha de progresso visual no email
- Link direto para página pública com hash de autenticação
- Adicionar fallback visual se a cor primária do escritório estiver disponível

**Esforço**: 1-2 horas
**Dependências**: Nenhuma

---

## Cluster 2 — Alertas de Atraso + Cronograma Visual

**Objetivo**: Alertas visuais quando `end_date` está próxima/vencida, e uma timeline simples mostrando etapas previstas vs realizadas.

### 2.1 Badge de prazo nos cards do dashboard
**Arquivo**: `src/app/dashboard/page.tsx`

- Se `end_date` está a ≤ 7 dias e progresso < 100% → badge "Fecha em X dias"
- Se `end_date` venceu e progresso < 100% → badge "Vencido há X dias" (vermelho)
- Adicionar no canto superior direito do card, abaixo do status

**Esforço**: 30 min

### 2.2 Alerta na página do projeto
**Arquivo**: `src/app/dashboard/projects/[id]/page.tsx`

- Banner abaixo do nome do projeto se estiver perto do vencimento
- Ex: "⚠ Prazo estimado para 15/06 — restam 7 dias (60% concluído)"
- Esconder automaticamente se progresso ≥ 100% ou sem `end_date`

**Esforço**: 30 min

### 2.3 Timeline visual de etapas
**Arquivo novo**: `src/components/timeline.tsx`
**Arquivo a modificar**: `src/app/dashboard/projects/[id]/page.tsx` (inserir na sidebar ou abaixo das métricas)

- Lista vertical com bolinhas conectadas por linha
- Cada etapa mostra: nome, status (concluída/atual/pendente), data de conclusão (se houver)
- Etapa atual destacada com animação de pulso
- Design limpo, monocolor, sem excesso de info

**Esforço**: 1-2 horas

### 2.4 Sidebar com indicador de "próximos vencimentos"
**Arquivo**: `src/components/sidebar.tsx`

- Abaixo da navegação, mostrar lista compacta:
  - "Obra X — vence em 5 dias"
  - "Obra Y — vencida há 3 dias"
- Máximo 3 itens, clicável para navegar ao projeto
- Consulta separada via `useEffect` ou incluída no fetch do dashboard

**Esforço**: 1 hora

**Total do cluster 2**: ~3-4 horas
**Dependências**: Nenhuma

---

## Cluster 3 — Comparativo Visual Antes/Depois

**Objetivo**: Selecionar duas datas (ou dois updates) e ver as fotos lado a lado. Poderoso para mostrar evolução ao cliente.

### 3.1 Estrutura de dados
- Não precisa de nova tabela — os updates já têm `created_at` e `photos`
- Basta uma query que filtra por data ou seleciona dois updates específicos

### 3.2 Seletor de comparação
**Arquivo a modificar**: `src/app/obra/[slug]/page.tsx` e `src/app/dashboard/projects/[id]/page.tsx`

- Abaixo do progresso, botão "Comparar Fotos"
- Modal/expansão com dois calendars ou dois selects de data
- Ao selecionar duas datas, carrega as fotos daquele período

### 3.3 Visual lado a lado
**Arquivos**: Mesmos acima

- Grid de 2 colunas: "Antes" (esquerda) e "Depois" (direita)
- Se houver múltiplas fotos em cada período, mostrar em carrossel
- Data e etapa label em cada lado
- Slider de comparação (opcional, pode ser v2): uma linha vertical que desliza sobre a mesma foto em tempos diferentes

### 3.4 Disponibilizar na página pública também
**Arquivo**: `src/app/obra/[slug]/page.tsx`

- O cliente que acessa o link compartilhado também pode ver o comparativo
- Diferencial competitivo forte

**Total do cluster 3**: ~3-4 horas
**Dependências**: Nenhuma

---

## Resumo de esforço total

| Cluster | Estimativa | Complexidade |
|---|---|---|
| 1 — Email automático | 1-2h | Baixa (já tem base) |
| 2 — Alertas + Timeline | 3-4h | Média |
| 3 — Antes/Depois | 3-4h | Média |
| **Total** | **7-10h** | |

## Ordem recomendada

1. **Cluster 1** (mais rápido, maior valor percebido, já tem estrutura pronta)
2. **Cluster 2** (alerta de atraso é funcionalidade reativa que ajuda no dia a dia)
3. **Cluster 3** (recurso visual, diferencia o produto, pode ser feito em paralelo ou depois)

---

## Observações técnicas

- **Email**: Resend já está integrado. Basta criar conta gratuita em resend.com, verificar domínio, colocar a key no `.env.local` e na Vercel. O template HTML pode ser inline (sem dependências).
- **Fotos**: O storage já é público (`photos` bucket). URLs são estáveis.
- **Timeline**: Pode usar CSS puro (linhas verticais com `::before` + bolinhas). Sem lib externa.
- **Comparativo**: A seleção de data pode ser feita com `<input type="date">` + filtro local nos updates já carregados. Sem query extra no banco.