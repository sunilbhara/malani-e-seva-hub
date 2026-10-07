-- Supabase advisor fixes:
--  * auth_rls_initplan: evaluate auth.uid() / has_role() once per query, not once per row
--  * multiple_permissive_policies: admin write policies split from public read policies
--  * unindexed_foreign_keys: covering indexes
--  * trigger/event-trigger functions are not callable through the API

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN (
      'profiles', 'user_roles', 'posts', 'comments', 'post_likes', 'post_views', 'post_bookmarks',
      'post_reactions', 'newsletter_subscribers', 'user_notifications', 'post_shares', 'comment_reports',
      'recruitments', 'job_details', 'recruitment_follows', 'job_reminders', 'user_preferences',
      'quiz_questions', 'quiz_attempts', 'push_subscriptions')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

-- user_roles
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- posts
CREATE POLICY "Published posts are viewable by everyone" ON public.posts FOR SELECT
  USING (
    (status = 'published' AND published_at <= now())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'))
    OR (SELECT auth.uid()) = author_id
  );
CREATE POLICY "Admins can insert posts" ON public.posts FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins can update posts" ON public.posts FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins can delete posts" ON public.posts FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT
  USING (NOT is_hidden OR (SELECT auth.uid()) = user_id OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own comments or admins can" ON public.comments FOR DELETE
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- post_likes
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can unlike (delete own)" ON public.post_likes FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- post_views (writes only through record_post_view)
CREATE POLICY "Admins can read post views" ON public.post_views FOR SELECT
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- post_bookmarks
CREATE POLICY "Users can read own bookmarks" ON public.post_bookmarks FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Users can bookmark posts" ON public.post_bookmarks FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.post_bookmarks FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- post_reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react to posts" ON public.post_reactions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can remove own reactions" ON public.post_reactions FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- newsletter_subscribers (writes only through the newsletter edge function)
CREATE POLICY "Admins can read newsletter subscribers" ON public.newsletter_subscribers FOR SELECT
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- user_notifications
CREATE POLICY "Users can read own notifications" ON public.user_notifications FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Users can update own notifications" ON public.user_notifications FOR UPDATE
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- post_shares
CREATE POLICY "Admins can read shares" ON public.post_shares FOR SELECT
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- comment_reports
CREATE POLICY "Users can report comments" ON public.comment_reports FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = reporter_id);
CREATE POLICY "Admins read reports" ON public.comment_reports FOR SELECT
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete reports" ON public.comment_reports FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- recruitments
CREATE POLICY "Recruitments are public" ON public.recruitments FOR SELECT USING (true);
CREATE POLICY "Admins insert recruitments" ON public.recruitments FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update recruitments" ON public.recruitments FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete recruitments" ON public.recruitments FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- job_details (read follows post visibility, which already includes admins)
CREATE POLICY "Job details follow post visibility" ON public.job_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "Admins insert job details" ON public.job_details FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update job details" ON public.job_details FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete job details" ON public.job_details FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- own-row tables
CREATE POLICY "Own follows" ON public.recruitment_follows FOR ALL
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Own reminders" ON public.job_reminders FOR ALL
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id AND push_endpoint IS NULL);
CREATE POLICY "Own preferences" ON public.user_preferences FOR ALL
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Own attempts" ON public.quiz_attempts FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- quiz_questions
CREATE POLICY "Past and today's questions are public" ON public.quiz_questions FOR SELECT
  USING (quiz_date <= (now() AT TIME ZONE 'Asia/Kolkata')::date OR (SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins insert questions" ON public.quiz_questions FOR INSERT
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins update questions" ON public.quiz_questions FOR UPDATE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')))
  WITH CHECK ((SELECT public.has_role((SELECT auth.uid()), 'admin')));
CREATE POLICY "Admins delete questions" ON public.quiz_questions FOR DELETE
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- push_subscriptions (writes only through RPCs)
CREATE POLICY "Admins read push subscriptions" ON public.push_subscriptions FOR SELECT
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin')));

-- Covering indexes for foreign keys
CREATE INDEX IF NOT EXISTS comment_reports_reporter_idx ON public.comment_reports (reporter_id);
CREATE INDEX IF NOT EXISTS job_reminders_push_endpoint_idx ON public.job_reminders (push_endpoint);
CREATE INDEX IF NOT EXISTS job_reminders_user_idx ON public.job_reminders (user_id);
CREATE INDEX IF NOT EXISTS post_likes_user_idx ON public.post_likes (user_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_idx ON public.post_reactions (user_id);
CREATE INDEX IF NOT EXISTS post_views_user_idx ON public.post_views (user_id);
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON public.quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS recruitment_follows_recruitment_idx ON public.recruitment_follows (recruitment_id);
CREATE INDEX IF NOT EXISTS user_notifications_post_idx ON public.user_notifications (post_id);

-- Trigger functions are not meant to be called through /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.bump_post_views_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_post_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_post_comments_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_post_bookmarks_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.posts_set_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.posts_normalize_publish() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
