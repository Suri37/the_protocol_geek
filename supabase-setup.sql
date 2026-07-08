-- Supabase setup for The Protocol Geek
-- Run this in Supabase SQL Editor after creating your Supabase project.

create table if not exists public.study_participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  city text,
  interest_reason text,
  consent boolean not null default false,
  source text default 'website',
  created_at timestamptz not null default now()
);

create table if not exists public.investigator_registrations (
  id uuid primary key default gen_random_uuid(),
  investigator_name text not null,
  hospital_site text not null,
  email text not null,
  phone text,
  city text,
  therapeutic_area text,
  site_details text,
  consent boolean not null default false,
  source text default 'website',
  created_at timestamptz not null default now()
);

alter table public.study_participants enable row level security;
alter table public.investigator_registrations enable row level security;

-- Allows anonymous website visitors to submit forms only.
-- Reading/updating/deleting stays blocked from the public website key.
create policy "Allow public participant form submissions"
on public.study_participants
for insert
to anon
with check (consent = true);

create policy "Allow public investigator form submissions"
on public.investigator_registrations
for insert
to anon
with check (consent = true);

create index if not exists idx_study_participants_created_at on public.study_participants(created_at desc);
create index if not exists idx_investigator_registrations_created_at on public.investigator_registrations(created_at desc);
