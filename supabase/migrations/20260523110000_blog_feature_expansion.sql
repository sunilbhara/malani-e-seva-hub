-- Blog feature expansion: publishing workflow, SEO, tags, analytics,
-- bookmarks, reactions, newsletters, and in-app notifications.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'hi',
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS official_link TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.posts
SET
  status = COALESCE(NULLIF(status, ''), 'published'),
  published_at = COALESCE(published_at, created_at),
  category = COALESCE(NULLIF(category, ''), 'general'),
  language = COALESCE(NULLIF(language, ''), 'hi')
WHERE published_at IS NULL
   OR status IS NULL
   OR category IS NULL
   OR language IS NULL;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  ADD CONSTRAINT posts_language_check CHECK (language IN ('hi', 'en')),
  ADD CONSTRAINT posts_post_type_check CHECK (post_type IN ('article', 'job', 'admit_card', 'result', 'exam', 'local_news', 'guide'));

CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('helpful', 'important', 'informative', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  categories TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_status_published_at_idx ON public.posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts(category);
CREATE INDEX IF NOT EXISTS posts_tags_gin_idx ON public.posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS post_views_post_id_idx ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS post_bookmarks_user_id_idx ON public.post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications(user_id, created_at DESC);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (
    status = 'published'
    OR public.has_role(auth.uid(), 'admin')
    OR auth.uid() = author_id
  );

DROP POLICY IF EXISTS "Post views are insertable by everyone" ON public.post_views;
CREATE POLICY "Post views are insertable by everyone"
  ON public.post_views FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read post views" ON public.post_views;
CREATE POLICY "Admins can read post views"
  ON public.post_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read own bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can read own bookmarks"
  ON public.post_bookmarks FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can bookmark posts" ON public.post_bookmarks;
CREATE POLICY "Users can bookmark posts"
  ON public.post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON public.post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.post_reactions;
CREATE POLICY "Reactions are viewable by everyone"
  ON public.post_reactions FOR SELECT
  USING (true);
DROP POLICY IF EXISTS "Users can react to posts" ON public.post_reactions;
CREATE POLICY "Users can react to posts"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.post_reactions;
CREATE POLICY "Users can remove own reactions"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can read newsletter subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
CREATE POLICY "Users can read own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can create notifications" ON public.user_notifications;
CREATE POLICY "Admins can create notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
