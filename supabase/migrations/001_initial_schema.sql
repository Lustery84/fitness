-- FitSnap Initial Schema (Supabase / PostgreSQL)
-- Follows supabase-postgres-best-practices: explicit types, FK indexes, strict RLS.

create extension if not exists "pgcrypto";

-- 1. User Nutrition & Fitness Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  sex text not null check (sex in ('male', 'female')),
  age smallint not null check (age between 13 and 100),
  height_cm numeric(5,1) not null check (height_cm between 100 and 250),
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 300),
  target_weight_kg numeric(5,1) check (target_weight_kg between 30 and 300),
  activity_level text not null check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text not null check (goal in ('lose_fat', 'recomp', 'maintain', 'build_muscle')),
  weekly_rate_pct numeric(3,2) not null default 0.50 check (weekly_rate_pct between 0.00 and 1.50),
  focus_regions text[] not null default array['belly']::text[],
  dietary_prefs text[] not null default array['high_protein']::text[],
  max_cook_minutes smallint not null default 30,
  equipment text not null default 'none' check (equipment in ('none', 'dumbbells', 'gym')),
  days_per_week smallint not null default 4 check (days_per_week between 3 and 6),
  bmr_kcal integer not null check (bmr_kcal > 0),
  tdee_kcal integer not null check (tdee_kcal > 0),
  target_calories integer not null check (target_calories > 0),
  target_protein_g integer not null check (target_protein_g > 0),
  target_carbs_g integer not null check (target_carbs_g >= 0),
  target_fat_g integer not null check (target_fat_g > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Meal Logs (Photo Scan + Manual + Meal Plan)
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null default current_date,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  title text not null,
  source text not null default 'manual' check (source in ('photo_ai', 'manual', 'barcode', 'meal_plan')),
  image_path text,
  items jsonb not null default '[]'::jsonb,
  calories integer not null check (calories >= 0),
  protein_g numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g numeric(6,1) not null default 0 check (fat_g >= 0),
  ai_confidence numeric(3,2),
  provider text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_logs_user_date
  on public.meal_logs (user_id, logged_date desc);

-- 3. Workout Logs
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null default current_date,
  title text not null,
  focus_region text not null default 'full_body',
  duration_min integer not null check (duration_min between 1 and 480),
  calories_burned integer not null check (calories_burned >= 0),
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_logs_user_date
  on public.workout_logs (user_id, logged_date desc);

-- 4. Body Measurements (Weight & Circumferences)
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_date date not null default current_date,
  weight_kg numeric(5,1) check (weight_kg between 30 and 300),
  waist_cm numeric(5,1) check (waist_cm between 40 and 200),
  hip_cm numeric(5,1) check (hip_cm between 40 and 200),
  thigh_cm numeric(5,1) check (thigh_cm between 25 and 120),
  arm_cm numeric(5,1) check (arm_cm between 15 and 80),
  created_at timestamptz not null default now()
);

create index if not exists idx_body_measurements_user_date
  on public.body_measurements (user_id, measured_date desc);

-- 5. Weekly Meal Plans
create table if not exists public.weekly_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  plan_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Enable Row-Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.body_measurements enable row level security;
alter table public.weekly_meal_plans enable row level security;

-- RLS Policies (using (select auth.uid()) for initPlan caching per Supabase best practices)
create policy "profiles_own_all" on public.profiles
  for all using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "meal_logs_own_all" on public.meal_logs
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workout_logs_own_all" on public.workout_logs
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "body_measurements_own_all" on public.body_measurements
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "weekly_meal_plans_own_all" on public.weekly_meal_plans
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
