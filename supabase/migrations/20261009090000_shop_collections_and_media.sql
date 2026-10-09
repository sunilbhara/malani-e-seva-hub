-- Phase 2/3: shop collections, MRP (price cut), smaller image limits, blog media on Supabase Storage,
-- and an admin to-do summary.

-- 1. Products: original price (MRP) for the "price cut" display. Studio photos never carry prices.
ALTER TABLE public.catalog_items ADD COLUMN IF NOT EXISTS mrp INTEGER CHECK (mrp IS NULL OR mrp BETWEEN 0 AND 10000000);
ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS catalog_items_mrp_above_price;
ALTER TABLE public.catalog_items ADD CONSTRAINT catalog_items_mrp_above_price CHECK (mrp IS NULL OR price IS NULL OR mrp >= price);
ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS catalog_items_product_only_fields;
ALTER TABLE public.catalog_items ADD CONSTRAINT catalog_items_product_only_fields
  CHECK (kind = 'product' OR (price IS NULL AND mrp IS NULL AND cardinality(features) = 0));

-- 2. Collections curated by the admin ("नए आए", "दिवाली ऑफ़र", …) and their products.
CREATE TABLE IF NOT EXISTS public.catalog_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 80),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 300),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_collection_items (
  collection_id UUID NOT NULL REFERENCES public.catalog_collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, item_id)
);
CREATE INDEX IF NOT EXISTS catalog_collection_items_item ON public.catalog_collection_items (item_id);

-- Only products belong in collections.
CREATE OR REPLACE FUNCTION public.catalog_collection_items_products_only()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE id = NEW.item_id AND kind = 'product') THEN
    RAISE EXCEPTION 'Only products can be added to a collection';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.catalog_collection_items_products_only() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS catalog_collection_items_products_only ON public.catalog_collection_items;
CREATE TRIGGER catalog_collection_items_products_only BEFORE INSERT OR UPDATE ON public.catalog_collection_items
  FOR EACH ROW EXECUTE FUNCTION public.catalog_collection_items_products_only();

