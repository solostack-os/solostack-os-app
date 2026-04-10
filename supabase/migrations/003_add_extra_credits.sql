-- Migration: add extra_credits to subscriptions
-- Purpose: stores one-time purchased credit top-ups.
-- These accumulate and do NOT reset on billing period renewal —
-- purchased credits are additive on top of the plan's base run_cap.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS extra_credits integer NOT NULL DEFAULT 0;
