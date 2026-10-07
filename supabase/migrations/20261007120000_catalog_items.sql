-- Shop catalog managed from /admin/catalog: mobile & electronics products and Mataji Studio photos.
-- Readers see active items; only admins write. Images live in the public `catalog` storage bucket,
-- already resized in the browser (products 800x800, studio 900x1200, WebP); the bucket enforces
-- type and size on the server too.

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('product', 'studio_photo')),
  category TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  price INTEGER CHECK (price IS NULL OR price BETWEEN 0 AND 10000000),
  features TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(features) <= 6),
  image_url TEXT NOT NULL CHECK (image_url ~ '^https://' AND char_length(image_url) <= 500),
  image_path TEXT CHECK (image_path IS NULL OR image_path ~ '^(product|studio_photo)/[A-Za-z0-9._-]+$'),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalog_items_category CHECK (
    (kind = 'product' AND category IN ('mobiles', 'accessories', 'appliances'))
    OR (kind = 'studio_photo' AND category IN ('weddings', 'portraits', 'events'))
  ),
  CONSTRAINT catalog_items_product_only_fields CHECK (kind = 'product' OR (price IS NULL AND cardinality(features) = 0))
);

CREATE INDEX IF NOT EXISTS catalog_items_kind_order ON public.catalog_items (kind, sort_order, created_at);

DROP TRIGGER IF EXISTS catalog_items_set_updated_at ON public.catalog_items;
CREATE TRIGGER catalog_items_set_updated_at BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active catalog items are public" ON public.catalog_items;
CREATE POLICY "Active catalog items are public" ON public.catalog_items FOR SELECT
  USING (is_active OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins insert catalog items" ON public.catalog_items;
CREATE POLICY "Admins insert catalog items" ON public.catalog_items FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins update catalog items" ON public.catalog_items;
CREATE POLICY "Admins update catalog items" ON public.catalog_items FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins delete catalog items" ON public.catalog_items;
CREATE POLICY "Admins delete catalog items" ON public.catalog_items FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

REVOKE ALL ON public.catalog_items FROM anon, authenticated;
GRANT SELECT ON public.catalog_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;

-- Storage: public read (public bucket URLs), admin-only writes, 512 KB WebP/JPEG only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('catalog', 'catalog', true, 524288, ARRAY['image/webp', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins read catalog images" ON storage.objects;
CREATE POLICY "Admins read catalog images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'catalog' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins upload catalog images" ON storage.objects;
CREATE POLICY "Admins upload catalog images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catalog' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins update catalog images" ON storage.objects;
CREATE POLICY "Admins update catalog images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'catalog' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK (bucket_id = 'catalog' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));
DROP POLICY IF EXISTS "Admins delete catalog images" ON storage.objects;
CREATE POLICY "Admins delete catalog images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'catalog' AND (SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- Starting content: the items that were hard-coded in the pages, so nothing disappears.
INSERT INTO public.catalog_items (kind, category, title, price, features, image_url, sort_order)
SELECT * FROM (VALUES
  ('product', 'mobiles', 'iPhone 15 Pro', 134900, ARRAY['A17 Pro Chip', '48MP Camera', 'Titanium Build'], 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop&auto=format&q=70', 10),
  ('product', 'mobiles', 'Samsung Galaxy S24', 79999, ARRAY['AI Photography', '120Hz Display', '5000mAh Battery'], 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop&auto=format&q=70', 20),
  ('product', 'accessories', 'Sony WH-1000XM5', 29990, ARRAY['Noise Cancelling', '30hr Battery', 'Premium Sound'], 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=800&fit=crop&auto=format&q=70', 30),
  ('product', 'appliances', 'MacBook Air M3', 114900, ARRAY['M3 Chip', '18hr Battery', 'Liquid Retina'], 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop&auto=format&q=70', 40),
  ('product', 'accessories', 'AirPods Pro', 24900, ARRAY['Active Noise Cancel', 'Spatial Audio', 'MagSafe Case'], 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop&auto=format&q=70', 50),
  ('product', 'appliances', 'LG OLED TV 55"', 149990, ARRAY['4K OLED', 'Smart TV', 'Dolby Vision'], 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=800&fit=crop&auto=format&q=70', 60),
  ('studio_photo', 'weddings', 'शाही शादी समारोह', NULL::INTEGER, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1587271636175-90d58cdad458?w=900&h=1200&fit=crop&auto=format&q=70', 10),
  ('studio_photo', 'portraits', 'प्रोफेशनल पोर्ट्रेट', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1587027512547-81850a319ff5?w=900&h=1200&fit=crop&auto=format&q=70', 20),
  ('studio_photo', 'events', 'बड़ा इवेंट', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=900&h=1200&fit=crop&auto=format&q=70', 30),
  ('studio_photo', 'events', 'हल्दी शूट', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1645856052472-95fe99103c11?w=900&h=1200&fit=crop&auto=format&q=70', 40),
  ('studio_photo', 'portraits', 'फैमिली पोर्ट्रेट', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1640953148126-1962ec17a92b?w=900&h=1200&fit=crop&auto=format&q=70', 50),
  ('studio_photo', 'events', 'जन्मदिन समारोह', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1756621716907-6451161cd100?w=900&h=1200&fit=crop&auto=format&q=70', 60),
  ('studio_photo', 'weddings', 'कपल फोटोशूट', NULL, ARRAY[]::TEXT[], 'https://res.cloudinary.com/duovfafmc/image/upload/f_auto,q_auto,w_900,h_1200,c_fill/matajiphoto1_itgrfu.jpg', 70),
  ('studio_photo', 'events', 'स्वतंत्रता दिवस कार्यक्रम', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1597536980706-7cdd82f1bb16?w=900&h=1200&fit=crop&auto=format&q=70', 80),
  ('studio_photo', 'weddings', 'शादी के पल', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1633104502699-b2ecf0fee294?w=900&h=1200&fit=crop&auto=format&q=70', 90),
  ('studio_photo', 'weddings', 'प्री-वेडिंग शूट', NULL, ARRAY[]::TEXT[], 'https://images.unsplash.com/photo-1677770753024-25f65003625b?w=900&h=1200&fit=crop&auto=format&q=70', 100),
  ('studio_photo', 'weddings', 'कपल पोर्ट्रेट', NULL, ARRAY[]::TEXT[], 'https://res.cloudinary.com/duovfafmc/image/upload/f_auto,q_auto,w_900,h_1200,c_fill/pci2_e5lwhc.jpg', 110)
) AS seed(kind, category, title, price, features, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.catalog_items);
