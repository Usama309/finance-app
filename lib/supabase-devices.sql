-- ============================================
-- CashGuard Device Tracking
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists public.user_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_name text,
  browser text,
  os text,
  screen_width int,
  screen_height int,
  user_agent text,
  last_login timestamptz default now(),
  created_at timestamptz default now(),
  is_trusted boolean default false
);

-- Enable RLS
alter table public.user_devices enable row level security;

-- Users can only see/manage their own devices
create policy "Users can view own devices"
  on public.user_devices for select
  using (auth.uid() = user_id);

create policy "Users can insert own devices"
  on public.user_devices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own devices"
  on public.user_devices for update
  using (auth.uid() = user_id);

create policy "Users can delete own devices"
  on public.user_devices for delete
  using (auth.uid() = user_id);
