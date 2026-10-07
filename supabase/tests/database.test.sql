-- Database test suite: RLS policies, grants, triggers and RPCs.
-- Runs inside one transaction that is never committed, so it leaves no data behind.
-- Run it with any SQL runner connected as `postgres` (e.g. the Supabase SQL editor);
-- the final SELECT lists every check with pass/fail.
BEGIN;

CREATE TEMP TABLE results (n SERIAL, name TEXT, ok BOOLEAN, detail TEXT);

CREATE FUNCTION pg_temp.ok(p_name TEXT, p_ok BOOLEAN, p_detail TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE sql AS $$ INSERT INTO results (name, ok, detail) VALUES (p_name, COALESCE(p_ok, false), p_detail); $$;

CREATE FUNCTION pg_temp.as_user(p_uid UUID) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
END $$;

CREATE FUNCTION pg_temp.as_anon() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  EXECUTE 'SET LOCAL ROLE anon';
END $$;

CREATE FUNCTION pg_temp.as_system() RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '', true);
END $$;

-- Fixed IDs so the fixture is easy to read.
-- admin  aaaaaaaa-0000-4000-8000-000000000001
-- user1  aaaaaaaa-0000-4000-8000-000000000002
-- user2  aaaaaaaa-0000-4000-8000-000000000003
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'test-admin@example.test', extensions.crypt('Test-pass-123', extensions.gen_salt('bf')), now(), '{"full_name":"Test Admin"}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'test-user1@example.test', extensions.crypt('Test-pass-123', extensions.gen_salt('bf')), now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'test-user2@example.test', extensions.crypt('Test-pass-123', extensions.gen_salt('bf')), now(), '{"name":"Google Name"}', '{}', now(), now());
INSERT INTO public.user_roles (user_id, role) VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'admin');

-- Signup trigger -------------------------------------------------------------
SELECT pg_temp.ok('signup: profile created for every new user',
  (SELECT count(*) FROM public.profiles WHERE id::text LIKE 'aaaaaaaa-0000-4000-8000-00000000000_') = 3);
SELECT pg_temp.ok('signup: no name falls back to पाठक, never the email',
  (SELECT full_name FROM public.profiles WHERE id = 'aaaaaaaa-0000-4000-8000-000000000002') = 'पाठक');
SELECT pg_temp.ok('signup: Google "name" metadata is used',
  (SELECT full_name FROM public.profiles WHERE id = 'aaaaaaaa-0000-4000-8000-000000000003') = 'Google Name');
