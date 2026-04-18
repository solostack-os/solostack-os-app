-- Sparkle Assistant rate-limiting table.
--
-- Tracks per-user sparkle calls for 24h rolling window enforcement.
-- Row-level security mirrors the pattern used elsewhere in this project:
-- users can only see and insert their own rows.
--
-- Rate limits (enforced in /api/sparkle):
--   Pro     → 15 uses per 24h rolling window
--   Starter → 5  uses per 24h rolling window
--   Free    → 3  uses per 24h rolling window

CREATE TABLE IF NOT EXISTS sparkle_usage (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  input_hash TEXT        -- SHA-256 of normalized input; used for optional cache lookup
);

CREATE INDEX IF NOT EXISTS idx_sparkle_usage_user_used
  ON sparkle_usage (user_id, used_at DESC);

-- Only allow users to read their own rows.
ALTER TABLE sparkle_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sparkle usage"
  ON sparkle_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sparkle usage"
  ON sparkle_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
