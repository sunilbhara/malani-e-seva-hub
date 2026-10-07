-- S9: comment limits and moderation; Blueprint Loop 6: Q&A replies, pinned answers, reply notifications.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_content_length,
  ADD CONSTRAINT comments_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000) NOT VALID;

CREATE INDEX IF NOT EXISTS comments_post_created_idx ON public.comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON public.comments (parent_id);
CREATE INDEX IF NOT EXISTS comments_user_created_idx ON public.comments (user_id, created_at DESC);

-- Validation + rate limit on new comments.
CREATE OR REPLACE FUNCTION public.comments_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_post UUID;
  parent_parent UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = NEW.post_id AND status = 'published' AND published_at <= now()
  ) THEN
    RAISE EXCEPTION 'Comments are closed for this post' USING ERRCODE = 'P0001';
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT post_id, parent_id INTO parent_post, parent_parent FROM public.comments WHERE id = NEW.parent_id;
    IF parent_post IS DISTINCT FROM NEW.post_id OR parent_parent IS NOT NULL THEN
      RAISE EXCEPTION 'Replies must answer a top-level question on the same post' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF NOT public.has_role(NEW.user_id, 'admin') AND (
    SELECT count(*) FROM public.comments
    WHERE user_id = NEW.user_id AND created_at > now() - interval '10 minutes'
  ) >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT: too many comments, please wait a few minutes' USING ERRCODE = 'P0001';
  END IF;

  NEW.content := btrim(NEW.content);
  NEW.is_hidden := false;
  NEW.is_pinned := false;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.comments_before_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS comments_before_insert ON public.comments;
CREATE TRIGGER comments_before_insert
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.comments_before_insert();

DROP TRIGGER IF EXISTS comments_set_updated_at ON public.comments;
CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Users can only write the content of their own comments; moderation goes through an RPC.
REVOKE INSERT, UPDATE ON public.comments FROM anon, authenticated;
GRANT INSERT (post_id, user_id, content, parent_id) ON public.comments TO authenticated;
GRANT UPDATE (content) ON public.comments TO authenticated;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT
  USING (NOT is_hidden OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.moderate_comment(p_comment_id UUID, p_hidden BOOLEAN DEFAULT NULL, p_pinned BOOLEAN DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can moderate comments' USING ERRCODE = '42501';
  END IF;
  UPDATE public.comments
  SET is_hidden = COALESCE(p_hidden, is_hidden),
      is_pinned = COALESCE(p_pinned, is_pinned)
  WHERE id = p_comment_id;
END;
$$;
REVOKE ALL ON FUNCTION public.moderate_comment(UUID, BOOLEAN, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_comment(UUID, BOOLEAN, BOOLEAN) TO authenticated;

-- Reports: three reports hide a comment until an admin reviews it.
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, reporter_id)
);
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can report comments" ON public.comment_reports;
CREATE POLICY "Users can report comments" ON public.comment_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Admins read reports" ON public.comment_reports;
CREATE POLICY "Admins read reports" ON public.comment_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete reports" ON public.comment_reports;
CREATE POLICY "Admins delete reports" ON public.comment_reports FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.comment_reports_autohide()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.comment_reports WHERE comment_id = NEW.comment_id) >= 3 THEN
    UPDATE public.comments SET is_hidden = true WHERE id = NEW.comment_id AND NOT is_pinned;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.comment_reports_autohide() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS comment_reports_autohide ON public.comment_reports;
CREATE TRIGGER comment_reports_autohide
  AFTER INSERT ON public.comment_reports
  FOR EACH ROW EXECUTE FUNCTION public.comment_reports_autohide();

-- Tell the person who asked when someone answers.
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asker UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT user_id INTO asker FROM public.comments WHERE id = NEW.parent_id;
  IF asker IS NOT NULL AND asker <> NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, post_id, title, body)
    VALUES (asker, NEW.post_id, 'आपके सवाल का जवाब आया है', left(NEW.content, 140));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_on_reply() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS comments_notify_on_reply ON public.comments;
CREATE TRIGGER comments_notify_on_reply
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_reply();
