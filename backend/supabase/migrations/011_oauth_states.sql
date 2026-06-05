-- OAuth CSRF state (shared across backend instances)

create table if not exists public.oauth_states (
  state text primary key,
  redirect_uri text not null,
  client_redirect_uri text not null,
  expires_at timestamptz not null
);

create index if not exists idx_oauth_states_expires_at
  on public.oauth_states (expires_at);

alter table public.oauth_states enable row level security;
