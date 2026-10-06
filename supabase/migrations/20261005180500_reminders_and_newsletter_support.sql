-- Support functions for the send-reminders and newsletter edge functions.

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirm_sent_at TIMESTAMPTZ;

-- Reminders that are due today (Mumbai time): 3 days and 1 day before the last date.
CREATE OR REPLACE FUNCTION public.due_reminders()
RETURNS TABLE (
  reminder_id UUID, stage TEXT, post_id UUID, user_id UUID, push_endpoint TEXT,
  title TEXT, slug TEXT, last_date DATE, organisation TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH t AS (SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS today)
  SELECT r.id,
         CASE WHEN j.last_date - t.today = 3 THEN '3d' ELSE '1d' END,
         r.post_id, r.user_id, r.push_endpoint, p.title, p.slug, j.last_date, j.organisation
  FROM public.job_reminders r
  CROSS JOIN t
  JOIN public.job_details j ON j.post_id = r.post_id
  JOIN public.posts p ON p.id = r.post_id AND p.status = 'published'
  WHERE (j.last_date - t.today = 3 AND r.sent_3d_at IS NULL)
     OR (j.last_date - t.today = 1 AND r.sent_1d_at IS NULL);
$$;
REVOKE ALL ON FUNCTION public.due_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.due_reminders() TO service_role;
