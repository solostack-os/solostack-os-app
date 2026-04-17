-- Add copy calibration fields to workspaces table.
-- copy_good_examples: 2-3 examples of copy the user admires (few-shot positive calibration).
-- copy_bad_examples:  1-2 examples of copy the user wants to avoid (anti-calibration).
-- Both are used by the ad-copy workflow to steer the model's register and style.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS copy_good_examples TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS copy_bad_examples  TEXT DEFAULT NULL;
