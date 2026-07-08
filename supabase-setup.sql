-- The Protocol Geek Database v1.0
-- Run this in Supabase SQL Editor.
-- Safe to run more than once. It creates tables, adds missing columns, and refreshes public insert policies.

create extension if not exists pgcrypto;

create table if not exists public.study_participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  country text default 'India',
  age_range text,
  gender text,
  preferred_contact_method text,
  therapeutic_interests text,
  previous_trial_experience text,
  availability_notes text,
  referral_source text,
  interest_reason text,
  notes text,
  consent boolean not null default false,
  source text default 'website',
  status text default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.investigator_registrations (
  id uuid primary key default gen_random_uuid(),
  investigator_name text not null,
  designation text,
  hospital_site text not null,
  department text,
  site_type text,
  email text not null,
  phone text,
  city text,
  state text,
  country text default 'India',
  therapeutic_area text,
  patient_population text,
  trial_experience text,
  ethics_committee_access text,
  coordinator_available text,
  pharmacy_lab_access text,
  equipment_capabilities text,
  partnership_interest text,
  site_details text,
  consent boolean not null default false,
  source text default 'website',
  status text default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  organization_type text,
  website text,
  city text,
  state text,
  country text default 'India',
  notes text,
  status text default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  site_name text not null,
  site_type text,
  address text,
  city text,
  state text,
  country text default 'India',
  departments text,
  capabilities text,
  status text default 'prospect',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text,
  requester_type text,
  organization_name text,
  email text,
  phone text,
  message text,
  source text default 'website',
  status text default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.feasibility_requests (
  id uuid primary key default gen_random_uuid(),
  organization_name text,
  contact_name text,
  email text,
  therapeutic_area text,
  study_phase text,
  indication text,
  patient_population text,
  feasibility_notes text,
  status text default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.study_opportunities (
  id uuid primary key default gen_random_uuid(),
  sponsor_name text,
  cro_name text,
  therapeutic_area text,
  indication text,
  study_phase text,
  geography text,
  status text default 'prospect',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_name text,
  entity_id uuid,
  action text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Add missing columns for older projects where the basic tables already existed.
alter table public.study_participants add column if not exists state text;
alter table public.study_participants add column if not exists country text default 'India';
alter table public.study_participants add column if not exists age_range text;
alter table public.study_participants add column if not exists gender text;
alter table public.study_participants add column if not exists preferred_contact_method text;
alter table public.study_participants add column if not exists therapeutic_interests text;
alter table public.study_participants add column if not exists previous_trial_experience text;
alter table public.study_participants add column if not exists availability_notes text;
alter table public.study_participants add column if not exists referral_source text;
alter table public.study_participants add column if not exists notes text;
alter table public.study_participants add column if not exists status text default 'new';

alter table public.investigator_registrations add column if not exists designation text;
alter table public.investigator_registrations add column if not exists department text;
alter table public.investigator_registrations add column if not exists site_type text;
alter table public.investigator_registrations add column if not exists state text;
alter table public.investigator_registrations add column if not exists country text default 'India';
alter table public.investigator_registrations add column if not exists patient_population text;
alter table public.investigator_registrations add column if not exists trial_experience text;
alter table public.investigator_registrations add column if not exists ethics_committee_access text;
alter table public.investigator_registrations add column if not exists coordinator_available text;
alter table public.investigator_registrations add column if not exists pharmacy_lab_access text;
alter table public.investigator_registrations add column if not exists equipment_capabilities text;
alter table public.investigator_registrations add column if not exists partnership_interest text;
alter table public.investigator_registrations add column if not exists status text default 'new';

alter table public.study_participants enable row level security;
alter table public.investigator_registrations enable row level security;
alter table public.organizations enable row level security;
alter table public.sites enable row level security;
alter table public.contact_requests enable row level security;
alter table public.feasibility_requests enable row level security;
alter table public.study_opportunities enable row level security;
alter table public.audit_logs enable row level security;

-- Allows anonymous website visitors to submit only website forms.
-- Public read/update/delete remains blocked from the anon website key.
drop policy if exists "Allow public participant form submissions" on public.study_participants;
create policy "Allow public participant form submissions"
on public.study_participants
for insert
to anon
with check (consent = true);

drop policy if exists "Allow public investigator form submissions" on public.investigator_registrations;
create policy "Allow public investigator form submissions"
on public.investigator_registrations
for insert
to anon
with check (consent = true);

create index if not exists idx_study_participants_created_at on public.study_participants(created_at desc);
create index if not exists idx_investigator_registrations_created_at on public.investigator_registrations(created_at desc);
create index if not exists idx_organizations_created_at on public.organizations(created_at desc);
create index if not exists idx_sites_created_at on public.sites(created_at desc);
create index if not exists idx_contact_requests_created_at on public.contact_requests(created_at desc);
create index if not exists idx_feasibility_requests_created_at on public.feasibility_requests(created_at desc);
create index if not exists idx_study_opportunities_created_at on public.study_opportunities(created_at desc);
