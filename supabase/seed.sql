-- =============================================================================
-- DEV SEED DATA â€” FAKE. For local development only. Never load into production.
-- Every record below is invented sample data; it is not a real user or session.
--
-- Demo accounts (password for both: lockin-demo-123):
--   demo1@lockin.test  â€” has history
--   demo2@lockin.test  â€” has one session (used to eyeball cross-user isolation)
-- =============================================================================

-- Auth users (local GoTrue schema). Emails are pre-confirmed.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
   'authenticated', 'authenticated', 'demo1@lockin.test',
   extensions.crypt('lockin-demo-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"seed":true}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
   'authenticated', 'authenticated', 'demo2@lockin.test',
   extensions.crypt('lockin-demo-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"seed":true}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo1@lockin.test"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222',
   '{"sub":"22222222-2222-4222-8222-222222222222","email":"demo2@lockin.test"}', 'email', now(), now(), now())
on conflict do nothing;

update public.profiles set display_name = '[FAKE] Demo Satu' where id = '11111111-1111-4111-8111-111111111111';
update public.profiles set display_name = '[FAKE] Demo Dua'  where id = '22222222-2222-4222-8222-222222222222';

-- Saved allowlist (demo1)
insert into public.allowlist_entries (user_id, domain, label) values
  ('11111111-1111-4111-8111-111111111111', 'scholar.google.com', 'Google Scholar'),
  ('11111111-1111-4111-8111-111111111111', 'docs.google.com', 'Google Docs'),
  ('11111111-1111-4111-8111-111111111111', 'emas.ui.ac.id', 'EMAS');

-- Completed session (demo1), yesterday, 50 min planned, one break, one face_absent event.
insert into public.sessions (id, user_id, task_goal, planned_seconds, active_elapsed_seconds,
  status, camera_mode, goal_completed, started_at, ended_at)
values ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
  '[FAKE] Tulis bab 2 laporan praktikum', 3000, 3000, 'completed', 'on', true,
  now() - interval '1 day 2 hours', now() - interval '1 day 2 hours' + interval '55 minutes');

insert into public.session_pauses (session_id, user_id, kind, started_at, ended_at) values
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'break',
   now() - interval '1 day 2 hours' + interval '25 minutes',
   now() - interval '1 day 2 hours' + interval '30 minutes');

insert into public.session_events (id, session_id, user_id, type, started_at, ended_at, dismissed) values
  ('eeeeeee1-0000-4000-8000-000000000001', 'aaaaaaa1-0000-4000-8000-000000000001',
   '11111111-1111-4111-8111-111111111111', 'face_absent',
   now() - interval '1 day 2 hours' + interval '40 minutes',
   now() - interval '1 day 2 hours' + interval '41 minutes', true);

insert into public.session_allowlist (session_id, user_id, domain) values
  ('aaaaaaa1-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'docs.google.com');

-- Early-exit session (demo1), camera off, one override.
insert into public.sessions (id, user_id, task_goal, planned_seconds, active_elapsed_seconds,
  status, camera_mode, goal_completed, started_at, ended_at)
values ('aaaaaaa1-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
  '[FAKE] Latihan soal kalkulus bab 4', 1500, 840, 'early_exit', 'off', false,
  now() - interval '3 hours', now() - interval '3 hours' + interval '14 minutes');

insert into public.session_events (id, session_id, user_id, type, started_at, metadata) values
  ('eeeeeee1-0000-4000-8000-000000000002', 'aaaaaaa1-0000-4000-8000-000000000002',
   '11111111-1111-4111-8111-111111111111', 'override',
   now() - interval '3 hours' + interval '9 minutes', '{"domain":"youtube.com"}');

-- demo2: one completed session.
insert into public.sessions (id, user_id, task_goal, planned_seconds, active_elapsed_seconds,
  status, camera_mode, goal_completed, started_at, ended_at)
values ('bbbbbbb2-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
  '[FAKE] Review slide statistika', 1800, 1800, 'completed', 'off', true,
  now() - interval '5 hours', now() - interval '5 hours' + interval '30 minutes');
