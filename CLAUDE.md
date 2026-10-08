# CLAUDE.md — LOCKIN Contributor Guide

## Commands
- `npm run dev`: Start Next.js local development server (port 3000)
- `npm run build`: Production Next.js build
- `npm run lint`: Run ESLint checks
- `npm run typecheck`: Run TypeScript verification (`tsc --noEmit`)
- `npm run format`: Prettier format write
- `npm run test`: Run Vitest unit tests
- `npm run test:rls`: Run Vitest cross-user RLS integration tests
- `npm run test:e2e`: Run Playwright end-to-end browser workflows
- `npm run db:start`: Start local Supabase container (requires Docker)
- `npm run db:reset`: Reset database and re-apply migrations + seed
- `npm run ext:build`: Build unpacked Chrome extension

## Non-Negotiable Guardrails
1. **Raw video/frames are never uploaded, stored, or sent anywhere**. All MediaPipe vision inference executes locally in browser Web Worker.
2. **Never label time as "verified productive/focus time"**. UI copy and documentation strictly uses "recorded session time".
3. **Users see only their own records**. Strict Row-Level Security (RLS) is applied on every user-owned table.
4. **Never trust client-submitted user IDs**. All Route Handlers derive user ID strictly from the authenticated Supabase session (`requireUser()`).
5. **No vector/embedding columns yet**. AI Coach reflection table is structured for post-session asynchronous inference without vector dependencies in release 1.
6. **Mark all mocks and fake data clearly**. Seed data and test fixtures are marked with `[FAKE]`.

## Architecture & Conventions
- **App Router**: Next.js App Router with React 19 and Tailwind CSS v4.
- **i18n**: Multi-lingual (Indonesian default `id`, English `en`) via `next-intl`. All UI text is catalog-backed.
- **Database/Auth**: Supabase PostgreSQL with RLS, GoTrue email/password and Google OAuth.
- **Chrome Extension**: Manifest V3 in `/extension` using `declarativeNetRequest`.
