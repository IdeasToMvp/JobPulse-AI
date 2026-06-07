-- Add platform_ids array to track when the same application was found via multiple sources
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS platform_ids text[] NOT NULL DEFAULT '{}';

-- Back-fill existing rows so platform_ids always contains at least platform_id
UPDATE applications
SET platform_ids = ARRAY[platform_id]
WHERE platform_ids = '{}' OR platform_ids IS NULL;
