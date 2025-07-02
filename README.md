# Job Orchestrer

Orquestrador de jobs distribuídos para microsserviços Node.js usando Kafka, com core centralizado, SDK para integração simples e suporte a configuração dinâmica via HTTP.

---

## Visão Geral

O **Job Orchestrer** permite que múltiplos microsserviços registrem e executem jobs (agendados ou por evento) de forma centralizada e auditável.
A arquitetura é baseada em Kafka para comunicação e desacoplamento, e PostgreSQL para persistência e histórico dos jobs.

---

## Estrutura do Monorepo

```
.
├── apps
│   └── core                # Serviço principal de orquestração (NestJS)
├── packages
│   ├── job-orchestration   # SDK para integração dos microsserviços
│   └── example-service     # Exemplo de microserviço usando o SDK
├── docker-compose.yml
├── docker-compose.dev.yml
└── ...
```

### **apps/core**
- Serviço principal (NestJS).
- Expõe endpoints HTTP para controle e configuração dos jobs.
- Registra e gerencia jobs recebidos via Kafka.
- Persistência no PostgreSQL.

### **packages/job-orchestration**
- SDK para facilitar o registro e execução de jobs nos microsserviços.
- Abstrai a comunicação com o core via Kafka.
- Permite registrar jobs com apenas `topic` e `service`.

### **packages/example-service**
- Exemplo prático de um microserviço integrando o SDK e registrando jobs no orquestrador.

---

## Como rodar o projeto

### 1. **Pré-requisitos**
- Docker e Docker Compose
- Node.js (v18+) e pnpm (para desenvolvimento local)

### 2. **Configuração do banco de dados**
- Você pode usar um Postgres externo ou subir um container próprio.
- No desenvolvimento via WSL, use o IP do WSL como `DB_HOST` (veja `.env` ou `docker-compose.dev.yml`).

### 3. **Subindo o core e dependências (modo dev)**

```sh
docker compose -f docker-compose.dev.yml up --build
```

- O serviço principal ficará disponível em `http://localhost:3000`
- O core irá criar automaticamente as tabelas necessárias no banco.

### 4. **Instalando o SDK em um microserviço**

No diretório do seu microserviço:

```sh
pnpm add ../job-orchestration
```

Ou, se for publicar o SDK em um registry privado, instale normalmente via npm/pnpm/yarn.

---

## Exemplo de registro de JOB via SDK

No seu serviço (exemplo em `packages/example-service/src/index.ts`):

```typescript
import { JobOrchestrer } from 'job-orchestration';

JobOrchestrer.Job({
  topic: 'sample-job',
  service: 'example-service',
  function: async (payload) => {
    // Lógica do job
    console.log('Job executado!', payload);
  },
  onStart: async (payload) => {
    console.log('Job iniciando...', payload);
  },
  onFinish: async (payload) => {
    console.log('Job finalizado!', payload);
  }
});
```

- Apenas `topic` e `service` são obrigatórios.
- O core irá persistir o job cadastrado e expor endpoints para configuração de triggers (cron, dependências, etc).

---

## Configurando triggers e agendamento

Após registrar o job, use o endpoint HTTP do core para configurar o agendamento (`cron`, dependências, etc):

```http
PATCH /jobs/:topic/config
Content-Type: application/json

{
  "cron": "0 * * * *", // exemplo: todo início de hora
  "dependsOn": ["outro-job"]
}
```

---

## Observações

- O core centraliza toda a configuração de execução e agendamento.
- Os microsserviços apenas registram o job e implementam a lógica.
- O fluxo de ciclo de vida (`onStart`, `onFinish`) é suportado via SDK.
- O histórico e status dos jobs ficam persistidos no banco.

---

## Contribuição

Pull requests e sugestões são bem-vindos!
Abra issues para bugs, dúvidas ou ideias de melhoria.
