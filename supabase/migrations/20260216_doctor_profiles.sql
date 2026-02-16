create table if not exists doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text,
  phone text,
  gender text,
  degree_type text,
  degree_institute text,
  degree_year int,
  degree_document_url text,
  specialization text,
  sub_specialization text,
  hospital_name text,
  hospital_address text,
  experience_years int,
  consultation_fee numeric,
  bio text,
  verification_status text default 'pending',
  onboarding_completed boolean default false,
  created_at timestamptz default now()
);

alter table doctor_profiles enable row level security;

drop policy if exists "Users can manage own doctor profile" on doctor_profiles;
create policy "Users can manage own doctor profile"
  on doctor_profiles for all
  using (auth.uid() = user_id)