DROP TRIGGER IF EXISTS catalog_collections_set_updated_at ON public.catalog_collections;
CREATE TRIGGER catalog_collections_set_updated_at BEFORE UPDATE ON public.catalog_collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.catalog_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active collections are public" ON public.catalog_collections;
CREATE POLICY "Active collections are public" ON public.catalog_collections FOR SELECT
  USING (is_active OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins insert collections" ON public.catalog_collections;
CREATE POLICY "Admins insert collections" ON public.catalog_collections FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins update collections" ON public.catalog_collections;
CREATE POLICY "Admins update collections" ON public.catalog_collections FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins delete collections" ON public.catalog_collections;
CREATE POLICY "Admins delete collections" ON public.catalog_collections FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

DROP POLICY IF EXISTS "Collection items of active collections are public" ON public.catalog_collection_items;
CREATE POLICY "Collection items of active collections are public" ON public.catalog_collection_items FOR SELECT
  USING (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'))
    OR (
      EXISTS (SELECT 1 FROM public.catalog_collections c WHERE c.id = collection_id AND c.is_active)
      AND EXISTS (SELECT 1 FROM public.catalog_items i WHERE i.id = item_id AND i.is_active)
    )
  );
DROP POLICY IF EXISTS "Admins insert collection items" ON public.catalog_collection_items;
CREATE POLICY "Admins insert collection items" ON public.catalog_collection_items FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins update collection items" ON public.catalog_collection_items;
CREATE POLICY "Admins update collection items" ON public.catalog_collection_items FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins delete collection items" ON public.catalog_collection_items;
CREATE POLICY "Admins delete collection items" ON public.catalog_collection_items FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

REVOKE ALL ON public.catalog_collections, public.catalog_collection_items FROM anon, authenticated;
GRANT SELECT ON public.catalog_collections, public.catalog_collection_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalog_collections, public.catalog_collection_items TO authenticated;

-- Starting collection so the page is not empty; the admin can rename or delete it.
INSERT INTO public.catalog_collections (title, description, sort_order)
SELECT 'नए प्रोडक्ट', 'दुकान पर आए नए मोबाइल और एक्सेसरीज़', 10
WHERE NOT EXISTS (SELECT 1 FROM public.catalog_collections);
INSERT INTO public.catalog_collection_items (collection_id, item_id, sort_order)
SELECT c.id, i.id, i.sort_order
FROM public.catalog_collections c CROSS JOIN public.catalog_items i
WHERE c.title = 'नए प्रोडक्ट' AND i.kind = 'product'
  AND NOT EXISTS (SELECT 1 FROM public.catalog_collection_items);

-- 3. Storage: product/studio images at most 300 KB (free-tier friendly).
UPDATE storage.buckets SET file_size_limit = 307200 WHERE id = 'catalog';

-- Blog cover and in-post images (replaces Cloudinary, which needs extra keys).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-media', 'post-media', true, 307200, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins read post media" ON storage.objects;
CREATE POLICY "Admins read post media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-media' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins upload post media" ON storage.objects;
CREATE POLICY "Admins upload post media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins delete post media" ON storage.objects;
CREATE POLICY "Admins delete post media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- 4. Admin "आज के काम": drafts, thin posts, jobs closing soon, unanswered questions, today's quiz.
CREATE OR REPLACE FUNCTION public.admin_todo()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;

  WITH words AS (
    SELECT p.id, p.title, p.slug, p.status, p.updated_at,
      coalesce(array_length(regexp_split_to_array(btrim(regexp_replace(regexp_replace(p.content, '<[^>]+>', ' ', 'g'), '&nbsp;|\s+', ' ', 'g')), ' '), 1), 0) AS word_count
    FROM public.posts p
  ),
  admins AS (SELECT user_id FROM public.user_roles WHERE role = 'admin')
  SELECT jsonb_build_object(
    'drafts', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title, 'updated_at', updated_at) ORDER BY updated_at DESC)
      FROM (SELECT id, title, updated_at FROM public.posts WHERE status = 'draft' ORDER BY updated_at DESC LIMIT 5) d
    ), '[]'::jsonb),
    'draft_count', (SELECT count(*) FROM public.posts WHERE status = 'draft'),
    'short_posts', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title, 'words', word_count) ORDER BY word_count)
      FROM (SELECT id, title, word_count FROM words WHERE status = 'published' AND word_count < 600 ORDER BY word_count LIMIT 10) s
    ), '[]'::jsonb),
    'short_count', (SELECT count(*) FROM words WHERE status = 'published' AND word_count < 600),
    'closing_jobs', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title, 'slug', p.slug, 'last_date', j.last_date, 'updated_at', p.updated_at) ORDER BY j.last_date)
      FROM public.job_details j JOIN public.posts p ON p.id = j.post_id
      WHERE p.status = 'published' AND j.last_date BETWEEN today AND today + 3
    ), '[]'::jsonb),
    'unanswered', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', q.id, 'content', left(q.content, 140), 'post_title', p.title, 'post_slug', p.slug, 'created_at', q.created_at) ORDER BY q.created_at)
      FROM public.comments q JOIN public.posts p ON p.id = q.post_id
      WHERE q.parent_id IS NULL AND NOT q.is_hidden
        AND q.user_id NOT IN (SELECT user_id FROM admins)
        AND NOT EXISTS (SELECT 1 FROM public.comments a WHERE a.parent_id = q.id AND a.user_id IN (SELECT user_id FROM admins))
    ), '[]'::jsonb),
    'quiz_today', EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_date = today),
    'products_without_price', (SELECT count(*) FROM public.catalog_items WHERE kind = 'product' AND is_active AND price IS NULL)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_todo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_todo() TO authenticated;
