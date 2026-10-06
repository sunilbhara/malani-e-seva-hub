-- Public blog read access: fix has_role grants, denormalized engagement counts,
-- count triggers, and anon-safe share increment RPC.

-- RLS policies call has_role(); anon/authenticated must be able to execute it.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS bookmarks_count INTEGER NOT NULL DEFAULT 0;

-- Keep denormalized counts in sync with engagement tables.
CREATE OR REPLACE FUNCTION public.bump_post_views_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET views_count = views_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_post_bookmarks_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET bookmarks_count = GREATEST(bookmarks_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS post_views_bump_count ON public.post_views;
CREATE TRIGGER post_views_bump_count
  AFTER INSERT ON public.post_views
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_views_count();

DROP TRIGGER IF EXISTS post_likes_bump_count ON public.post_likes;
CREATE TRIGGER post_likes_bump_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_likes_count();

DROP TRIGGER IF EXISTS post_comments_bump_count ON public.comments;
CREATE TRIGGER post_comments_bump_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_comments_count();

DROP TRIGGER IF EXISTS post_bookmarks_bump_count ON public.post_bookmarks;
CREATE TRIGGER post_bookmarks_bump_count
  AFTER INSERT OR DELETE ON public.post_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.bump_post_bookmarks_count();

-- Backfill counts from source tables (admin-only reads are fine here).
UPDATE public.posts p
SET
  views_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM public.post_views v WHERE v.post_id = p.id
  ), 0),
  likes_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM public.post_likes l WHERE l.post_id = p.id
  ), 0),
  comments_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM public.comments c WHERE c.post_id = p.id
  ), 0),
  bookmarks_count = COALESCE((
    SELECT COUNT(*)::INTEGER FROM public.post_bookmarks b WHERE b.post_id = p.id
  ), 0);

-- Allow anonymous users to increment share counts on published posts.
CREATE OR REPLACE FUNCTION public.increment_post_share_count(p_post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET share_count = share_count + 1
  WHERE id = p_post_id
    AND status = 'published';
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_share_count(UUID) TO anon, authenticated;

-- Ensure published posts remain readable by everyone (including anon).
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'admin')
    OR auth.uid() = author_id
  );
