-- Job sources + sync metadata per user

alter table public.users
  add column if not exists last_synced_at timestamptz,
  add column if not exists emails_processed integer not null default 0,
  add column if not exists applications_count integer not null default 0,
  add column if not exists active_count integer not null default 0,
  add column if not exists interviews_count integer not null default 0,
  add column if not exists offers_count integer not null default 0;

create table if not exists public.user_job_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  platform_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, platform_id)
);

create index if not exists idx_user_job_sources_user_id
  on public.user_job_sources (user_id);

alter table public.user_job_sources enable row level security;
