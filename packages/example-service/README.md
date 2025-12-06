# Example Service - Job Orchestrator

Serviço de exemplo que demonstra como usar o SDK do Job Orchestrator.

## 🎯 Job Configurado

**Topic:** `sample-job-topic`

**Funcionalidade:** Job de demonstração que:
- Registra cada execução
- Mostra timestamp e contador
- Processa payload recebido
- Simula trabalho assíncrono (500ms)

## 🚀 Como Usar

### 1. Iniciar o Example Service

```bash
# Via Docker (junto com todo o stack)
cd packages/example-service
docker compose up --build

# Ou localmente
npm install
npm start
```

### 2. Configurar para Rodar Automaticamente (10 em 10 segundos)

**Opção A: Usar o script**
```bash
cd packages/example-service
./configure-cron.sh
```

**Opção B: Via cURL diretamente**
```bash
# Configurar cron para executar a cada 10 segundos
curl -X PATCH http://localhost:3000/jobs/sample-job-topic/config \
  -H "Content-Type: application/json" \
  -d '{"cron": "*/10 * * * * *", "retries": 3}'
```

**Outras configurações de cron úteis:**
```bash
# A cada 30 segundos
curl -X PATCH http://localhost:3000/jobs/sample-job-topic/config \
  -H "Content-Type: application/json" \
  -d '{"cron": "*/30 * * * * *"}'

# A cada minuto
curl -X PATCH http://localhost:3000/jobs/sample-job-topic/config \
  -H "Content-Type: application/json" \
  -d '{"cron": "0 * * * * *"}'

# Diariamente às 9h
curl -X PATCH http://localhost:3000/jobs/sample-job-topic/config \
  -H "Content-Type: application/json" \
  -d '{"cron": "0 0 9 * * *"}'
```

**Opção C: Via Frontend**
1. Acesse http://localhost:5173
2. Clique no job `sample-job-topic`
3. Clique no ícone de edição (✏️)
4. Configure:
   - **Cron:** `*/10 * * * * *`
   - **Retries:** `3`
5. Salve

### 3. Testar Manualmente

**Opção A: Usar o script**
```bash
cd packages/example-service
./trigger-job.sh
```

**Opção B: Via cURL diretamente**
```bash
# Disparar job com payload simples
curl -X POST http://localhost:3000/jobs/sample-job-topic/start \
  -H "Content-Type: application/json" \
  -d '{"payload": {"test": true, "message": "Hello from cURL!"}}'

# Disparar job com payload complexo
curl -X POST http://localhost:3000/jobs/sample-job-topic/start \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "action": "process",
      "data": {
        "userId": 123,
        "items": ["item1", "item2"]
      },
      "timestamp": "'$(date -Iseconds)'"
    }
  }'

# Disparar job sem payload
curl -X POST http://localhost:3000/jobs/sample-job-topic/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Opção C: Via Frontend**
1. Acesse http://localhost:5173/jobs/sample-job-topic
2. Na seção "Disparar Job Manualmente"
3. Adicione o payload JSON
4. Clique em "▶️ Iniciar Job"

## 📊 Logs Esperados

Quando o job executa, você verá:

```
============================================================
🚀 [2025-12-06T10:30:00.000Z] Sample Job Executado!
📊 Execução #1
📦 Payload recebido: {
  "test": true,
  "message": "Hello!"
}
⚙️  Processando...
✅ Job finalizado com sucesso!
============================================================
```

## ⏰ Expressões Cron

| Expressão | Descrição |
|-----------|-----------|
| `*/10 * * * * *` | A cada 10 segundos |
| `*/30 * * * * *` | A cada 30 segundos |
| `0 * * * * *` | A cada minuto |
| `0 */5 * * * *` | A cada 5 minutos |
| `0 0 * * * *` | A cada hora |
| `0 0 9 * * *` | Diariamente às 9h |

## 🔧 Personalização

### Modificar o Job

Edite `src/jobs/SampleJob.ts`:

```typescript
public async execute(payload?: any): Promise<void> {
  // Sua lógica aqui
  console.log('Executando job!');
  
  // Processar payload
  if (payload?.action === 'send-email') {
    await this.sendEmail(payload.to, payload.subject);
  }
}
```

### Criar Novos Jobs

Em `src/index.ts`, adicione:

```typescript
JobOrchestrer.Job({
  topic: 'my-new-job',
  function: async (payload) => {
    console.log('Novo job executando!', payload);
  },
  onStart: async (payload) => {
    console.log('Iniciando...');
  },
  onFinish: async (payload) => {
    console.log('Finalizado!');
  }
});
```

## 📁 Estrutura

```
example-service/
├── src/
│   ├── config/           # Inversify container
│   ├── jobs/
│   │   └── SampleJob.ts  # Implementação do job
│   └── index.ts          # Entry point e registro
├── configure-cron.sh     # Script para configurar cron
├── trigger-job.sh        # Script para testar manualmente
└── docker-compose.yml    # Docker config
```

## 🐛 Troubleshooting

### Job não aparece no frontend
- Verifique se o example-service está rodando
- Confirme conexão com Kafka
- Veja logs: `docker compose logs example-service`

### Job não executa automaticamente
- Verifique se o cron foi configurado
- Confirme via frontend: http://localhost:5173/jobs/sample-job-topic
- O core precisa implementar o scheduler (node-cron)

### Erro de conexão Kafka
- Verifique se Kafka está rodando
- Confirme o broker: `kafka:29092`
- Use `docker compose logs kafka`

## 🎯 Próximos Passos

- [ ] Adicionar mais jobs de exemplo
- [ ] Implementar tratamento de erros
- [ ] Adicionar testes unitários
- [ ] Documentar padrões de uso
- [ ] Exemplos com banco de dados
- [ ] Exemplos com APIs externas

---

Desenvolvido como exemplo para o Job Orchestrator
