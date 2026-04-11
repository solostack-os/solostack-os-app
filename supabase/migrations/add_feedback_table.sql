-- Feedback table for post-deletion and general product feedback
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  ref         text,             -- where it came from: 'deleted' | 'app' | 'cancel'
  reason      text,             -- dropdown: pricing | missing_feature | too_complex | not_useful | other
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Public insert, no read (admin only via service role)
alter table public.feedback enable row level security;

create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (true);
