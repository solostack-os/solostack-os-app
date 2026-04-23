-- Add is_sample flag to runs table so sample/seed outputs can be
-- distinguished from real LLM-generated runs. Sample runs are excluded
-- from credit usage counts.
ALTER TABLE public.runs
ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT false;
