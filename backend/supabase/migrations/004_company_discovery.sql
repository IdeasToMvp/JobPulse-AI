-- Two-phase Gmail discovery: company registry, domains, recruiter emails

create table if not exists public.discovered_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  canonical_name text not null,
  normalized_key text not null,
  primary_platform_id text,
  application_status text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, normalized_key)
);

create index if not exists idx_discovered_companies_user_id
  on public.discovered_companies (user_id);

create table if not exists public.company_domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid not null references public.discovered_companies (id) on delete cascade,
  domain text not null,
  source text not null default 'inferred',
  confidence numeric not null default 0.8,
  unique (user_id, domain)
);

create index if not exists idx_company_domains_company_id
  on public.company_domains (company_id);

create table if not exists public.company_recruiter_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_id uuid not null references public.discovered_companies (id) on delete cascade,
  email text not null,
  display_name text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, email)
);

create index if not exists idx_company_recruiter_emails_company_id
  on public.company_recruiter_emails (company_id);

alter table public.applications
  add column if not exists company_id uuid references public.discovered_companies (id) on delete set null;

alter table public.processed_emails
  add column if not exists sync_phase text not null default 'platform'
    check (sync_phase in ('platform', 'company'));

alter table public.discovered_companies enable row level security;
alter table public.company_domains enable row level security;
alter table public.company_recruiter_emails enable row level security;
