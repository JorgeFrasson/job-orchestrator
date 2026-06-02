# @jorge_henriquef/job-orchestrator-node

SDK Node.js para registrar e executar jobs no Job Orchestrator via WebSocket.

## Instalação

```bash
npm install @jorge_henriquef/job-orchestrator-node
```

## Pré-requisitos

- Node.js 18+
- Core do Job Orchestrator ativo
- Conectividade de rede entre o serviço e o core

## Uso rápido

```ts
import { JobOrchestrator, JobOrchestratorSetup } from '@jorge_henriquef/job-orchestrator-node';

await JobOrchestratorSetup.init({
  coreUrl: 'ws://localhost:3000',
  service: 'billing-service',
});

await JobOrchestrator.register({
  topic: 'billing-generate-invoice',
  handler: async (payload) => {
    console.log('Executando job:', payload);
  },
  onStart: async (payload) => {
    console.log('Job iniciado', payload);
  },
  onFinish: async (payload) => {
    console.log('Job finalizado', payload);
  },
});
```

## Configuração

`JobOrchestratorSetup.init(options)` aceita:

- `coreUrl?: string` URL do core. Aceita `ws://`, `wss://`, `http://` e `https://`.
- `service: string` nome lógico do serviço trabalhador.
- `reconnectIntervalMs?: number` intervalo de reconexão. Padrão: `3000`.

## Fluxo de execução

1. O SDK conecta ao core via `WebSocket`.
2. O job é registrado na sessão ativa do serviço.
3. O core envia comandos de execução para o worker conectado.
4. O SDK publica eventos de lifecycle (`start`, `end`, `fail`) com `executionId`.

## Exemplo de payload de disparo

Disparo via API do core:

```bash
curl -X POST http://localhost:3000/jobs/billing-generate-invoice/start \
  -H 'Content-Type: application/json' \
  -d '{"payload":{"invoiceId":"inv_123","tenant":"acme"}}'
```

## Troubleshooting

- `The producer is disconnected`
  - verifique conectividade com o core;
  - evite registrar jobs sem `await` no bootstrap do serviço.
- desconexões frequentes
  - valide `coreUrl`;
  - verifique proxy, LB ou timeout de idle connection no ambiente.
- job não aparece no core
  - valide se SDK e core apontam para a mesma instância do core.
