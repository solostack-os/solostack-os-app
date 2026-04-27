-- Atomic dedup for one-time attribution events.
-- Prevents race conditions where concurrent requests both insert the same event.

CREATE UNIQUE INDEX IF NOT EXISTS user_events_one_time_unique
  ON public.user_events (user_id, event_name)
  WHERE event_name IN (
    'signup_completed',
    'onboarding_started',
    'onboarding_completed',
    'first_workflow_run',
    'first_workflow_run_completed',
    'upgrade_to_pro'
  );
