FROM node:20 AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy the full workspace so pnpm can resolve the monorepo consistently.
COPY . .

RUN CI=true pnpm install --frozen-lockfile
RUN pnpm --filter frontend build
RUN pnpm --filter core build

FROM node:20 AS runner

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASS=postgres
ENV DB_NAME=job_orchestrer
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV REDIS_PASS=
ENV REDIS_DB=0

EXPOSE 3000

CMD ["node", "apps/core/build/src/main.js"]
