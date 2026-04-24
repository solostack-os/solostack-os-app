-- Attribution tracking: conversion events table
-- Already applied in production 2026-04-24 via SQL Editor.
-- This file exists for version control / reproducibility.

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  event_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_user_events_user_id on public.user_events(user_id);
create index if not exists idx_user_events_event_name on public.user_events(event_name);
create index if not exists idx_user_events_created_at on public.user_events(created_at desc);

-- RLS
alter table public.user_events enable row level security;

-- Users can insert their own events
do $$ begin
  create policy "Users can insert own events"
    on public.user_events for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- Users can read their own events
do $$ begin
  create policy "Users can select own events"
    on public.user_events for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
