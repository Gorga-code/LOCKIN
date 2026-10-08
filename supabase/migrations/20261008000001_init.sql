-- LOCKIN release 1: initial schema.
-- Every user-owned table carries user_id, has RLS enabled, and is scoped to auth.uid().
-- Child tables use a composite FK (session_id, user_id) -> sessions(id, user_id) so a row
-- can never point at another user's session, even if RLS were misconfigured.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.session_status as enum ('active', 'paused', 'completed', 'early_exit');
create type public.camera_mode as enum ('on', 'off');
create type public.pause_kind as enum ('pause', 'break');
create type public.session_event_type as enum (
  'face_absent',
  'phone_visible',
  'override',
  'camera_unavailable',
  'monitoring_gap'
);
create type public.reflection_status as enum ('pending', 'ready', 'failed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Hostname validation for allowlists: lowercase labels, at least one dot, no scheme/path.
create or replace function public.is_valid_domain(d text)
returns boolean
language sql
immutable
as $$
  select d ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$' and char_length(d) <= 253;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  locale text not null default 'id' check (locale in ('id', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile for each new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  task_goal text not null check (char_length(btrim(task_goal)) between 1 and 200),
  planned_seconds integer not null check (planned_seconds > 0 and planned_seconds <= 43200),
  -- Accumulated active time of *closed* active segments. The current segment (if status = active)
  -- runs from last_resumed_at. Pauses/breaks never count as active time.
  active_elapsed_seconds integer not null default 0 check (active_elapsed_seconds >= 0),
  last_resumed_at timestamptz,
  status public.session_status not null default 'active',
  camera_mode public.camera_mode not null default 'off',
  goal_completed boolean,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_id_user_unique unique (id, user_id),
  constraint sessions_ended_consistency check (
    (status in ('completed', 'early_exit')) = (ended_at is not null)
  ),
  constraint sessions_active_has_resume check (
    (status = 'active') = (last_resumed_at is not null)
  ),
  constraint sessions_ended_after_start check (ended_at is null or ended_at >= started_at)
);

-- At most one open (active/paused) session per user.
create unique index sessions_one_open_per_user on public.sessions (user_id)
  where status in ('active', 'paused');
create index sessions_user_started_idx on public.sessions (user_id, started_at desc);

create trigger sessions_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- session_pauses
-- ---------------------------------------------------------------------------
create table public.session_pauses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  kind public.pause_kind not null default 'pause',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  constraint session_pauses_session_fk foreign key (session_id, user_id)
    references public.sessions (id, user_id) on delete cascade,
  constraint session_pauses_order check (ended_at is null or ended_at >= started_at)
);

create unique index session_pauses_one_open on public.session_pauses (session_id)
  where ended_at is null;
create index session_pauses_session_idx on public.session_pauses (session_id, started_at);

-- ---------------------------------------------------------------------------
-- session_events (client-generated UUIDs for idempotent retry)
-- ---------------------------------------------------------------------------
create table public.session_events (
  id uuid primary key,
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  type public.session_event_type not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  dismissed boolean not null default false,
  dismissed_at timestamptz,
  -- Small, non-identifying metadata only (e.g. {"domain":"youtube.com"} for overrides,
  -- {"reason":"permission_denied"} for camera_unavailable). Never images or video.
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 2048),
  created_at timestamptz not null default now(),
  constraint session_events_session_fk foreign key (session_id, user_id)
    references public.sessions (id, user_id) on delete cascade,
  constraint session_events_order check (ended_at is null or ended_at >= started_at)
);

create index session_events_session_idx on public.session_events (session_id, started_at);

-- ---------------------------------------------------------------------------
-- allowlist_entries (user-level saved sites)
-- ---------------------------------------------------------------------------
create table public.allowlist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  domain text not null check (public.is_valid_domain(domain)),
  label text check (label is null or char_length(label) <= 80),
  created_at timestamptz not null default now(),
  constraint allowlist_entries_unique unique (user_id, domain)
);

-- ---------------------------------------------------------------------------
-- session_allowlist (sites chosen for a specific session)
-- ---------------------------------------------------------------------------
create table public.session_allowlist (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  domain text not null check (public.is_valid_domain(domain)),
  created_at timestamptz not null default now(),
  constraint session_allowlist_session_fk foreign key (session_id, user_id)
    references public.sessions (id, user_id) on delete cascade,
  constraint session_allowlist_unique unique (session_id, domain)
);

-- ---------------------------------------------------------------------------
-- reflections (AI-readiness: created now, unused in release 1)
-- ---------------------------------------------------------------------------
create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  status public.reflection_status not null default 'pending',
  json jsonb,
  model text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  feedback smallint check (feedback is null or feedback in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reflections_session_fk foreign key (session_id, user_id)
    references public.sessions (id, user_id) on delete cascade,
  constraint reflections_one_per_session unique (session_id)
);

create trigger reflections_updated_at before update on public.reflections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges: nothing for anon; authenticated goes through RLS.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.sessions,
  public.session_pauses,
  public.session_events,
  public.allowlist_entries,
  public.session_allowlist,
  public.reflections
to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.session_pauses enable row level security;
alter table public.session_events enable row level security;
alter table public.allowlist_entries enable row level security;
alter table public.session_allowlist enable row level security;
alter table public.reflections enable row level security;

-- profiles: read/update own row only. Inserts happen via trigger; deletes cascade from auth.users.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Generic owner policies for the remaining tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'sessions', 'session_pauses', 'session_events',
    'allowlist_entries', 'session_allowlist', 'reflections'
  ] loop
    execute format(
      'create policy %1$s_select_own on public.%1$I for select to authenticated
         using (user_id = (select auth.uid()));', t);
    execute format(
      'create policy %1$s_insert_own on public.%1$I for insert to authenticated
         with check (user_id = (select auth.uid()));', t);
    execute format(
      'create policy %1$s_update_own on public.%1$I for update to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));', t);
    execute format(
      'create policy %1$s_delete_own on public.%1$I for delete to authenticated
         using (user_id = (select auth.uid()));', t);
  end loop;
end;
$$;
