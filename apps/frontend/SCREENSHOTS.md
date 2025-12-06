# Screenshots - Job Orchestrator Frontend

## 📸 Prévia da Interface

### 🏠 Tela Principal - Lista de Jobs

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Job Orchestrator                        Jobs | Sobre        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Jobs Registrados                              [3 jobs]        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ ⚙️  send-email   │  │ ⚙️  process-data │  │ ⚙️  backup   │ │
│  │                  │  │                  │  │              │ │
│  │ Serviço:         │  │ Serviço:         │  │ Serviço:     │ │
│  │ email-service    │  │ data-service     │  │ admin-srv    │ │
│  │                  │  │                  │  │              │ │
│  │ ⏰ 0 9 * * *     │  │ 🔗 1 dependência │  │ ⏰ 0 0 * * 0 │ │
│  │              →   │  │              →   │  │          →   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Características:**
- Auto-refresh a cada 5 segundos
- Cards clicáveis com hover effect
- Indicadores visuais de configuração
- Design responsivo

---

### 🔍 Tela de Detalhes do Job

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Job Orchestrator                        Jobs | Sobre        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [← Voltar]  send-email                                        │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐ │
│  │ 📋 Informações          │  │ ⚙️ Configuração        [✏️] │ │
│  │                         │  │                             │ │
│  │ Topic: send-email       │  │ Cron: 0 9 * * *             │ │
│  │ Serviço: email-service  │  │ Retries: 3                  │ │
│  │ Criado: 05/12/25 10:30  │  │ Dependências: Nenhuma       │ │
│  │ Atualizado: 05/12 14:20 │  │                             │ │
│  └─────────────────────────┘  └─────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🚀 Disparar Job Manualmente                              │ │
│  │                                                           │ │
│  │ Payload (JSON):                                          │ │
│  │ ┌───────────────────────────────────────────────────┐   │ │
│  │ │ {                                                 │   │ │
│  │ │   "to": "user@example.com",                       │   │ │
│  │ │   "subject": "Test Email",                        │   │ │
│  │ │   "body": "Hello from Job Orchestrator!"          │   │ │
│  │ │ }                                                 │   │ │
│  │ └───────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  │                         [▶️ Iniciar Job]                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Visualização completa do job
- Edição inline de configurações
- Validação de JSON para payload
- Feedback visual de sucesso/erro

---

### ℹ️ Tela Sobre

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Job Orchestrator                        Jobs | Sobre        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ⚡ Job Orchestrator                                │
│     Orquestrador de jobs distribuídos usando Kafka             │
│                                                                 │
│  ✨ Funcionalidades                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📝 Registro centralizado    ⏰ Agendamento com cron      │  │
│  │ 🔗 Dependências entre jobs  🔄 Retry automático          │  │
│  │ 📊 Histórico e auditoria    🚀 Trigger manual            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🏗️ Arquitetura                                                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │  🎯  │  │  📦  │  │ 🗄️  │  │  📨  │                      │
│  │ Core │  │ SDK  │  │  DB  │  │Kafka │                      │
│  └──────┘  └──────┘  └──────┘  └──────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Conteúdo:**
- Visão geral do projeto
- Funcionalidades principais
- Arquitetura do sistema
- Exemplo de código

---

## 🎨 Paleta de Cores

- **Primário:** Gradiente roxo (#667eea → #764ba2)
- **Sucesso:** Verde (#48bb78 → #38a169)
- **Erro:** Vermelho (#e53e3e)
- **Fundo:** Cinza claro (#f5f7fa)
- **Texto:** Cinza escuro (#2d3748)
- **Texto secundário:** Cinza médio (#718096)

## 🔄 Animações

- **Fade In:** Entrada suave de elementos
- **Hover:** Elevação de cards e mudança de cor
- **Loading:** Spinner rotativo
- **Transitions:** 0.2s ease para interações

## 📱 Responsividade

- **Desktop:** Grid de 3 colunas
- **Tablet:** Grid de 2 colunas
- **Mobile:** Grid de 1 coluna
- **Breakpoints:** 900px e 768px

---

Desenvolvido com ❤️ usando React + TypeScript + Vite
