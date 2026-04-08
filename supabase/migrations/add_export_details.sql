-- Company / legal details used for PDF exports (invoices, proposals, etc.).
-- Stored on workspaces because the existing business-profile fields
-- (company_name, industry, description, logo_url, ...) already live there.
--
-- The boolean `include_company_details` gates whether these fields actually
-- get rendered into exported documents, defaulting to TRUE so existing
-- workspaces opt in automatically once they fill the fields.

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS cui TEXT,
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS include_company_details BOOLEAN NOT NULL DEFAULT TRUE;
