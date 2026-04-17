-- Add preferred_language column to workspaces table.
-- When set, AI outputs and suggestions will be generated in this language
-- unless the user's input is in a different language (which always takes precedence).

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT NULL;
