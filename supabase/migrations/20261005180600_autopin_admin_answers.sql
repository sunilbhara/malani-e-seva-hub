-- Admin answers to questions are pinned automatically, so readers can recognise official
-- answers without the admin list being public (audit S4).
CREATE OR REPLACE FUNCTION public.comments_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_post UUID;
  parent_parent UUID;
  is_admin BOOLEAN := public.has_role(NEW.user_id, 'admin');
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

  IF NOT is_admin AND (
    SELECT count(*) FROM public.comments
    WHERE user_id = NEW.user_id AND created_at > now() - interval '10 minutes'
  ) >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT: too many comments, please wait a few minutes' USING ERRCODE = 'P0001';
  END IF;

  NEW.content := btrim(NEW.content);
  NEW.is_hidden := false;
  NEW.is_pinned := (is_admin AND NEW.parent_id IS NOT NULL);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.comments_before_insert() FROM PUBLIC, anon, authenticated;
