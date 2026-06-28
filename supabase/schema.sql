-- xBLiMPs / CHILDES — Postgres schema, RLS, signup trigger.
-- Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Access model: each profile has an `apps` array (e.g. {'xblimps'} or {'xblimps','childes'}).
-- All persisted records live in one `records` table tagged with `app`. RLS lets a caller
-- touch a row only if that row's app is in their `apps`. So a user without 'childes' in
-- their profile literally cannot SELECT/INSERT/UPDATE/DELETE CHILDES rows — the CHILDES
-- project is invisible to xBLiMPs-only users at the database layer, not just the UI.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  role text not null default 'native_speaker',     -- coordinator | lead | native_speaker | reviewer
  languages text[] not null default '{}',
  apps text[] not null default array['xblimps'],    -- which app modules this user can access
  state text not null default 'active',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- ---------- records (single jsonb-backed store for all app data) ----------
create table if not exists public.records (
  row_uid uuid primary key,
  entity text not null,                 -- workspaces | notes | pairs | childes_docs | ...
  app text not null default 'xblimps',  -- 'xblimps' | 'childes'
  owner uuid references auth.users on delete cascade,  -- NULL = shared project data; set = personal to one user
  language text,
  workspace_id text,
  rev int not null default 1,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
create index if not exists records_entity_idx on public.records (entity);
create index if not exists records_app_idx on public.records (app);
create index if not exists records_owner_idx on public.records (owner);
alter table public.records enable row level security;

-- existing deployments: add the column in place (no-op if already present)
alter table public.records add column if not exists owner uuid references auth.users on delete cascade;

-- ---------- helpers (security definer; avoid RLS recursion) ----------
create or replace function public.my_apps() returns text[]
language sql security definer stable set search_path = public as $$
  select coalesce((select apps from public.profiles where id = auth.uid()), array['xblimps']::text[]);
$$;

create or replace function public.is_coordinator() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select role = 'coordinator' from public.profiles where id = auth.uid()), false);
$$;

-- ---------- profiles policies ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_coordinator());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all
  using (public.is_coordinator()) with check (public.is_coordinator());

-- ---------- records policies (the core access gate) ----------
-- A caller may touch a row when its app is in their profile AND the row is either shared
-- (owner is null — collaborative project data) or owned by them (owner = auth.uid() —
-- personal notebooks and their notes/tasks/files/calendar). So one user's personal
-- customisation is invisible and untouchable to everyone else, while shared phenomena /
-- templates / pairs remain editable by the whole team.
drop policy if exists records_rw on public.records;
create policy records_rw on public.records for all
  using (app = any (public.my_apps()) and (owner is null or owner = auth.uid()))
  with check (app = any (public.my_apps()) and (owner is null or owner = auth.uid()));

-- ---------- rev-guarded upsert (optimistic concurrency) ----------
-- The client flushes whole records keyed on row_uid. A naive upsert would let a stale
-- writer (who loaded rev N, edited, but a teammate already committed rev N+1) clobber the
-- newer row. apply_records() upserts each row but only OVERWRITES when the incoming rev is
-- strictly greater, so the higher rev always wins and equal-rev races resolve first-commit-wins.
-- It returns the authoritative current state of every touched row so the client can reconcile
-- (adopt the winner) when its write was rejected. Runs as INVOKER, so records_rw RLS still applies.
create or replace function public.apply_records(_rows jsonb)
returns setof public.records
language plpgsql as $$
declare r record;
begin
  for r in
    select * from jsonb_to_recordset(_rows) as x(
      row_uid uuid, entity text, app text, owner uuid, language text,
      workspace_id text, rev int, data jsonb, updated_at timestamptz, updated_by text)
  loop
    insert into public.records as t
      (row_uid, entity, app, owner, language, workspace_id, rev, data, updated_at, updated_by)
    values
      (r.row_uid, r.entity, r.app, r.owner, r.language, r.workspace_id, r.rev, r.data,
       coalesce(r.updated_at, now()), r.updated_by)
    on conflict (row_uid) do update set
      entity = excluded.entity, app = excluded.app, owner = excluded.owner,
      language = excluded.language, workspace_id = excluded.workspace_id,
      rev = excluded.rev, data = excluded.data,
      updated_at = excluded.updated_at, updated_by = excluded.updated_by
    where t.rev < excluded.rev;          -- the guard: only newer revs win
  end loop;

  return query
    select * from public.records
    where row_uid in (select (x->>'row_uid')::uuid from jsonb_array_elements(_rows) x);
end; $$;

-- ---------- realtime: broadcast record changes to subscribed clients ----------
-- Add the records table to the realtime publication so the client live-merges others' edits
-- (RLS still gates what each subscriber receives; the client additionally filters by app/owner).
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'records'
  ) then
    alter publication supabase_realtime add table public.records;
  end if;
end $$;

-- ---------- signup trigger: provision a profile from invite metadata ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, languages, apps, state)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'native_speaker'),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'languages') x), array[]::text[]),
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'apps') x), array['xblimps']::text[]),
    'active'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- bootstrap the coordinator (run AFTER your first sign-in) ----------
-- update public.profiles
--   set role = 'coordinator', apps = array['xblimps','childes']
--   where email = 'suchirsalhan@gmail.com';

-- ---------- per-user ownership migration (existing deployments) ----------
-- The `owner` column + records_rw policy above are idempotent — re-running this file is safe.
-- Existing rows keep owner = NULL, i.e. they stay SHARED (nothing is hidden or lost). New
-- personal records (notebook workspaces + their notes/tasks/files/calendar) are stamped with
-- owner = the creator's auth id automatically by the client (store.ts recordRow/ownerOf).
-- Optional backfill — privatise existing personal notebooks to a specific user, e.g.:
--   update public.records r
--     set owner = (select id from public.profiles where email = 'someone@uni.edu')
--   where r.entity = 'workspaces' and (r.data->>'kind') = 'notebook' and r.owner is null;
--   -- then their contents:
--   update public.records c
--     set owner = w.owner
--   from public.records w
--   where c.workspace_id = (w.data->>'id') and w.entity = 'workspaces' and w.owner is not null;
