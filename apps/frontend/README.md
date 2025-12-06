# Frontend - Job Orchestrator

Interface web moderna para gerenciamento do Job Orchestrator.

## 🚀 Funcionalidades

- ✅ **Listagem de Jobs**: Visualize todos os jobs registrados no orquestrador
- 🔍 **Detalhes do Job**: Veja informações completas sobre cada job
- ⚙️ **Configuração**: Edite cron, retries e dependências
- 🚀 **Trigger Manual**: Execute jobs manualmente com payload customizado
- 🔄 **Auto-refresh**: Atualização automática da lista de jobs
- 📱 **Responsivo**: Interface adaptada para desktop e mobile

## 🛠️ Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router** - Roteamento
- **TanStack Query** - Gerenciamento de estado e cache
- **CSS Modules** - Estilização

## 📦 Instalação

```bash
# No diretório raiz do monorepo
pnpm install

# Ou apenas no frontend
cd apps/frontend
pnpm install
```

## 🏃 Executando

### Desenvolvimento

```bash
# No diretório do frontend
pnpm dev

# Ou do diretório raiz
pnpm --filter frontend dev
```

O frontend estará disponível em `http://localhost:5173`

### Build para Produção

```bash
pnpm build
```

Os arquivos otimizados serão gerados em `dist/`

## ⚙️ Configuração

Crie um arquivo `.env` no diretório `apps/frontend`:

```env
VITE_API_URL=http://localhost:3000
```

## 📁 Estrutura

```
src/
├── components/       # Componentes reutilizáveis
│   ├── Header.tsx
│   └── Layout.tsx
├── pages/           # Páginas da aplicação
│   ├── JobList.tsx
│   ├── JobDetail.tsx
│   └── About.tsx
├── services/        # Serviços de API
│   └── api.ts
├── types/           # Tipos TypeScript
│   └── job.types.ts
├── App.tsx          # Componente principal
└── main.tsx         # Entry point
```

## 🎨 Páginas

### Home (`/`)
Lista todos os jobs registrados com informações básicas e status de configuração.

### Detalhes do Job (`/jobs/:topic`)
- Informações completas do job
- Edição de configurações (cron, retries, dependências)
- Trigger manual com payload JSON customizado

### Sobre (`/about`)
Documentação sobre o projeto e arquitetura.

## 🔌 Integração com Backend

O frontend se comunica com o backend através de endpoints REST:

- `GET /jobs` - Lista todos os jobs
- `GET /jobs/:topic` - Busca um job específico
- `POST /jobs/:topic/start` - Inicia um job manualmente
- `PATCH /jobs/:topic/config` - Atualiza configuração do job

## 🎯 Próximos Passos

- [ ] Implementar dashboard com métricas
- [ ] Adicionar histórico de execuções
- [ ] Visualização de logs em tempo real
- [ ] Notificações de falhas
- [ ] Testes unitários e e2e
- [ ] Dark mode

## 📝 Licença

Este projeto faz parte do Job Orchestrator monorepo.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
