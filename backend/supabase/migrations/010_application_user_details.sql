-- User-provided job details (optional, set when marking active or edited later)

alter table public.applications
  add column if not exists user_details jsonb not null default '{}'::jsonb;
