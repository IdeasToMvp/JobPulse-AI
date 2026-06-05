-- Applications pipeline + processed email idempotency + per-platform stats

alter table public.users
  add column if not exists last_gmail_internal_date timestamptz,
  add column if not exists sync_from_date date,
  add column if not exists sync_to_date date;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  thread_id text not null,
  cycle_index integer not null default 0,
  platform_id text not null,
  company text not null,
  role text,
  status text not null check (
    status in ('applied', 'active', 'interview', 'offer', 'rejected', 'ghosted', 'unknown')
  ),
  last_message_id text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, thread_id, cycle_index)
);

create index if not exists idx_applications_user_id
  on public.applications (user_id);

create index if not exists idx_applications_user_status
  on public.applications (user_id, status);

create table if not exists public.processed_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  message_id text not null,
  thread_id text not null,
  platform_id text not null,
  subject text,
  from_address text,
  internal_date timestamptz not null,
  classification_status text not null default 'unknown',
  classification_source text check (classification_source in ('rule', 'ai', 'none')),
  application_id uuid references public.applications (id) on delete set null,
  processed_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists idx_processed_emails_user_id
  on public.processed_emails (user_id);

create table if not exists public.user_sync_platform_stats (
  user_id uuid not null references public.users (id) on delete cascade,
  platform_id text not null,
  emails_processed integer not null default 0,
  applications_count integer not null default 0,
  interviews_count integer not null default 0,
  offers_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, platform_id)
);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;
alter table public.processed_emails enable row level security;
alter table public.user_sync_platform_stats enable row level security;
