-- Security hardening and correctness fixes from the 2026-10 audit.
-- S2 views, S10 shares, S3/S4 personal data, B1 scheduled posts, S7 newsletter, B3 notifications.

------------------------------------------------------------------------------
-- S2: trustworthy view counting (one view per visitor per post per Mumbai day)
------------------------------------------------------------------------------
ALTER TABLE public.post_views
  ADD COLUMN IF NOT EXISTS view_date DATE
  GENERATED ALWAYS AS ((created_at AT TIME ZONE 'Asia/Kolkata')::date) STORED;

DELETE FROM public.post_views a
USING public.post_views b
WHERE a.ctid > b.ctid
  AND a.post_id = b.post_id
  AND a.visitor_id IS NOT DISTINCT FROM b.visitor_id
  AND a.view_date = b.view_date;

CREATE UNIQUE INDEX IF NOT EXISTS post_views_daily_unique
  ON public.post_views (post_id, visitor_id, view_date);

DROP POLICY IF EXISTS "Post views are insertable by everyone" ON public.post_views;

CREATE OR REPLACE FUNCTION public.record_post_view(p_post_id UUID, p_visitor_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_visitor_id IS NULL OR p_visitor_id !~ '^[A-Za-z0-9-]{8,64}$' THEN
    RETURN;
  END IF;
  INSERT INTO public.post_views (post_id, user_id, visitor_id)
  SELECT p_post_id, auth.uid(), p_visitor_id
  WHERE EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = p_post_id AND status = 'published' AND published_at <= now()
  )
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.record_post_view(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_post_view(UUID, TEXT) TO anon, authenticated;

UPDATE public.posts p
SET views_count = (SELECT count(*) FROM public.post_views v WHERE v.post_id = p.id);

------------------------------------------------------------------------------
-- S10: share logging (one counted share per visitor per post per day)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'other'
    CHECK (channel IN ('whatsapp', 'telegram', 'native', 'copy', 'status_card', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  share_date DATE GENERATED ALWAYS AS ((created_at AT TIME ZONE 'Asia/Kolkata')::date) STORED
);
CREATE UNIQUE INDEX IF NOT EXISTS post_shares_daily_unique
  ON public.post_shares (post_id, visitor_id, share_date);
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read shares" ON public.post_shares;
CREATE POLICY "Admins can read shares" ON public.post_shares FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.bump_post_share_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bump_post_share_count() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS post_shares_bump_count ON public.post_shares;
CREATE TRIGGER post_shares_bump_count
  AFTER INSERT ON public.post_shares
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_share_count();

CREATE OR REPLACE FUNCTION public.record_post_share(p_post_id UUID, p_visitor_id TEXT, p_channel TEXT DEFAULT 'other')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_visitor_id IS NULL OR p_visitor_id !~ '^[A-Za-z0-9-]{8,64}$' THEN
    RETURN;
  END IF;
  INSERT INTO public.post_shares (post_id, visitor_id, channel)
  SELECT p_post_id, p_visitor_id,
         CASE WHEN p_channel IN ('whatsapp', 'telegram', 'native', 'copy', 'status_card') THEN p_channel ELSE 'other' END
  WHERE EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = p_post_id AND status = 'published' AND published_at <= now()
  )
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.record_post_share(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_post_share(UUID, TEXT, TEXT) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.increment_post_share_count(UUID);

------------------------------------------------------------------------------
-- S3 / S4: personal data
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(btrim(NEW.raw_user_meta_data->>'name'), ''),
      'पाठक'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

UPDATE public.profiles SET full_name = 'पाठक' WHERE full_name LIKE '%@%';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_full_name_not_email,
  ADD CONSTRAINT profiles_full_name_not_email CHECK (full_name IS NULL OR full_name NOT LIKE '%@%') NOT VALID;

DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Profiles: users may only change their display name and avatar.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

------------------------------------------------------------------------------
-- B1: publishing rules and scheduled publishing
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.posts_normalize_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  ELSIF NEW.status = 'scheduled' THEN
    IF NEW.scheduled_at IS NULL THEN
      RAISE EXCEPTION 'scheduled_at is required when status is scheduled';
    END IF;
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_normalize_publish ON public.posts;
CREATE TRIGGER posts_normalize_publish
  BEFORE INSERT OR UPDATE OF status, published_at, scheduled_at ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_normalize_publish();

CREATE OR REPLACE FUNCTION public.publish_due_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  UPDATE public.posts
  SET status = 'published', published_at = scheduled_at
  WHERE status = 'scheduled' AND scheduled_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_due_posts() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published posts are viewable by everyone" ON public.posts FOR SELECT
  USING (
    (status = 'published' AND published_at <= now())
    OR public.has_role(auth.uid(), 'admin')
    OR auth.uid() = author_id
  );

------------------------------------------------------------------------------
-- S7: newsletter goes through the `newsletter` edge function only
------------------------------------------------------------------------------
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirm_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_text TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
REVOKE INSERT, UPDATE, DELETE ON public.newsletter_subscribers FROM anon, authenticated;

------------------------------------------------------------------------------
-- B3: notifications are created in the database when a post goes live
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND NEW.published_at <= now()
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO public.user_notifications (user_id, post_id, title, body)
    SELECT p.id, NEW.id, NEW.title, NEW.seo_description
    FROM public.profiles p
    WHERE p.id <> NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_on_publish() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS posts_notify_on_publish ON public.posts;
CREATE TRIGGER posts_notify_on_publish
  AFTER INSERT OR UPDATE OF status ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_publish();

-- Users may only mark their own notifications as read.
REVOKE UPDATE ON public.user_notifications FROM anon, authenticated;
GRANT UPDATE (read_at) ON public.user_notifications TO authenticated;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.user_notifications;
REVOKE INSERT ON public.user_notifications FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids UUID[] DEFAULT NULL)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.user_notifications
  SET read_at = now()
  WHERE user_id = auth.uid()
    AND read_at IS NULL
    AND (p_ids IS NULL OR id = ANY (p_ids));
$$;
REVOKE ALL ON FUNCTION public.mark_notifications_read(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read(UUID[]) TO authenticated;
