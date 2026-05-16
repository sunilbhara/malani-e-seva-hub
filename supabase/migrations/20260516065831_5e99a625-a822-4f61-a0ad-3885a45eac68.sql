
-- 1. Add slug column
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Slugify helper
CREATE OR REPLACE FUNCTION public.slugify(_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s TEXT;
BEGIN
  IF _input IS NULL THEN RETURN NULL; END IF;
  s := lower(_input);
  -- replace non-alphanumerics (preserve unicode letters) with hyphen
  s := regexp_replace(s, '[^a-z0-9\u0900-\u097F]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  IF s = '' OR s IS NULL THEN s := 'post'; END IF;
  RETURN s;
END;
$$;

-- 3. Unique-slug generator
CREATE OR REPLACE FUNCTION public.generate_unique_post_slug(_title TEXT, _post_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  i INT := 1;
BEGIN
  base := public.slugify(_title);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = candidate AND (id <> _post_id OR _post_id IS NULL)) LOOP
    i := i + 1;
    candidate := base || '-' || i::text;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 4. Trigger to keep slug populated
CREATE OR REPLACE FUNCTION public.posts_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_post_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_set_slug ON public.posts;
CREATE TRIGGER trg_posts_set_slug
BEFORE INSERT OR UPDATE OF title, slug ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.posts_set_slug();

-- 5. Backfill existing rows
UPDATE public.posts
SET slug = public.generate_unique_post_slug(title, id)
WHERE slug IS NULL OR slug = '';

-- 6. Enforce uniqueness + non-null
ALTER TABLE public.posts ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique ON public.posts(slug);
