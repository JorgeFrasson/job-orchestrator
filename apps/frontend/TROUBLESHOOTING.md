# Troubleshooting - Job Orchestrator Frontend

## 🔧 Problemas Comuns e Soluções

### 1. Frontend não inicia

**Erro:** `command not found: pnpm`

**Solução:**
```bash
npm install -g pnpm
```

---

**Erro:** `Cannot find module '@tanstack/react-query'`

**Solução:**
```bash
cd apps/frontend
pnpm install
```

---

### 2. Não consegue conectar ao backend

**Sintoma:** Lista de jobs vazia ou erro de conexão

**Checklist:**
1. Backend está rodando?
   ```bash
   curl http://localhost:3000/jobs
   ```

2. CORS está habilitado no backend?
   - Verifique `apps/core/src/main.ts`
   - Deve ter `app.enableCors()`

3. URL da API está correta?
   - Arquivo: `apps/frontend/.env`
   - Deve conter: `VITE_API_URL=http://localhost:3000`

4. Reinicie o frontend após alterar `.env`:
   ```bash
   # Ctrl+C para parar
   pnpm dev
   ```

---

### 3. Jobs não aparecem na lista

**Possíveis causas:**

1. **Nenhum job foi registrado**
   - Execute o `example-service` para registrar um job de teste
   - Verifique logs do backend

2. **Erro no banco de dados**
   - Verifique se PostgreSQL está rodando
   - Confirme as credenciais em `docker-compose.dev.yml`

3. **Kafka não conectado**
   - Verifique se Kafka está rodando: `docker ps`
   - Veja logs: `docker compose logs kafka`

**Solução:**
```bash
# Reinicie todos os serviços
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

---

### 4. Erro ao atualizar configuração

**Erro:** `Job config não encontrado`

**Causa:** A tabela `job_configs` não está criada ou não tem relação com o job

**Solução:**
1. Verifique se as migrations rodaram:
   ```bash
   docker compose logs core
   ```

2. Se necessário, recrie o banco:
   ```bash
   docker compose down -v
   docker compose up --build
   ```

---

### 5. JSON inválido ao disparar job

**Erro:** `Payload JSON inválido`

**Solução:**
- Use um validador JSON: https://jsonlint.com
- Exemplo válido:
  ```json
  {
    "key": "value",
    "nested": {
      "data": 123
    }
  }
  ```
- **Não** use aspas simples
- **Não** deixe vírgulas trailing

---

### 6. Erros de TypeScript

**Erro:** `Type imports must use 'import type'`

**Solução:** Já corrigido! Se aparecer novamente:
```typescript
// ❌ Errado
import { Type } from './types';

// ✅ Correto
import type { Type } from './types';
```

---

### 7. Build falha

**Erro:** `TypeScript errors in build`

**Solução:**
```bash
# Limpe e reinstale
rm -rf node_modules dist
pnpm install
pnpm build
```

---

### 8. Hot Reload não funciona

**Sintoma:** Alterações não aparecem automaticamente

**Soluções:**

1. Verifique se está rodando em modo dev:
   ```bash
   pnpm dev  # ✅ Correto
   # Não use 'pnpm build'
   ```

2. Reinicie o servidor de dev:
   ```bash
   # Ctrl+C
   pnpm dev
   ```

3. Limpe o cache do Vite:
   ```bash
   rm -rf .vite
   pnpm dev
   ```

---

### 9. Porta 5173 já em uso

**Erro:** `Port 5173 is already in use`

**Soluções:**

1. Mate o processo usando a porta:
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

2. Ou use outra porta:
   ```bash
   pnpm dev -- --port 5174
   ```

---

### 10. Imagens/Assets não carregam

**Causa:** Caminho incorreto

**Solução:**
```typescript
// ✅ Use import para assets
import logo from './assets/logo.svg';

// Ou coloque em public/
// Acesse como: /logo.svg
```

---

## 🐛 Debug Avançado

### Inspecionar Requisições

1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Filtre por "Fetch/XHR"
4. Verifique:
   - Status Code (deve ser 200)
   - Response (dados retornados)
   - Headers (CORS, Content-Type)

### Ver Estado do React Query

1. Instale React Query DevTools (já incluído em dev):
   ```typescript
   // Em App.tsx, adicione:
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
   
   <ReactQueryDevtools initialIsOpen={false} />
   ```

2. Aparecerá um ícone no canto da tela
3. Clique para ver queries, cache, etc.

### Logs Detalhados

Adicione logs em pontos estratégicos:

```typescript
// Em services/api.ts
console.log('Fetching:', endpoint);
console.log('Response:', response);

// Em componentes
console.log('Jobs:', jobs);
console.log('Error:', error);
```

---

## 📞 Ainda com Problemas?

1. Verifique os logs completos:
   ```bash
   # Backend
   docker compose logs core
   
   # Frontend (console do navegador)
   # DevTools > Console
   ```

2. Teste endpoints manualmente:
   ```bash
   # Lista jobs
   curl http://localhost:3000/jobs
   
   # Detalhes de um job
   curl http://localhost:3000/jobs/send-email
   
   # Trigger job
   curl -X POST http://localhost:3000/jobs/send-email/start \
     -H "Content-Type: application/json" \
     -d '{"payload": {"test": true}}'
   ```

3. Verifique versões:
   ```bash
   node --version  # v18+
   pnpm --version  # 10+
   docker --version
   ```

---

## ✅ Checklist de Verificação

Antes de reportar um bug, confirme:

- [ ] Backend está rodando (`docker ps`)
- [ ] Frontend está rodando (`pnpm dev`)
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Arquivo `.env` configurado
- [ ] Porta 3000 (backend) livre
- [ ] Porta 5173 (frontend) livre
- [ ] PostgreSQL conectado
- [ ] Kafka rodando
- [ ] Console do navegador sem erros críticos

---

**Última atualização:** Dezembro 2025
