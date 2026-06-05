-- Auto sync preferences + initial connect mode

alter table public.users
  add column if not exists auto_sync_enabled boolean not null default true,
  add column if not exists sync_frequency_minutes integer not null default 30,
  add column if not exists initial_sync_mode text
    check (initial_sync_mode in ('new_only', 'import_history'));
