-- Dashboard status counts on users (Applied total + rejected/ghosted breakdown)

alter table public.users
  add column if not exists applied_count integer not null default 0,
  add column if not exists rejected_count integer not null default 0,
  add column if not exists ghosted_count integer not null default 0;
