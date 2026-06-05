-- Activity timeline events for the Activity tab

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (
    type in ('application', 'status_update', 'suggestion', 'sync', 'user_action')
  ),
  title text not null,
  description text not null,
  company text,
  role text,
  application_id uuid references public.applications (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_user_occurred
  on public.activity_events (user_id, occurred_at desc);

create index if not exists idx_activity_events_user_type
  on public.activity_events (user_id, type, occurred_at desc);

alter table public.activity_events enable row level security;
