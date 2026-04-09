-- ─────────────────────────────────────────────────────────────
-- 002_update_credits.sql
-- • Update plan run_cap values (trial 20→30, starter 200→300)
-- • Add current_period_start to subscriptions for monthly reset
--   (no rollover — each period starts fresh from 0)
-- ─────────────────────────────────────────────────────────────

-- Update plan caps
UPDATE public.plans SET run_cap = 30  WHERE key = 'trial';
UPDATE public.plans SET run_cap = 300 WHERE key = 'starter';
-- pro stays at 1000

-- Add period start column (nullable — null for trial subscriptions)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
