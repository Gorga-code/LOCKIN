-- Session history: user-editable session name and note, plus per-session task lists.
--
-- Solo sessions use a task list and an open-ended timer instead of a single goal and planned
-- duration, so task_goal and planned_seconds become optional. Their existing checks still apply
-- whenever a value is present (a CHECK passes on NULL).

alter table public.sessions alter column task_goal drop not null;
alter table public.sessions alter column planned_seconds drop not null;

alter table public.sessions
  add column title text
    check (title is null or char_length(btrim(title)) between 1 and 120),
  add column note text
    check (note is null or char_length(note) <= 5000);

-- ---------------------------------------------------------------------------
-- session_tasks
-- ---------------------------------------------------------------------------
create table public.session_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null default auth.uid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  done boolean not null default false,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  constraint session_tasks_session_fk foreign key (session_id, user_id)
    references public.sessions (id, user_id) on delete cascade,
  constraint session_tasks_position_unique unique (session_id, position)
);

create index session_tasks_session_idx on public.session_tasks (session_id, position);

grant select, insert, update, delete on public.session_tasks to authenticated;

alter table public.session_tasks enable row level security;

create policy session_tasks_select_own on public.session_tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy session_tasks_insert_own on public.session_tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy session_tasks_update_own on public.session_tasks
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy session_tasks_delete_own on public.session_tasks
  for delete to authenticated using (user_id = (select auth.uid()));
