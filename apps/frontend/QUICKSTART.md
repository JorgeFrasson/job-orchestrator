# Guia Rápido - Frontend Job Orchestrator

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
cd /home/jorge/projetos/job-orchestrator
pnpm install
```

### 2. Iniciar o Backend

```bash
# Certifique-se de que o Docker está rodando
docker compose -f docker-compose.dev.yml up --build
```

O backend estará disponível em `http://localhost:3000`

### 3. Iniciar o Frontend

Em outro terminal:

```bash
cd apps/frontend
pnpm dev
```

O frontend estará disponível em `http://localhost:5173`

## 📋 Funcionalidades Implementadas

### ✅ Lista de Jobs
- Visualização em cards de todos os jobs registrados
- Auto-refresh a cada 5 segundos
- Indicadores de configuração (cron, dependências)
- Navegação para detalhes do job

### ✅ Detalhes do Job
- Informações completas (topic, service, datas)
- Edição de configuração:
  - Cron expression
  - Número de retries
  - Dependências entre jobs
- Trigger manual com payload JSON customizado

### ✅ Interface Moderna
- Design responsivo
- Cores com gradientes
- Animações suaves
- Feedback visual de ações

## 🎨 Estrutura de Páginas

```
/ (Home)
├── Lista todos os jobs
└── Click no job → /jobs/:topic

/jobs/:topic
├── Informações do job
├── Edição de configuração
└── Trigger manual

/about
└── Documentação do projeto
```

## 🔌 Endpoints Utilizados

O frontend consome os seguintes endpoints do backend:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/jobs` | Lista todos os jobs |
| GET | `/jobs/:topic` | Detalhes de um job |
| POST | `/jobs/:topic/start` | Inicia um job |
| PATCH | `/jobs/:topic/config` | Atualiza configuração |

## 💡 Exemplos de Uso

### Registrar um Job (via SDK no microsserviço)

```typescript
import { JobOrchestrer } from 'job-orchestration';

JobOrchestrer.Job({
  topic: 'send-email',
  service: 'notification-service',
  function: async (payload) => {
    console.log('Enviando email:', payload);
  }
});
```

### Configurar Cron (via Frontend)

1. Acesse `/jobs/send-email`
2. Clique no ícone de edição (✏️) na seção "Configuração"
3. Preencha a cron expression: `0 9 * * *` (diariamente às 9h)
4. Salve

### Disparar Job Manualmente

1. Acesse `/jobs/send-email`
2. Na seção "Disparar Job Manualmente"
3. Adicione o payload JSON:
```json
{
  "to": "user@example.com",
  "subject": "Test",
  "body": "Hello!"
}
```
4. Clique em "▶️ Iniciar Job"

## 🎯 Próximas Melhorias

### Curto Prazo
- [ ] Dashboard com estatísticas
- [ ] Histórico de execuções
- [ ] Filtros e busca de jobs
- [ ] Logs em tempo real

### Médio Prazo
- [ ] Notificações push
- [ ] Gráficos de performance
- [ ] Export de dados
- [ ] Dark mode

### Longo Prazo
- [ ] Sistema de permissões
- [ ] Agendamento visual (arrastar e soltar)
- [ ] Integração com Slack/Discord
- [ ] Mobile app

## 🐛 Troubleshooting

### Frontend não conecta ao backend
- Verifique se o backend está rodando em `http://localhost:3000`
- Confirme que o CORS está habilitado no backend
- Verifique o arquivo `.env` do frontend

### Jobs não aparecem
- Certifique-se de que ao menos um microsserviço registrou um job
- Verifique os logs do backend
- Teste o endpoint diretamente: `curl http://localhost:3000/jobs`

### Erro ao atualizar configuração
- Verifique se a cron expression é válida
- Confirme que o job existe no banco de dados
- Veja os logs do backend para detalhes do erro

## 📚 Recursos

- [Documentação React](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [React Router](https://reactrouter.com)
- [Cron Expression Generator](https://crontab.guru)

## 🤝 Contribuindo

Para adicionar novas funcionalidades ao frontend:

1. Crie um novo componente em `src/components/` ou página em `src/pages/`
2. Adicione tipos necessários em `src/types/`
3. Estenda o serviço de API em `src/services/api.ts`
4. Adicione a rota em `App.tsx` se necessário
5. Teste e documente

---

Desenvolvido com ❤️ para o Job Orchestrator
