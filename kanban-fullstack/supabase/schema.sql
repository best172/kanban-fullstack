create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 200),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  created_at timestamptz not null default now()
);

create index if not exists cards_status_created_at_idx
  on public.cards (status, created_at desc);

-- This starter uses the Supabase service-role key from the backend only.
-- Keep RLS enabled and do not put the service-role key in the browser.
alter table public.cards enable row level security;
