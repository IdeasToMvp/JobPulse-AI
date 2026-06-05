-- Manual status update history timeline

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  status text not null check (
    status in ('applied', 'active', 'interview', 'offer', 'rejected', 'ghosted')
  ),
  changed_at timestamptz not null default now(),
  source text not null check (source in ('sync', 'user')) default 'user'
);

create index if not exists idx_application_status_history_app
  on public.application_status_history (application_id, changed_at asc);

alter table public.application_status_history enable row level security;
