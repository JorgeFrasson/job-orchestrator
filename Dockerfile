FROM node:20 AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN CI=true pnpm install --frozen-lockfile --ignore-scripts=false
RUN pnpm rebuild sqlite3
RUN pnpm --filter frontend build
RUN pnpm --filter core build
RUN pnpm --filter example-service build

FROM node:20 AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app /app

RUN CI=true pnpm install --prod --offline --frozen-lockfile --ignore-scripts=false
RUN pnpm rebuild sqlite3

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/core/build/src/main.js"]
