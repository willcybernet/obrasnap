# Fluxo do Projeto - ObraSnap

## 👷 Profissional (Arquiteto/Engenheiro/Construtor)

### 1. Cadastro

- Criar conta (email/senha ou Google)
- Configurar perfil:
  - Nome do escritório
  - Logotipo (upload)
  - Cor de destaque

### 2. Dashboard Principal

- Lista de projetos (cards simples)
- [+] Novo Projeto
- Ver detalhes

### 3. Criar Projeto

- Nome do projeto
- Endereço da obra
- Cliente (nome + email)
- Data início / Data fim
- Etapas (pré-definidas ou customizar)
  - Fundação → Estrutura → Alvenaria → Instalações → Acabamento

### 4. Registrar Atualização (no canteiro)

**BOTÃO PRINCIPAL: "📸 Registrar Hoje"**

**Passo 1: Selecionar etapa(s) feita(s)**
- [ ] Fundação
- [ ] Alvenaria
- [x] Instalações Elétricas

**Passo 2: Tirar/selecionar fotos (1-3)**
- [Carregar fotos]

**Passo 3: Nota opcional**
- "Instalações elétricas concluídas na sala"

**Passo 4: Confirmar**
- [Salvar]

**Tempo total: ~60 segundos**

### 5. Compartilhar com Cliente

- Gerar link único
- Enviar por WhatsApp/Email
- Cliente acessa sem login

---

## 👤 Cliente

### 1. Recebe Link

- Por WhatsApp: "Sua obra foi atualizada! 🎉"
- Por Email: "Nova atualização da obra X"
- Link: obrasnap.com/obra/unique-id

### 2. Acessa sem Login

- Abre no navegador (desktop ou mobile)

### 3. Dashboard do Cliente

```
┌─────────────────────────────────────────────────┐
│ 🏠 Projeto: Casa Silva                         │
│ 📍 Av. Paulista, 1000                          │
│                                                 │
│ ████████████░░░░░░░  45% concluído              │
│ ─────────────────────────────────────           │
│ ✅ Fundação    ✅ Estrutura    ⏳ Alvenaria    │
└─────────────────────────────────────────────────┘

── Atualizações Recentes ──

📸 HOJE
├── [foto] [foto] [foto]
└── "Instalações elétricas..."

📸 12/03/2026
├── [foto] [foto]
└── "Estrutura finalizada"
```

### 4. Explorar Mais

- Ver galeria completa (por etapa)
- Ver cronograma detalhado
- Ver todas as atualizações

---

## 🔄 Automação (por trás)

```
Registrar Atualização
        │
        ▼
┌───────────────────┐
│ Salvar no DB      │
│ + Upload fotos    │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Enviar Email      │
│ (Resend)          │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Notificação       │
│ WhatsApp (API)    │
│ (opcional)        │
└───────────────────┘
```

---

## ✨ Diferenciais do Fluxo

| Ponto | Como é |
|-------|--------|
| **Tempo para registrar** | ~60 segundos (botão grande, fotos, pronto) |
| **Tempo para cliente ver** | Imediato após salvar |
| **Login do cliente** | Não precisa (link é suficiente) |
| **Atualização da obra** | 1 clique para ver progresso |
