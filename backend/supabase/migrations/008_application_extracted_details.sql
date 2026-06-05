-- AI/rule extracted metadata from apply confirmation emails

alter table public.applications
  add column if not exists extracted_details jsonb not null default '{}'::jsonb;

create index if not exists idx_applications_user_company_id
  on public.applications (user_id, company_id)
  where company_id is not null;
