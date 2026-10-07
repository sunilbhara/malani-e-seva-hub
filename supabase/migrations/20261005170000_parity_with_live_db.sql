-- Brings a fresh database in line with the production database as it existed
-- on 2026-10-05 (Singapore project awdvmlmbqvvkjjcquowv), which had drifted from
-- the earlier migration files:
--   * the SQL slug trigger/functions still existed despite remove_sql_slugify
--   * an `ensure_rls` event trigger auto-enables RLS on new public tables
--   * "Admins can update posts" also had a WITH CHECK clause
-- Applied to the Mumbai project (lncyzrytctqijvhjprtu) during the region move.

CREATE OR REPLACE FUNCTION public.slugify(_input text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  s TEXT;
BEGIN
  IF _input IS NULL THEN RETURN NULL; END IF;
  s := lower(_input);
  -- replace non-alphanumerics (preserve unicode letters) with hyphen
  s := regexp_replace(s, '[^a-z0-9ऀ-ॿ]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  IF s = '' OR s IS NULL THEN s := 'post'; END IF;
  RETURN s;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_unique_post_slug(_title text, _post_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.posts_set_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_unique_post_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_posts_set_slug ON public.posts;
CREATE TRIGGER trg_posts_set_slug BEFORE INSERT OR UPDATE OF title, slug ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_set_slug();

DROP POLICY IF EXISTS "Admins can update posts" ON public.posts;
CREATE POLICY "Admins can update posts" ON public.posts FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end EXECUTE FUNCTION public.rls_auto_enable();
