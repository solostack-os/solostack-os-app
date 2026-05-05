-- Activation panel flag: tracks whether a workspace has completed at least one
-- successful generation. Used to show the first-run activation panel only for
-- brand-new users, and avoids counting records across tables on every dashboard load.

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS has_generated BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: any workspace that already has at least one completed (non-sample) run
-- should be marked as having generated, so existing users never see the activation panel.
UPDATE workspaces
SET has_generated = TRUE
WHERE id IN (
  SELECT DISTINCT workspace_id
  FROM runs
  WHERE status = 'completed'
    AND (is_sample IS NULL OR is_sample = FALSE)
);
