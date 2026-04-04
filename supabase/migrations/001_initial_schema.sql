-- 1. Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz not null default now()
);

-- 2. Workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  plan_key text not null default 'trial',
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);

-- 3. Workspace context (1:1 with workspace)
create table public.workspace_context (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  main_goal text,
  business_type text,
  offer text,
  target_audience text,
  tone text,
  brand_notes text,
  updated_at timestamptz not null default now()
);

-- 4. Plans
create table public.plans (
  key text primary key,
  name text not null,
  trial_days int not null default 0,
  run_cap int,
  exports_enabled boolean not null default true
);

-- 5. Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_key text not null references public.plans(key),
  status text not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. Runs
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null,
  workflow_key text not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  input_json jsonb not null default '{}'::jsonb,
  context_snapshot_json jsonb not null default '{}'::jsonb,
  model_provider text,
  model_name text,
  prompt_tokens int,
  completion_tokens int,
  cost_estimate numeric(10,4),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. Outputs
create table public.outputs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  title text,
  output_markdown text,
  edited_output text,
  created_at timestamptz not null default now()
);

-- 8. Exports
create table public.exports (
  id uuid primary key default gen_random_uuid(),
  output_id uuid not null references public.outputs(id) on delete cascade,
  format text not null check (format in ('pdf','doc','email')),
  storage_path text null,
  status text not null default 'ready' check (status in ('pending','ready','failed')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_context enable row level security;
alter table public.subscriptions enable row level security;
alter table public.runs enable row level security;
alter table public.outputs enable row level security;
alter table public.exports enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- Workspaces policies
create policy "ws_select" on public.workspaces for select using (owner_user_id = auth.uid());
create policy "ws_insert" on public.workspaces for insert with check (owner_user_id = auth.uid());
create policy "ws_update" on public.workspaces for update using (owner_user_id = auth.uid());

-- Workspace context policies
create policy "ctx_select" on public.workspace_context for select using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));
create policy "ctx_upsert" on public.workspace_context for insert with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));
create policy "ctx_update" on public.workspace_context for update using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));

-- Subscriptions policies
create policy "sub_select" on public.subscriptions for select using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));

-- Runs policies
create policy "runs_select" on public.runs for select using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()));
create policy "runs_insert" on public.runs for insert with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_user_id = auth.uid()) and user_id = auth.uid());

-- Outputs policies
create policy "out_select" on public.outputs for select using (exists (select 1 from public.runs r join public.workspaces w on w.id = r.workspace_id where r.id = run_id and w.owner_user_id = auth.uid()));
create policy "out_update" on public.outputs for update using (exists (select 1 from public.runs r join public.workspaces w on w.id = r.workspace_id where r.id = run_id and w.owner_user_id = auth.uid()));

-- Exports policies
create policy "exp_select" on public.exports for select using (exists (select 1 from public.outputs o join public.runs r on r.id = o.run_id join public.workspaces w on w.id = r.workspace_id where o.id = output_id and w.owner_user_id = auth.uid()));

-- SEED plans
insert into public.plans (key, name, trial_days, run_cap, exports_enabled) values
('trial', 'Trial', 7, 20, true),
('starter', 'Starter', 0, 200, true),
('pro', 'Pro', 0, 1000, true);