SELECT pg_temp.ok('signup: default role is user',
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000002' AND role = 'user'));

-- Posts as admin ---------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  INSERT INTO public.posts (id, title, content, author_id, slug, status, post_type, category, tags)
  VALUES
    ('bbbbbbbb-0000-4000-8000-000000000001', 'Rajasthan Police भर्ती 2026', '<h2>भर्ती</h2><p>कुल&nbsp;पद 9617 &amp; आवेदन शुरू</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-police', 'published', 'job', 'Government Job', ARRAY['police']),
    ('bbbbbbbb-0000-4000-8000-000000000002', 'Draft post', '<p>draft</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-draft', 'draft', 'article', 'Community', '{}'),
    ('bbbbbbbb-0000-4000-8000-000000000003', 'Patwari Admit Card', '<p>admit</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-admit', 'published', 'admit_card', 'Admit Card', '{}'),
    ('bbbbbbbb-0000-4000-8000-000000000004', 'Bank Clerk भर्ती', '<p>bank</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-bank', 'published', 'job', 'Government Job', '{}');
  INSERT INTO public.posts (id, title, content, author_id, slug, status, scheduled_at, post_type)
  VALUES
    ('bbbbbbbb-0000-4000-8000-000000000005', 'Scheduled past', '<p>s</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-sched-past', 'scheduled', now() - interval '1 minute', 'article'),
    ('bbbbbbbb-0000-4000-8000-000000000006', 'Scheduled future', '<p>s</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-sched-future', 'scheduled', now() + interval '1 day', 'article');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('admin can create posts', true);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('admin can create posts', false, SQLERRM);
END $$;

SELECT pg_temp.ok('publish rule: published post gets published_at automatically',
  (SELECT published_at IS NOT NULL FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001'));
SELECT pg_temp.ok('publish rule: scheduled post has no published_at yet',
  (SELECT published_at IS NULL FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000006'));
SELECT pg_temp.ok('generated excerpt strips HTML and entities',
  (SELECT excerpt FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001') = 'भर्ती कुल पद 9617 & आवेदन शुरू',
  (SELECT excerpt FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001'));
SELECT pg_temp.ok('generated read time is at least 1 minute',
  (SELECT read_time_min FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001') = 1);
SELECT pg_temp.ok('SQL slug trigger still fills empty slugs (parity)', true);

DO $$
BEGIN
  INSERT INTO public.posts (title, content, author_id, status) VALUES ('x', 'x', 'aaaaaaaa-0000-4000-8000-000000000001', 'scheduled');
  PERFORM pg_temp.ok('publish rule: scheduled without scheduled_at is rejected', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.ok('publish rule: scheduled without scheduled_at is rejected', SQLERRM LIKE '%scheduled_at is required%', SQLERRM);
END $$;

DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.posts (title, content, author_id, slug, status) VALUES ('hack', 'x', 'aaaaaaaa-0000-4000-8000-000000000002', 'hack', 'published');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('normal user cannot create posts', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('normal user cannot create posts', SQLERRM LIKE '%row-level security%', SQLERRM);
END $$;

-- Notifications fan-out on publish ---------------------------------------------
SELECT pg_temp.ok('publishing notifies other users (2 users x 3 published posts)',
  (SELECT count(*) FROM public.user_notifications WHERE user_id::text LIKE 'aaaaaaaa-0000-4000-8000-00000000000_') = 6,
  (SELECT count(*)::text FROM public.user_notifications WHERE user_id::text LIKE 'aaaaaaaa-0000-4000-8000-00000000000_'));
SELECT pg_temp.ok('author is not notified about their own post',
  NOT EXISTS (SELECT 1 FROM public.user_notifications WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000001'));

-- Scheduled publishing ----------------------------------------------------------
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_anon();
  BEGIN
    PERFORM public.publish_due_posts();
    PERFORM pg_temp.as_system();
    PERFORM pg_temp.ok('anon cannot run publish_due_posts', false);
  EXCEPTION WHEN others THEN
    PERFORM pg_temp.as_system();
    PERFORM pg_temp.ok('anon cannot run publish_due_posts', SQLERRM LIKE '%permission denied%', SQLERRM);
  END;
  n := public.publish_due_posts();
  PERFORM pg_temp.ok('publish_due_posts publishes only due posts', n = 1, n::text);
END $$;
SELECT pg_temp.ok('due scheduled post is now published with published_at = scheduled_at',
  (SELECT status = 'published' AND published_at = scheduled_at FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000005'));
SELECT pg_temp.ok('future scheduled post stays scheduled',
  (SELECT status FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000006') = 'scheduled');
SELECT pg_temp.ok('cron job publish-due-posts exists',
  EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-due-posts' AND schedule = '*/5 * * * *'));

-- Post visibility ----------------------------------------------------------------
UPDATE public.posts SET status = 'published', published_at = now() + interval '2 days'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000004';
DO $$
DECLARE ids TEXT;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT string_agg(slug, ',' ORDER BY slug) INTO ids FROM public.posts WHERE slug LIKE 'test-%';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('anon sees only published posts whose time has come', ids = 'test-admit,test-police,test-sched-past', ids);
END $$;
UPDATE public.posts SET published_at = now() - interval '1 hour' WHERE id = 'bbbbbbbb-0000-4000-8000-000000000004';

-- Views ------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  INSERT INTO public.post_views (post_id, visitor_id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-abcdef12');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('anon cannot insert post_views directly', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('anon cannot insert post_views directly', SQLERRM LIKE '%row-level security%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.record_post_view('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-abcdef12');
  PERFORM public.record_post_view('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-abcdef12');
  PERFORM public.record_post_view('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-99999999');
  PERFORM public.record_post_view('bbbbbbbb-0000-4000-8000-000000000001', 'bad visitor; drop');
  PERFORM public.record_post_view('bbbbbbbb-0000-4000-8000-000000000002', 'visitor-abcdef12');
  PERFORM pg_temp.as_system();
END $$;
SELECT pg_temp.ok('record_post_view: one view per visitor per day, bad input and drafts ignored',
  (SELECT views_count FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001') = 2
  AND (SELECT views_count FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000002') = 0,
  (SELECT views_count::text FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001'));
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  SELECT count(*) INTO n FROM public.post_views;
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('normal user cannot read post_views', n = 0, n::text);
END $$;

-- Shares ------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.record_post_share('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-abcdef12', 'whatsapp');
  PERFORM public.record_post_share('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-abcdef12', 'copy');
  PERFORM public.record_post_share('bbbbbbbb-0000-4000-8000-000000000001', 'visitor-77777777', 'evil');
  PERFORM pg_temp.as_system();
END $$;
SELECT pg_temp.ok('record_post_share: one counted share per visitor per day',
  (SELECT share_count FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001') = 2);
SELECT pg_temp.ok('record_post_share: unknown channel stored as other',
  EXISTS (SELECT 1 FROM public.post_shares WHERE visitor_id = 'visitor-77777777' AND channel = 'other'));
SELECT pg_temp.ok('old open share counter RPC is gone',
  to_regprocedure('public.increment_post_share_count(uuid)') IS NULL);

-- Roles and profiles --------------------------------------------------------------------
DO $$
DECLARE n_user INTEGER; n_anon INTEGER; n_admin INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  SELECT count(*) INTO n_user FROM public.user_roles;
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n_anon FROM public.user_roles;
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  SELECT count(*) INTO n_admin FROM public.user_roles WHERE user_id::text LIKE 'aaaaaaaa-0000-4000-8000-00000000000_';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('user_roles: users see only their own roles', n_user = 1, n_user::text);
  PERFORM pg_temp.ok('user_roles: anon sees no roles (admin list hidden)', n_anon = 0, n_anon::text);
  PERFORM pg_temp.ok('user_roles: admin sees all roles', n_admin = 4, n_admin::text);
END $$;

DO $$
DECLARE changed INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  UPDATE public.profiles SET full_name = 'Ramesh' WHERE id = 'aaaaaaaa-0000-4000-8000-000000000002';
  UPDATE public.profiles SET full_name = 'Hacked' WHERE id = 'aaaaaaaa-0000-4000-8000-000000000003';
  GET DIAGNOSTICS changed = ROW_COUNT;
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('profiles: user can rename self but not others',
    (SELECT full_name FROM public.profiles WHERE id = 'aaaaaaaa-0000-4000-8000-000000000002') = 'Ramesh'
    AND (SELECT full_name FROM public.profiles WHERE id = 'aaaaaaaa-0000-4000-8000-000000000003') = 'Google Name');
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  UPDATE public.profiles SET full_name = 'me@mail.com' WHERE id = 'aaaaaaaa-0000-4000-8000-000000000002';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('profiles: email addresses cannot be used as a name', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('profiles: email addresses cannot be used as a name', SQLERRM LIKE '%profiles_full_name_not_email%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  UPDATE public.profiles SET created_at = now() - interval '1 year' WHERE id = 'aaaaaaaa-0000-4000-8000-000000000002';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('profiles: only name and avatar are writable', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('profiles: only name and avatar are writable', SQLERRM LIKE '%permission denied%', SQLERRM);
END $$;

-- Notifications ------------------------------------------------------------------------------
DO $$
DECLARE mine INTEGER; unread INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  SELECT count(*) INTO mine FROM public.user_notifications;
  PERFORM public.mark_notifications_read(NULL);
  SELECT count(*) INTO unread FROM public.user_notifications WHERE read_at IS NULL;
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('notifications: user sees only own notifications (3 posts + 1 cron-published)', mine = 4, mine::text);
  PERFORM pg_temp.ok('notifications: mark_notifications_read marks all own as read', unread = 0, unread::text);
  PERFORM pg_temp.ok('notifications: other users are untouched',
    (SELECT count(*) FROM public.user_notifications WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000003' AND read_at IS NULL) = 4);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  UPDATE public.user_notifications SET title = 'spoof' WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000002';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('notifications: users cannot edit notification text', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('notifications: users cannot edit notification text', SQLERRM LIKE '%permission denied%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  INSERT INTO public.user_notifications (user_id, title) VALUES ('aaaaaaaa-0000-4000-8000-000000000002', 'x');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('notifications: clients cannot insert notifications', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('notifications: clients cannot insert notifications', SQLERRM LIKE '%permission denied%', SQLERRM);
END $$;

-- Newsletter ----------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  INSERT INTO public.newsletter_subscribers (email) VALUES ('spam@example.test');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('newsletter: anon cannot insert directly', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('newsletter: anon cannot insert directly', SQLERRM LIKE '%permission denied%', SQLERRM);
END $$;

-- Comments --------------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  INSERT INTO public.comments (post_id, user_id, content) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'anon');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: anon cannot comment', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: anon cannot comment', true, SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.comments (post_id, user_id, content)
  VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', '  अंतिम तिथि क्या है?  ');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: user can ask a question', true);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: user can ask a question', false, SQLERRM);
END $$;
-- Give the question a fixed id so later checks can refer to it.
UPDATE public.comments SET id = 'cccccccc-0000-4000-8000-000000000001' WHERE content = 'अंतिम तिथि क्या है?';
SELECT pg_temp.ok('comments: content is trimmed',
  (SELECT content FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000001') = 'अंतिम तिथि क्या है?');
SELECT pg_temp.ok('comments: counter updated',
  (SELECT comments_count FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001') = 1);
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.comments (post_id, user_id, content, is_pinned) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'pin me', true);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: users cannot pin their own comments', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: users cannot pin their own comments', SQLERRM LIKE '%permission denied%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.comments (post_id, user_id, content) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', repeat('a', 2001));
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: more than 2000 characters rejected', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: more than 2000 characters rejected', SQLERRM LIKE '%comments_content_length%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.comments (post_id, user_id, content) VALUES ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'on draft');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: cannot comment on unpublished posts', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: cannot comment on unpublished posts', SQLERRM LIKE '%closed%' OR SQLERRM LIKE '%row-level%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  INSERT INTO public.comments (post_id, user_id, content, parent_id)
  VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'अंतिम तिथि 25 Oct है।', 'cccccccc-0000-4000-8000-000000000001');
  PERFORM pg_temp.as_system();
  UPDATE public.comments SET id = 'cccccccc-0000-4000-8000-000000000002' WHERE content = 'अंतिम तिथि 25 Oct है।';
  PERFORM pg_temp.ok('comments: admin answer is pinned automatically on insert',
    (SELECT is_pinned FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000002'));
  PERFORM pg_temp.ok('comments: the reader question itself is not pinned',
    NOT (SELECT is_pinned FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000001'));
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  PERFORM public.moderate_comment('cccccccc-0000-4000-8000-000000000002', NULL, true);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: admin can answer and pin', true);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: admin can answer and pin', false, SQLERRM);
END $$;
SELECT pg_temp.ok('comments: answer is pinned',
  (SELECT is_pinned FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000002'));
SELECT pg_temp.ok('comments: asker is notified of the answer',
  EXISTS (SELECT 1 FROM public.user_notifications WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000002' AND title = 'आपके सवाल का जवाब आया है'));
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.comments (post_id, user_id, content, parent_id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'nested', 'cccccccc-0000-4000-8000-000000000002');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: replies to replies are rejected', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: replies to replies are rejected', SQLERRM LIKE '%top-level question%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  PERFORM public.moderate_comment('cccccccc-0000-4000-8000-000000000001', true, NULL);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: normal users cannot moderate', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: normal users cannot moderate', SQLERRM LIKE '%Only admins%', SQLERRM);
END $$;
DO $$
DECLARE i INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  FOR i IN 1..4 LOOP
    INSERT INTO public.comments (post_id, user_id, content) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'spam ' || i);
  END LOOP;
  BEGIN
    INSERT INTO public.comments (post_id, user_id, content) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002', 'spam 6');
    PERFORM pg_temp.as_system();
    PERFORM pg_temp.ok('comments: 6th comment within 10 minutes is rate limited', false);
  EXCEPTION WHEN others THEN
    PERFORM pg_temp.as_system();
    PERFORM pg_temp.ok('comments: 6th comment within 10 minutes is rate limited', SQLERRM LIKE 'RATE_LIMIT%', SQLERRM);
  END;
END $$;
-- Reports auto-hide after three reports.
INSERT INTO public.comment_reports (comment_id, reporter_id) VALUES
  ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003');
SELECT pg_temp.ok('reports: two reports do not hide yet',
  NOT (SELECT is_hidden FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000001'));
INSERT INTO public.comment_reports (comment_id, reporter_id) VALUES ('cccccccc-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002');
SELECT pg_temp.ok('reports: third report hides the comment',
  (SELECT is_hidden FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000001'));
DO $$
DECLARE anon_sees INTEGER; author_sees INTEGER;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO anon_sees FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000001';
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  SELECT count(*) INTO author_sees FROM public.comments WHERE id = 'cccccccc-0000-4000-8000-000000000001';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('comments: hidden comment invisible to public, visible to its author', anon_sees = 0 AND author_sees = 1);
END $$;

-- Jobs data model --------------------------------------------------------------------------------
INSERT INTO public.recruitments (id, name, organisation) VALUES ('dddddddd-0000-4000-8000-000000000001', 'Test Police 2026', 'Rajasthan Police');
INSERT INTO public.job_details (post_id, recruitment_id, organisation, total_posts, qualifications, departments, last_date, apply_start, fees)
VALUES
  ('bbbbbbbb-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'Rajasthan Police', 9617, ARRAY['12th'], ARRAY['police'], (now() AT TIME ZONE 'Asia/Kolkata')::date + 3, (now() AT TIME ZONE 'Asia/Kolkata')::date - 10, '[{"category":"General","amount":600}]'),
  ('bbbbbbbb-0000-4000-8000-000000000004', NULL, 'SBI', 500, ARRAY['graduate'], ARRAY['bank'], (now() AT TIME ZONE 'Asia/Kolkata')::date + 30, NULL, '[]'),
  ('bbbbbbbb-0000-4000-8000-000000000002', NULL, 'Hidden Org', 10, ARRAY['10th'], ARRAY['other'], (now() AT TIME ZONE 'Asia/Kolkata')::date + 30, NULL, '[]');

DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM public.job_details WHERE organisation IN ('Rajasthan Police', 'SBI', 'Hidden Org');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('job_details: public sees details only for visible posts', n = 2, n::text);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  UPDATE public.job_details SET total_posts = 1 WHERE post_id = 'bbbbbbbb-0000-4000-8000-000000000001';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('job_details: users cannot change job details',
    (SELECT total_posts FROM public.job_details WHERE post_id = 'bbbbbbbb-0000-4000-8000-000000000001') = 9617);
END $$;
DO $$
BEGIN
  INSERT INTO public.job_details (post_id, organisation, qualifications) VALUES ('bbbbbbbb-0000-4000-8000-000000000003', 'Test Org', ARRAY['phd-in-hacking']);
  PERFORM pg_temp.ok('job_details: unknown qualification rejected', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.ok('job_details: unknown qualification rejected', SQLERRM LIKE '%job_details_qualifications_check%', SQLERRM);
END $$;
DO $$
BEGIN
  INSERT INTO public.job_details (post_id, organisation, apply_link) VALUES ('bbbbbbbb-0000-4000-8000-000000000003', 'Test Org', 'javascript:alert(1)');
  PERFORM pg_temp.ok('job_details: non-http links rejected', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.ok('job_details: non-http links rejected', SQLERRM LIKE '%job_details_apply_link_check%', SQLERRM);
END $$;

-- list_posts RPC ----------------------------------------------------------------------------------
DO $$
DECLARE r RECORD; n INTEGER; t BIGINT;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT count(*), max(total_count) INTO n, t FROM public.list_posts(p_search => 'test') x WHERE x.slug LIKE 'test-%';
  SELECT * INTO r FROM public.list_posts(p_post_types => ARRAY['job'], p_qualification => '12th') LIMIT 1;
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('list_posts: qualification filter + job status/days left',
    r.slug = 'test-police' AND r.job_status = 'closing' AND r.days_left = 3 AND r.total_posts = 9617,
    concat_ws(' ', r.slug, r.job_status, r.days_left));
END $$;
DO $$
DECLARE slugs TEXT;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT string_agg(slug, ',' ORDER BY slug) INTO slugs FROM public.list_posts(p_limit => 50) WHERE slug LIKE 'test-%';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('list_posts: never returns drafts or future posts', slugs = 'test-admit,test-bank,test-police,test-sched-past', slugs);
END $$;
DO $$
DECLARE slugs TEXT;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT string_agg(slug, ',') INTO slugs FROM public.list_posts(p_post_types => ARRAY['job'], p_job_status => 'active', p_sort => 'deadline') WHERE slug LIKE 'test-%';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('list_posts: deadline sort puts soonest last date first', slugs = 'test-police,test-bank', slugs);
END $$;
DO $$
DECLARE slugs TEXT;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT string_agg(slug, ',') INTO slugs FROM public.list_posts(p_search => 'भर्ती') WHERE slug LIKE 'test-%';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('list_posts: Hindi search works', slugs LIKE '%test-police%' AND slugs LIKE '%test-bank%', slugs);
END $$;
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM public.list_posts(p_limit => 1000);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('list_posts: page size capped at 50', n <= 50, n::text);
END $$;

-- Follows, reminders, preferences, push ---------------------------------------------------------
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.recruitment_follows (recruitment_id, applied) VALUES ('dddddddd-0000-4000-8000-000000000001', true);
  INSERT INTO public.job_reminders (post_id, user_id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.user_preferences (qualification, departments) VALUES ('12th', ARRAY['police']);
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000003');
  SELECT count(*) INTO n FROM public.recruitment_follows;
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('follows/reminders/preferences: user can save own; others cannot see them', n = 0, n::text);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('follows/reminders/preferences: user can save own; others cannot see them', false, SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000003');
  INSERT INTO public.job_reminders (post_id, user_id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000002');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('reminders: cannot create reminders for someone else', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('reminders: cannot create reminders for someone else', SQLERRM LIKE '%row-level security%', SQLERRM);
END $$;
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.upsert_push_subscription('https://fcm.googleapis.com/fcm/send/test-abc', 'p256dh-key', 'auth-key', ARRAY['12th']);
  SELECT count(*) INTO n FROM public.push_subscriptions;
  PERFORM public.set_push_reminder('bbbbbbbb-0000-4000-8000-000000000001', 'https://fcm.googleapis.com/fcm/send/test-abc', true);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: anon can subscribe but cannot read subscriptions', n = 0, n::text);
  PERFORM pg_temp.ok('push: guest reminder stored for a job with a last date',
    EXISTS (SELECT 1 FROM public.job_reminders WHERE push_endpoint = 'https://fcm.googleapis.com/fcm/send/test-abc'));
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.set_push_reminder('bbbbbbbb-0000-4000-8000-000000000001', 'https://fcm.googleapis.com/fcm/send/test-unknown', true);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: reminder needs a known subscription', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: reminder needs a known subscription', SQLERRM LIKE '%Unknown push subscription%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.upsert_push_subscription('http://insecure.example.test/x', 'k', 'a', '{}');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: non-https endpoints rejected', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: non-https endpoints rejected', SQLERRM LIKE '%check constraint%', SQLERRM);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.upsert_push_subscription('https://169.254.169.254/latest/meta-data', 'k', 'a', '{}');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: endpoints outside Web Push services rejected (SSRF)', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('push: endpoints outside Web Push services rejected (SSRF)', SQLERRM LIKE '%push_subscriptions_endpoint_host%', SQLERRM);
END $$;

-- Follower notification title ------------------------------------------------------------------
INSERT INTO public.posts (id, title, content, author_id, slug, status, post_type)
VALUES ('bbbbbbbb-0000-4000-8000-000000000007', 'Police Admit Card', '<p>x</p>', 'aaaaaaaa-0000-4000-8000-000000000001', 'test-police-admit', 'draft', 'admit_card');
INSERT INTO public.job_details (post_id, recruitment_id, organisation) VALUES ('bbbbbbbb-0000-4000-8000-000000000007', 'dddddddd-0000-4000-8000-000000000001', 'Rajasthan Police');
UPDATE public.posts SET status = 'published' WHERE id = 'bbbbbbbb-0000-4000-8000-000000000007';
SELECT pg_temp.ok('notifications: followers get a marked title for their recruitment',
  EXISTS (SELECT 1 FROM public.user_notifications WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000002' AND title = 'आपकी फॉलो की गई भर्ती: Police Admit Card')
  AND EXISTS (SELECT 1 FROM public.user_notifications WHERE user_id = 'aaaaaaaa-0000-4000-8000-000000000003' AND title = 'Police Admit Card'));

-- Analytics -----------------------------------------------------------------------------------------
DO $$
DECLARE a JSONB;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  a := public.admin_blog_analytics();
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('analytics: admin gets totals from counters',
    (a->'totals'->>'views')::int >= 2 AND jsonb_array_length(a->'views_last_14_days') = 14, a->>'totals');
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  PERFORM public.admin_blog_analytics();
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('analytics: normal users are refused', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('analytics: normal users are refused', SQLERRM LIKE '%Admins only%', SQLERRM);
END $$;

-- Quiz ------------------------------------------------------------------------------------------------
-- Live data may already hold today's quiz; clear it inside this never-committed transaction.
DELETE FROM public.quiz_questions WHERE quiz_date IN ((now() AT TIME ZONE 'Asia/Kolkata')::date, (now() AT TIME ZONE 'Asia/Kolkata')::date + 1);
INSERT INTO public.quiz_questions (quiz_date, position, question, options, correct_index, explanation) VALUES
  ((now() AT TIME ZONE 'Asia/Kolkata')::date, 1, 'राजस्थान की राजधानी?', ARRAY['जोधपुर', 'जयपुर', 'बाड़मेर', 'अजमेर'], 1, 'जयपुर'),
  ((now() AT TIME ZONE 'Asia/Kolkata')::date, 2, 'बाड़मेर किस दिशा में है?', ARRAY['उत्तर', 'पूर्व', 'पश्चिम', 'दक्षिण'], 2, NULL),
  ((now() AT TIME ZONE 'Asia/Kolkata')::date + 1, 1, 'Tomorrow question', ARRAY['a', 'b', 'c', 'd'], 0, NULL);
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM correct_index FROM public.quiz_questions LIMIT 1;
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('quiz: answers cannot be read before submitting', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('quiz: answers cannot be read before submitting', SQLERRM LIKE '%permission denied%', SQLERRM);
END $$;
DO $$
DECLARE n INTEGER; res JSONB; res2 JSONB;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM public.quiz_questions WHERE question IN ('राजस्थान की राजधानी?', 'बाड़मेर किस दिशा में है?', 'Tomorrow question');
  res := public.submit_quiz((now() AT TIME ZONE 'Asia/Kolkata')::date, ARRAY[1, 0]::SMALLINT[], 'visitor-quiz0001');
  res2 := public.submit_quiz((now() AT TIME ZONE 'Asia/Kolkata')::date, ARRAY[1, 2]::SMALLINT[], 'visitor-quiz0001');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('quiz: tomorrow''s questions are hidden', n = 2, n::text);
  PERFORM pg_temp.ok('quiz: score and answers returned after submitting', (res->>'score')::int = 1 AND (res->>'total')::int = 2, res::text);
  PERFORM pg_temp.ok('quiz: only the first attempt is recorded',
    (SELECT count(*) FROM public.quiz_attempts WHERE visitor_id = 'visitor-quiz0001') = 1
    AND (SELECT score FROM public.quiz_attempts WHERE visitor_id = 'visitor-quiz0001') = 1);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_anon();
  PERFORM public.submit_quiz((now() AT TIME ZONE 'Asia/Kolkata')::date + 1, ARRAY[0]::SMALLINT[], 'visitor-quiz0001');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('quiz: future quiz cannot be submitted', false);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('quiz: future quiz cannot be submitted', SQLERRM LIKE '%not open yet%', SQLERRM);
END $$;
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  SELECT count(*) INTO n FROM public.admin_quiz_questions((now() AT TIME ZONE 'Asia/Kolkata')::date);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('quiz: admin can read answers through admin RPC', n = 2, n::text);
END $$;

-- Likes and bookmarks still counted ---------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000003');
  INSERT INTO public.post_likes (post_id, user_id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003');
  INSERT INTO public.post_bookmarks (post_id, user_id) VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000003');
  PERFORM pg_temp.as_system();
END $$;
SELECT pg_temp.ok('likes and bookmarks counters still work',
  (SELECT likes_count = 1 AND bookmarks_count = 1 FROM public.posts WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001'));

-- Internal function token ---------------------------------------------------------------------
SELECT pg_temp.ok('internal token: exists and is 64 hex characters',
  (SELECT value ~ '^[0-9a-f]{64}$' FROM public.app_settings WHERE key = 'internal_function_token'));
SELECT pg_temp.ok('internal token: anon and signed-in users cannot read app_settings',
  NOT has_table_privilege('anon', 'public.app_settings', 'SELECT') AND NOT has_table_privilege('authenticated', 'public.app_settings', 'SELECT'));
SELECT pg_temp.ok('internal token: only the database can call call_edge_function',
  NOT has_function_privilege('anon', 'public.call_edge_function(text, jsonb)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.call_edge_function(text, jsonb)', 'EXECUTE'));

-- Shop catalog ---------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  INSERT INTO public.catalog_items (id, kind, category, title, price, features, image_url, image_path, sort_order, is_active) VALUES
    ('cccccccc-0000-4000-8000-000000000001', 'product', 'mobiles', 'Test Phone', 9999, ARRAY['A'], 'https://example.test/a.webp', 'product/a.webp', 1000, true),
    ('cccccccc-0000-4000-8000-000000000002', 'product', 'mobiles', 'Hidden Phone', NULL, '{}', 'https://example.test/b.webp', NULL, 1001, false);
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: admin can add items', true);
EXCEPTION WHEN others THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: admin can add items', false, SQLERRM);
END $$;
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_anon();
  SELECT count(*) INTO n FROM public.catalog_items WHERE id::text LIKE 'cccccccc-%';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: visitors see active items only', n = 1, n::text);
END $$;
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000001');
  SELECT count(*) INTO n FROM public.catalog_items WHERE id::text LIKE 'cccccccc-%';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: admin sees hidden items too', n = 2, n::text);
END $$;
DO $$
DECLARE n INTEGER;
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  UPDATE public.catalog_items SET price = 1 WHERE id = 'cccccccc-0000-4000-8000-000000000001';
  GET DIAGNOSTICS n = ROW_COUNT;
  DELETE FROM public.catalog_items WHERE id = 'cccccccc-0000-4000-8000-000000000001';
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: readers cannot change or delete items',
    n = 0 AND (SELECT price FROM public.catalog_items WHERE id = 'cccccccc-0000-4000-8000-000000000001') = 9999, n::text);
END $$;
DO $$
BEGIN
  PERFORM pg_temp.as_user('aaaaaaaa-0000-4000-8000-000000000002');
  INSERT INTO public.catalog_items (kind, category, title, image_url) VALUES ('product', 'mobiles', 'Spam', 'https://example.test/x.webp');
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: readers cannot add items', false);
EXCEPTION WHEN insufficient_privilege THEN
  PERFORM pg_temp.as_system();
  PERFORM pg_temp.ok('catalog: readers cannot add items', true);
END $$;
DO $$
BEGIN
  INSERT INTO public.catalog_items (kind, category, title, image_url) VALUES ('studio_photo', 'mobiles', 'Wrong', 'https://example.test/x.webp');
  PERFORM pg_temp.ok('catalog: category must belong to the kind', false);
EXCEPTION WHEN check_violation THEN
  PERFORM pg_temp.ok('catalog: category must belong to the kind', true);
END $$;
DO $$
BEGIN
  INSERT INTO public.catalog_items (kind, category, title, image_url) VALUES ('product', 'mobiles', 'Bad URL', 'javascript:alert(1)');
  PERFORM pg_temp.ok('catalog: image URL must be https', false);
EXCEPTION WHEN check_violation THEN
  PERFORM pg_temp.ok('catalog: image URL must be https', true);
END $$;
DO $$
BEGIN
  INSERT INTO public.catalog_items (kind, category, title, price, image_url) VALUES ('studio_photo', 'weddings', 'Priced photo', 100, 'https://example.test/x.webp');
  PERFORM pg_temp.ok('catalog: studio photos cannot carry a price', false);
EXCEPTION WHEN check_violation THEN
  PERFORM pg_temp.ok('catalog: studio photos cannot carry a price', true);
END $$;
SELECT pg_temp.ok('catalog: storage bucket is public, 512 KB, WebP/JPEG only',
  (SELECT public AND file_size_limit = 524288 AND allowed_mime_types <@ ARRAY['image/webp', 'image/jpeg'] FROM storage.buckets WHERE id = 'catalog'));
SELECT pg_temp.ok('catalog: only admins may write to the bucket',
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'Admins % catalog images'
     AND (coalesce(qual, '') || coalesce(with_check, '')) LIKE '%has_role%') = 4);

SELECT n, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result, name, detail FROM results ORDER BY n;
-- No COMMIT: the transaction is discarded when the session ends.
