-- ============================================
-- CashGuard Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable Row Level Security
-- Users table for profiles and roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  role text default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Finance data table — stores the entire state JSON per user
create table if not exists public.finance_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  data jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.finance_data enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Finance data policies
create policy "Users can view own finance data"
  on public.finance_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own finance data"
  on public.finance_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own finance data"
  on public.finance_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own finance data"
  on public.finance_data for delete
  using (auth.uid() = user_id);

-- Admins can view all finance data
create policy "Admins can view all finance data"
  on public.finance_data for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto profile creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_finance_data_updated_at
  before update on public.finance_data
  for each row execute procedure public.update_updated_at();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- Enable realtime for finance_data
alter publication supabase_realtime add table public.finance_data;
