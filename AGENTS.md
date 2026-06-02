# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` monorepo for a WebSocket-based job orchestration system with SQLite as the default local persistence.

- `apps/core`: NestJS orchestration API, WebSocket worker gateway, scheduler, and persistence under `src/`.
- `apps/frontend`: Vite + React UI in `src/`, with page components in `src/pages` and shared UI in `src/components`.
- `packages/job-orchestration`: reusable SDK used by services that register jobs.
- `packages/example-service`: sample integration service showing SDK usage.
- Root files such as `docker-compose.yml` and `docker-compose.dev.yml` start the local containerized core.

## Build, Test, and Development Commands
Use `pnpm` at the repository root.

- `pnpm install`: install workspace dependencies.
- `pnpm dev:core`: run the NestJS core in watch mode.
- `pnpm dev:web`: run the frontend at `http://localhost:5173`.
- `pnpm build`: build every workspace package and app.
- `pnpm --filter frontend lint`: run the frontend ESLint config.
- `docker compose -f docker-compose.dev.yml up --build`: start the containerized development core.

## Coding Style & Naming Conventions
TypeScript is used throughout the repo. Follow the existing style in each app instead of forcing one global convention.

- `apps/core` currently uses semicolons and NestJS naming such as `jobs.service.ts`, `*.controller.ts`, and DTOs in `dto/`.
- `apps/frontend` uses ESLint with `typescript-eslint`, `react-hooks`, and Vite React refresh rules.
- React components and pages use `PascalCase` filenames, for example `JobList.tsx`.
- Keep CSS files next to the component or page they style, for example `JobList.css`.

## Testing Guidelines
Automated tests exist for the core and SDK. Validate changes with both tests and focused manual checks.

- Run `pnpm build` before opening a PR.
- Run `pnpm --filter core test` and `pnpm --filter @jorge_henriquef/job-orchestrator-node test` when touching orchestration code.
- For frontend changes, run `pnpm --filter frontend lint` and smoke-test the edited route locally.
- For orchestration flows, start the dev stack and verify job registration and config updates through the API and example service.

## Commit & Pull Request Guidelines
Recent commits use short `feat:` prefixes and imperative summaries, for example `feat: add job execution history`.

- Prefer commit messages like `feat: add job retry endpoint` or `fix: handle worker reconnect`.
- Keep PRs scoped to one concern.
- Include a short description, affected apps/packages, manual verification steps, and linked issues.
- Add screenshots for frontend changes and sample requests/responses for API changes.

## Configuration Tips
Prefer `pnpm` over `npm` here because the workspace is defined in `pnpm-workspace.yaml`. The core creates its SQLite database automatically under `apps/core/data` at runtime, so database setup should not be part of local troubleshooting unless you are debugging persistence itself.
