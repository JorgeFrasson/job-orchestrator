#!/bin/bash

# Script para testar o disparo manual do job

echo "🚀 Disparando sample-job-topic manualmente..."

curl -X POST http://localhost:3000/jobs/sample-job-topic/start \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "test": true,
      "timestamp": "'$(date -Iseconds)'",
      "message": "Teste manual do job"
    }
  }'

echo ""
echo "✅ Job disparado!"
echo "Verifique os logs do example-service para ver a execução."
