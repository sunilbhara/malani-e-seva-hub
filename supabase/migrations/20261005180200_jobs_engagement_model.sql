-- Blueprint §15 data model, plus listing/analytics RPCs (P2, B2), push, preferences,
-- reminders (Loop 2), recruitment follows (Loop 3) and the daily GK quiz (Loop 4).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

------------------------------------------------------------------------------
-- Derived post fields for cards (no need to download full HTML for lists)
------------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS excerpt TEXT GENERATED ALWAYS AS (
    left(
      btrim(regexp_replace(
        regexp_replace(
          replace(replace(replace(replace(content, '&nbsp;', ' '), '&amp;', '&'), '&quot;', '"'), '&#39;', ''''),
          '<[^>]*>', ' ', 'g'),
        '[[:space:]]+', ' ', 'g')),
      220)
  ) STORED,
  ADD COLUMN IF NOT EXISTS read_time_min INTEGER GENERATED ALWAYS AS (
    greatest(1, ceil(coalesce(array_length(regexp_split_to_array(
      btrim(regexp_replace(regexp_replace(content, '<[^>]*>', ' ', 'g'), '[[:space:]]+', ' ', 'g')),
      ' '), 1), 0) / 200.0))::int
  ) STORED;

CREATE INDEX IF NOT EXISTS posts_title_trgm_idx ON public.posts USING gin (title extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_post_type_published_idx ON public.posts (post_type, published_at DESC);

------------------------------------------------------------------------------
-- Recruitments and structured job details
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 160),
  organisation TEXT NOT NULL CHECK (char_length(organisation) BETWEEN 2 AND 160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name)
);
ALTER TABLE public.recruitments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruitments are public" ON public.recruitments;
CREATE POLICY "Recruitments are public" ON public.recruitments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage recruitments" ON public.recruitments;
CREATE POLICY "Admins manage recruitments" ON public.recruitments FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.job_details (
  post_id UUID PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  recruitment_id UUID REFERENCES public.recruitments(id) ON DELETE SET NULL,
  organisation TEXT NOT NULL CHECK (char_length(organisation) BETWEEN 2 AND 160),
  total_posts INTEGER CHECK (total_posts IS NULL OR total_posts > 0),
  qualifications TEXT[] NOT NULL DEFAULT '{}'
    CHECK (qualifications <@ ARRAY['8th', '10th', '12th', 'iti', 'diploma', 'graduate', 'postgraduate', 'any']::TEXT[]),
  departments TEXT[] NOT NULL DEFAULT '{}'
    CHECK (departments <@ ARRAY['police', 'army', 'railway', 'bank', 'ssc', 'rpsc', 'rsmssb', 'upsc', 'teacher', 'patwari', 'clerk', 'health', 'electricity', 'other']::TEXT[]),
  state TEXT NOT NULL DEFAULT 'rajasthan' CHECK (state IN ('rajasthan', 'all_india', 'other')),
  age_min SMALLINT CHECK (age_min IS NULL OR age_min BETWEEN 14 AND 70),
  age_max SMALLINT CHECK (age_max IS NULL OR age_max BETWEEN 14 AND 70),
  fees JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(fees) = 'array'),
  salary TEXT CHECK (salary IS NULL OR char_length(salary) <= 160),
  apply_start DATE,
  last_date DATE,
  fee_last_date DATE,
  admit_card_date DATE,
  exam_date DATE,
  result_date DATE,
  extra_dates JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(extra_dates) = 'array'),
  apply_link TEXT CHECK (apply_link IS NULL OR apply_link ~ '^https?://'),
  notification_pdf TEXT CHECK (notification_pdf IS NULL OR notification_pdf ~ '^https?://'),
  official_website TEXT CHECK (official_website IS NULL OR official_website ~ '^https?://'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (age_min IS NULL OR age_max IS NULL OR age_min <= age_max),
  CHECK (apply_start IS NULL OR last_date IS NULL OR apply_start <= last_date)
);
CREATE INDEX IF NOT EXISTS job_details_last_date_idx ON public.job_details (last_date);
CREATE INDEX IF NOT EXISTS job_details_quals_idx ON public.job_details USING gin (qualifications);
CREATE INDEX IF NOT EXISTS job_details_depts_idx ON public.job_details USING gin (departments);
CREATE INDEX IF NOT EXISTS job_details_recruitment_idx ON public.job_details (recruitment_id);
ALTER TABLE public.job_details ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS job_details_set_updated_at ON public.job_details;
CREATE TRIGGER job_details_set_updated_at BEFORE UPDATE ON public.job_details
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Job details follow post visibility" ON public.job_details;
CREATE POLICY "Job details follow post visibility" ON public.job_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
DROP POLICY IF EXISTS "Admins manage job details" ON public.job_details;
CREATE POLICY "Admins manage job details" ON public.job_details FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

------------------------------------------------------------------------------
-- Follows / application tracker, reminders, preferences, push
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recruitment_follows (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recruitment_id UUID NOT NULL REFERENCES public.recruitments(id) ON DELETE CASCADE,
  applied BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recruitment_id)
);
ALTER TABLE public.recruitment_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own follows" ON public.recruitment_follows;
CREATE POLICY "Own follows" ON public.recruitment_follows FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint TEXT PRIMARY KEY CHECK (endpoint ~ '^https://' AND char_length(endpoint) <= 1000),
  p256dh TEXT NOT NULL CHECK (char_length(p256dh) <= 200),
  auth TEXT NOT NULL CHECK (char_length(auth) <= 100),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topics TEXT[] NOT NULL DEFAULT '{}',
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- No client policies: access only through the RPCs below or the service role.

CREATE OR REPLACE FUNCTION public.upsert_push_subscription(p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT, p_topics TEXT[] DEFAULT '{}')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.push_subscriptions (endpoint, p256dh, auth, user_id, topics)
  VALUES (p_endpoint, p_p256dh, p_auth, auth.uid(), COALESCE(p_topics, '{}'))
  ON CONFLICT (endpoint) DO UPDATE
    SET p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_id = COALESCE(EXCLUDED.user_id, public.push_subscriptions.user_id),
        topics = EXCLUDED.topics,
        failure_count = 0,
        updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_push_subscription(TEXT, TEXT, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_push_subscription(TEXT, TEXT, TEXT, TEXT[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_push_subscription(p_endpoint TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
$$;
REVOKE ALL ON FUNCTION public.delete_push_subscription(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_push_subscription(TEXT) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.job_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  push_endpoint TEXT REFERENCES public.push_subscriptions(endpoint) ON DELETE CASCADE,
  sent_3d_at TIMESTAMPTZ,
  sent_1d_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR push_endpoint IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS job_reminders_user_unique ON public.job_reminders (post_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS job_reminders_push_unique ON public.job_reminders (post_id, push_endpoint) WHERE user_id IS NULL;
ALTER TABLE public.job_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own reminders" ON public.job_reminders;
CREATE POLICY "Own reminders" ON public.job_reminders FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND push_endpoint IS NULL);

-- Guests (no login) can set a reminder tied to their push subscription.
CREATE OR REPLACE FUNCTION public.set_push_reminder(p_post_id UUID, p_endpoint TEXT, p_enabled BOOLEAN DEFAULT true)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE endpoint = p_endpoint) THEN
    RAISE EXCEPTION 'Unknown push subscription' USING ERRCODE = 'P0001';
  END IF;
  IF p_enabled THEN
    INSERT INTO public.job_reminders (post_id, push_endpoint)
    SELECT p_post_id, p_endpoint
    WHERE EXISTS (SELECT 1 FROM public.job_details WHERE post_id = p_post_id AND last_date IS NOT NULL)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.job_reminders WHERE post_id = p_post_id AND push_endpoint = p_endpoint AND user_id IS NULL;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_push_reminder(UUID, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_push_reminder(UUID, TEXT, BOOLEAN) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  qualification TEXT CHECK (qualification IS NULL OR qualification IN ('8th', '10th', '12th', 'iti', 'diploma', 'graduate', 'postgraduate')),
  departments TEXT[] NOT NULL DEFAULT '{}',
  district TEXT CHECK (district IS NULL OR char_length(district) <= 60),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own preferences" ON public.user_preferences;
CREATE POLICY "Own preferences" ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

------------------------------------------------------------------------------
-- Notifications on publish: followers of the recruitment get a marked title
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec_id UUID;
BEGIN
  IF NEW.status = 'published'
     AND NEW.published_at <= now()
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    SELECT recruitment_id INTO rec_id FROM public.job_details WHERE post_id = NEW.id;
    INSERT INTO public.user_notifications (user_id, post_id, title, body)
    SELECT p.id, NEW.id,
           CASE WHEN f.user_id IS NOT NULL THEN 'आपकी फॉलो की गई भर्ती: ' || NEW.title ELSE NEW.title END,
           NEW.seo_description
    FROM public.profiles p
    LEFT JOIN public.recruitment_follows f ON f.user_id = p.id AND f.recruitment_id = rec_id
    WHERE p.id <> NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_on_publish() FROM PUBLIC, anon, authenticated;

------------------------------------------------------------------------------
-- Listing RPC with server-side pagination, filters and search
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_posts(
  p_post_types TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_tag TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_qualification TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_job_status TEXT DEFAULT NULL,
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_exclude_id UUID DEFAULT NULL,
  p_ids UUID[] DEFAULT NULL,
  p_sort TEXT DEFAULT 'latest',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, slug TEXT, excerpt TEXT, image_url TEXT, category TEXT, tags TEXT[],
  post_type TEXT, published_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, is_verified BOOLEAN,
  read_time_min INTEGER, views_count INTEGER, likes_count INTEGER, comments_count INTEGER, share_count INTEGER,
  organisation TEXT, total_posts INTEGER, qualifications TEXT[], departments TEXT[], state TEXT,
  apply_start DATE, last_date DATE, exam_date DATE, recruitment_id UUID,
  job_status TEXT, days_left INTEGER, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH t AS (SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date AS today),
  base AS (
    SELECT p.id, p.title, p.slug, p.excerpt, p.image_url, p.category, p.tags, p.post_type,
           p.published_at, p.updated_at, p.is_verified, p.read_time_min,
           p.views_count, p.likes_count, p.comments_count, p.share_count,
           j.organisation, j.total_posts, j.qualifications, j.departments, j.state,
           j.apply_start, j.last_date, j.exam_date, j.recruitment_id,
           CASE
             WHEN j.last_date IS NULL THEN NULL
             WHEN j.last_date < t.today THEN 'closed'
             WHEN j.apply_start IS NOT NULL AND j.apply_start > t.today THEN 'upcoming'
             WHEN j.last_date - t.today <= 7 THEN 'closing'
             ELSE 'open'
           END AS job_status,
           CASE WHEN j.last_date IS NULL THEN NULL ELSE j.last_date - t.today END AS days_left
    FROM public.posts p
    CROSS JOIN t
    LEFT JOIN public.job_details j ON j.post_id = p.id
    WHERE p.status = 'published'
      AND p.published_at <= now()
      AND (p_post_types IS NULL OR p.post_type = ANY (p_post_types))
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_tag IS NULL OR p_tag = ANY (p.tags))
      AND (p_qualification IS NULL OR p_qualification = ANY (j.qualifications) OR 'any' = ANY (j.qualifications))
      AND (p_department IS NULL OR p_department = ANY (j.departments))
      AND (p_state IS NULL OR j.state = p_state)
      AND (p_since IS NULL OR p.published_at >= p_since)
      AND (p_exclude_id IS NULL OR p.id <> p_exclude_id)
      AND (p_ids IS NULL OR p.id = ANY (p_ids))
      AND (
        p_search IS NULL OR btrim(p_search) = ''
        OR p.title ILIKE '%' || btrim(p_search) || '%'
        OR p.excerpt ILIKE '%' || btrim(p_search) || '%'
        OR j.organisation ILIKE '%' || btrim(p_search) || '%'
        OR btrim(p_search) = ANY (p.tags)
      )
  )
  SELECT b.*, count(*) OVER () AS total_count
  FROM base b
  WHERE p_job_status IS NULL
     OR b.job_status = p_job_status
     OR (p_job_status = 'active' AND b.job_status IN ('open', 'closing', 'upcoming'))
  ORDER BY
    CASE WHEN p_sort = 'deadline' THEN b.last_date END ASC NULLS LAST,
    CASE WHEN p_sort = 'trending' THEN b.views_count + b.likes_count * 3 + b.comments_count * 2 + b.share_count * 4 END DESC NULLS LAST,
    CASE WHEN p_sort = 'posts' THEN b.total_posts END DESC NULLS LAST,
    b.published_at DESC
  LIMIT least(greatest(COALESCE(p_limit, 20), 1), 50)
  OFFSET greatest(COALESCE(p_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.list_posts(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID, UUID[], TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_posts(TEXT[], TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID, UUID[], TEXT, INTEGER, INTEGER) TO anon, authenticated;

------------------------------------------------------------------------------
-- B2: admin analytics computed in the database
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_blog_analytics()
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

  SELECT jsonb_build_object(
    'totals', (
      SELECT jsonb_build_object(
        'posts', count(*),
        'published', count(*) FILTER (WHERE status = 'published'),
        'drafts', count(*) FILTER (WHERE status = 'draft'),
        'scheduled', count(*) FILTER (WHERE status = 'scheduled'),
        'views', COALESCE(sum(views_count), 0),
        'likes', COALESCE(sum(likes_count), 0),
        'comments', COALESCE(sum(comments_count), 0),
        'shares', COALESCE(sum(share_count), 0),
        'bookmarks', COALESCE(sum(bookmarks_count), 0)
      ) FROM public.posts
    ),
    'subscribers', (SELECT count(*) FROM public.newsletter_subscribers
                    WHERE is_active AND confirmed_at IS NOT NULL AND unsubscribed_at IS NULL),
    'pending_subscribers', (SELECT count(*) FROM public.newsletter_subscribers WHERE confirmed_at IS NULL),
    'users', (SELECT count(*) FROM public.profiles),
    'push_subscribers', (SELECT count(*) FROM public.push_subscriptions),
    'reported_comments', (SELECT count(DISTINCT comment_id) FROM public.comment_reports),
    'categories', (
      SELECT COALESCE(jsonb_agg(c ORDER BY c.views DESC), '[]'::jsonb) FROM (
        SELECT COALESCE(category, 'general') AS category, count(*) AS count,
               COALESCE(sum(views_count), 0) AS views, COALESCE(sum(likes_count), 0) AS likes
        FROM public.posts GROUP BY 1
      ) c
    ),
    'trending', (
      SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) FROM (
        SELECT id, title, slug, views_count, likes_count, comments_count, share_count
        FROM public.posts WHERE status = 'published'
        ORDER BY views_count + likes_count * 3 + comments_count * 2 + share_count * 4 DESC
        LIMIT 5
      ) t
    ),
    'views_last_14_days', (
      SELECT jsonb_agg(jsonb_build_object('date', d::date, 'views', COALESCE(v.n, 0)) ORDER BY d)
      FROM generate_series(today - 13, today, interval '1 day') d
      LEFT JOIN (
        SELECT view_date, count(*) AS n FROM public.post_views
        WHERE view_date >= today - 13 GROUP BY view_date
      ) v ON v.view_date = d::date
    )
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_blog_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_blog_analytics() TO authenticated;

------------------------------------------------------------------------------
-- Loop 4: daily GK quiz (answers are revealed only after submitting)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date DATE NOT NULL,
  position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 20),
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 5 AND 500),
  options TEXT[] NOT NULL CHECK (array_length(options, 1) = 4),
  correct_index SMALLINT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation TEXT CHECK (explanation IS NULL OR char_length(explanation) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_date, position)
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Past and today's questions are public" ON public.quiz_questions;
CREATE POLICY "Past and today's questions are public" ON public.quiz_questions FOR SELECT
  USING (quiz_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage questions" ON public.quiz_questions;
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Hide the answer column from direct reads.
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_date, position, question, options, explanation, created_at) ON public.quiz_questions TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id TEXT,
  score SMALLINT NOT NULL,
  total SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR visitor_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_once
  ON public.quiz_attempts (quiz_date, COALESCE(user_id::text, visitor_id));
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own attempts" ON public.quiz_attempts;
CREATE POLICY "Own attempts" ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.submit_quiz(p_quiz_date DATE, p_answers SMALLINT[], p_visitor_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q RECORD;
  i INTEGER := 0;
  score INTEGER := 0;
  total INTEGER := 0;
  results JSONB := '[]'::jsonb;
  chosen SMALLINT;
BEGIN
  IF p_quiz_date > (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'This quiz is not open yet' USING ERRCODE = 'P0001';
  END IF;
  FOR q IN SELECT id, correct_index, explanation FROM public.quiz_questions WHERE quiz_date = p_quiz_date ORDER BY position LOOP
    i := i + 1;
    total := total + 1;
    chosen := p_answers[i];
    IF chosen = q.correct_index THEN
      score := score + 1;
    END IF;
    results := results || jsonb_build_object(
      'id', q.id, 'correct_index', q.correct_index, 'chosen', chosen,
      'is_correct', chosen = q.correct_index, 'explanation', q.explanation
    );
  END LOOP;

  IF total > 0 AND (auth.uid() IS NOT NULL OR (p_visitor_id IS NOT NULL AND p_visitor_id ~ '^[A-Za-z0-9-]{8,64}$')) THEN
    INSERT INTO public.quiz_attempts (quiz_date, user_id, visitor_id, score, total)
    VALUES (p_quiz_date, auth.uid(), CASE WHEN auth.uid() IS NULL THEN p_visitor_id END, score, total)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('score', score, 'total', total, 'results', results);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_quiz(DATE, SMALLINT[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz(DATE, SMALLINT[], TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_quiz_questions(p_quiz_date DATE)
RETURNS SETOF public.quiz_questions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.quiz_questions WHERE quiz_date = p_quiz_date ORDER BY position;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_quiz_questions(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_quiz_questions(DATE) TO authenticated;
