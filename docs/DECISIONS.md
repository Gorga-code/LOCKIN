# Architectural & Technical Decision Records (ADR)

## D-001: Next.js Route Handlers + Supabase instead of FastAPI
- **Status**: Accepted
- **Context**: The preliminary AI Coach sketch showed FastAPI, but the primary product spec and project requirements mandate Next.js App Router Route Handlers with Supabase PostgreSQL and Row Level Security.
- **Decision**: Consolidate backend API entirely in Next.js Route Handlers (`src/app/api/...`), deriving user identity from verified Supabase session cookies.

## D-002: Hard-delete semantics for session history
- **Status**: Accepted
- **Context**: Product specification (US08) requires user-controlled history deletion.
- **Decision**: Implement cascading hard deletion for user sessions and their associated pauses, events, and allowlist items upon confirmed user deletion.

## D-003: App Router Cache Components
- **Status**: Accepted
- **Context**: In Next.js 16, `cacheComponents` defaults to Partial Prerendering and React Activity component preservation across navigations.
- **Decision**: Set `cacheComponents: false` to ensure standard navigation and unmounting behaviors, ensuring all media tracks (`MediaStreamTrack.stop()`) cleanly terminate when navigating away from camera sessions.

## D-004: i18n Strategy (Indonesian default)
- **Status**: Accepted
- **Context**: Primary target users are Indonesian university students, with English support.
- **Decision**: Use `next-intl` with cookie-backed locale selection (`lockin_locale`). Default locale is `id` (Bahasa Indonesia) with English (`en`) fallback. No hard-coded UI strings.

## D-005: Local Computer Vision Model Selection
- **Status**: Accepted
- **Context**: Camera monitoring for presence and phone detection must operate locally without streaming video to external servers.
- **Decision**: MediaPipe Tasks Vision Web Worker. Presence via MediaPipe Face Detector; phone detection via Object Detector with COCO labels including "cell phone" (Apache 2.0 license).

## D-006: Solo sessions saved on stop, with a task list instead of a single goal
- **Status**: Accepted
- **Context**: The solo session flow uses a task list and an open-ended timer, not one task goal and a planned duration. History must show tasks, recorded time, pauses, start time, and a user-editable name and note.
- **Decision**: Make `sessions.task_goal` and `sessions.planned_seconds` optional, add `sessions.title` and `sessions.note`, and add an RLS-protected `session_tasks` table. A finished session is sent once to `POST /api/sessions`; the server derives recorded time from the start/end/pause timestamps rather than trusting the client timer. Renaming and notes go through `PATCH /api/sessions/[id]`.
- **Trade-off**: A session closed without pressing Stop (tab closed, crash) is not saved. Server-tracked start/pause/resume can replace this later.
