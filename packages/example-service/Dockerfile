FROM node:18-alpine

# Instala pnpm e dependências de build
RUN apk add --no-cache bash python3 make g++ && npm install -g pnpm

WORKDIR /app

# Copia os arquivos do monorepo (ROOT)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copia apenas os packages relevantes (pode ser refinado)
COPY packages ./packages

# Instala dependências do monorepo (inclusive da lib sdk)
RUN pnpm install --frozen-lockfile

# Entra na pasta do service
WORKDIR /app/packages/example-service

# Comando para desenvolvimento
CMD ["pnpm", "dev"]
