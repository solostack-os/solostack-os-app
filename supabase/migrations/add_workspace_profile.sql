ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS brand_color_primary TEXT DEFAULT '#6c8cff',
ADD COLUMN IF NOT EXISTS brand_color_secondary TEXT DEFAULT '#22c55e',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create logos storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;
