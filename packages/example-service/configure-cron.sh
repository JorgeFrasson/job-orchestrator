#!/bin/bash

# Script para configurar o job de exemplo para rodar de 10 em 10 segundos

echo "⚙️  Configurando sample-job-topic para rodar de 10 em 10 segundos..."

curl -X PATCH http://localhost:3000/jobs/sample-job-topic/config \
  -H "Content-Type: application/json" \
  -d '{
    "cron": "*/10 * * * * *",
    "retries": 3
  }'

echo ""
echo "✅ Configuração aplicada!"
echo ""
echo "O job agora executará automaticamente a cada 10 segundos."
echo "Você pode acompanhar os logs com: docker compose logs -f"
