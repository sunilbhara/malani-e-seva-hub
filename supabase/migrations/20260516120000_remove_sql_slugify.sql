-- Migration: remove SQL slugify/transliteration functions and triggers
-- Leave the `slug` column and uniqueness index in place; application will generate slugs.

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trg_posts_set_slug ON public.posts;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.posts_set_slug();
DROP FUNCTION IF EXISTS public.generate_unique_post_slug(TEXT, UUID);
DROP FUNCTION IF EXISTS public.slugify(TEXT);

-- Ensure slug column exists (nullable) and uniqueness enforced at DB level
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique ON public.posts(slug);

-- Note: Do not backfill or set NOT NULL here. Slug generation and backfill
-- will be performed from application-side code to preserve multilingual SEO.
