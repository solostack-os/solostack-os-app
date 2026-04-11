-- Add cancel_at_period_end flag to subscriptions so the UI can show
-- "Cancels on [date]" without calling the Stripe API on every page load.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
