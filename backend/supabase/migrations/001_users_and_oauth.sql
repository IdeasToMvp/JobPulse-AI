-- JobPulse AI: users + encrypted OAuth credentials
-- Run in Supabase SQL Editor or via Supabase CLI

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_id text not null unique,
  email text not null unique,
  name text not null,
  picture text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oauth_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  provider text not null default 'google',
  refresh_token_encrypted text,
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_google_id on public.users (google_id);
create index if not exists idx_users_email on public.users (email);
create index if not exists idx_oauth_credentials_user_id on public.oauth_credentials (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists oauth_credentials_set_updated_at on public.oauth_credentials;
create trigger oauth_credentials_set_updated_at
  before update on public.oauth_credentials
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.oauth_credentials enable row level security;

-- Backend uses service_role key; no public policies required.
