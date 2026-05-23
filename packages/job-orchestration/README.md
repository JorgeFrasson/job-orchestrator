# @jorge_henriquef/job-orchestrator-node

SDK Node.js para registrar e executar jobs no Job Orchestrator via Kafka.

## Instalação

```bash
npm install @jorge_henriquef/job-orchestrator-node
```

## Pré-requisitos

- Node.js 18+
- Kafka acessível para o serviço
- Core do Job Orchestrator ativo e consumindo o tópico principal

## Uso rápido

```ts
import { JobOrchestrator, JobOrchestratorSetup } from '@jorge_henriquef/job-orchestrator-node';

await JobOrchestratorSetup.init({
  kafkaBrokers: ['localhost:9092'],
  service: 'billing-service',
  mainTopic: 'job-orchestrer-main',
  topicManagementMode: 'create_if_missing',
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

- `kafkaBrokers: string[]` lista de brokers Kafka.
- `service: string` nome lógico do serviço produtor/consumidor.
- `mainTopic?: string` tópico principal de registro. Padrão: `job-orchestrer-main`.
- `topicManagementMode?: 'validate' | 'create_if_missing'`
- `topicPartitions?: number` padrão: `1`.
- `topicReplicationFactor?: number` padrão: `1`.

## Estratégia de tópicos

- `validate`: recomendado para produção. O SDK valida existência dos tópicos e falha se não existirem.
- `create_if_missing`: recomendado para desenvolvimento local. O SDK tenta criar tópicos ausentes.

## Fluxo de execução

1. O job é registrado no tópico principal.
2. O SDK garante tópicos do job (`<topic>`, `<topic>-start`, `<topic>-end`, `<topic>-fail`).
3. O consumidor do job recebe o comando de execução.
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
  - verifique conectividade com Kafka;
  - evite registrar jobs sem `await` no bootstrap do serviço.
- `UNKNOWN_TOPIC_OR_PARTITION`
  - confirme `mainTopic`;
  - use `create_if_missing` em dev ou provisione tópicos no cluster.
- job não aparece no core
  - valide se SDK e core apontam para o mesmo broker Kafka.
