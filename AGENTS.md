# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo for a Kafka-based job orchestration system.

- `apps/core`: NestJS orchestration API and Kafka consumer/producer logic under `src/`.
- `apps/frontend`: Vite + React UI in `src/`, with page components in `src/pages` and shared UI in `src/components`.
- `packages/job-orchestration`: reusable SDK used by services that register jobs.
- `packages/example-service`: sample integration service showing SDK usage.
- Root files such as `docker-compose.yml` and `docker-compose.dev.yml` start local infrastructure.

## Build, Test, and Development Commands
Use `pnpm` at the repository root.

- `pnpm install`: install workspace dependencies.
- `pnpm dev:core`: run the NestJS core in watch mode.
- `pnpm dev:web`: run the frontend at `http://localhost:5173`.
- `pnpm build`: build every workspace package and app.
- `pnpm --filter frontend lint`: run the frontend ESLint config.
- `docker compose -f docker-compose.dev.yml up --build`: start Kafka, Postgres, and the development stack.

## Coding Style & Naming Conventions
TypeScript is used throughout the repo. Follow the existing style in each app instead of forcing one global convention.

- `apps/core` currently uses semicolons and NestJS naming such as `jobs.service.ts`, `*.controller.ts`, and DTOs in `dto/`.
- `apps/frontend` uses ESLint with `typescript-eslint`, `react-hooks`, and Vite React refresh rules.
- React components and pages use `PascalCase` filenames, for example `JobList.tsx`.
- Keep CSS files next to the component or page they style, for example `JobList.css`.

## Testing Guidelines
There is no automated test suite configured yet. Validate changes with focused manual checks.

- Run `pnpm build` before opening a PR.
- For frontend changes, run `pnpm --filter frontend lint` and smoke-test the edited route locally.
- For orchestration flows, start the dev stack and verify job registration and config updates through the API and example service.

## Commit & Pull Request Guidelines
Recent commits use short `feat:` prefixes and imperative summaries, for example `feat: implementa frontend em Vite...`.

- Prefer commit messages like `feat: add job retry endpoint` or `fix: handle Kafka reconnect`.
- Keep PRs scoped to one concern.
- Include a short description, affected apps/packages, manual verification steps, and linked issues.
- Add screenshots for frontend changes and sample requests/responses for API changes.

## Configuration Tips
Prefer `pnpm` over `npm` here because the workspace is defined in `pnpm-workspace.yaml`. Check Docker and Kafka/Postgres connectivity before debugging application code.
