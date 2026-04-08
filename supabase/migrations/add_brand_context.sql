-- Brand context toggle + brand voice instructions.
-- Business-profile fields (company_name, industry, description, etc.) live on
-- `workspaces` in this codebase, so the new columns are added there to stay
-- consistent with the existing profile model.

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS use_brand_context BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS brand_voice TEXT;
