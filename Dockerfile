# -------- Stage 1: build --------
FROM node:20 AS builder
WORKDIR /app

# Instala pnpm globalmente
RUN npm install -g pnpm

# Copia apenas os arquivos de manifesto
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/core/package.json ./apps/core/
COPY packages ./packages

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia o código completo
COPY apps/frontend ./apps/frontend
COPY apps/core ./apps/core

# Build do frontend (Vite)
RUN pnpm --filter frontend build

# Build do backend (NestJS)
RUN pnpm --filter core build

# -------- Stage 2: runtime --------
FROM node:20 AS runner
WORKDIR /app

# Instala pnpm no container final
RUN npm install -g pnpm

# Copia o build do backend e frontend
COPY --from=builder /app/apps/core/dist ./apps/core/dist
COPY --from=builder /app/apps/frontend/dist ./public

# Copia apenas o necessário para instalar dependências runtime
COPY apps/core/package.json ./apps/core/
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY packages ./packages

# Instala somente dependências de produção do core
RUN pnpm install --frozen-lockfile --prod --filter core...

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
# --- Postgres ---
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASS=postgres
ENV DB_NAME=job_orchestrer
# --- Redis ---
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV REDIS_PASS=
ENV REDIS_DB=0

EXPOSE 3000

# Comando de inicialização
CMD ["node", "apps/core/dist/src/main.js"]
