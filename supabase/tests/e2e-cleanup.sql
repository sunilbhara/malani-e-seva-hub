-- Removes everything e2e-seed.sql (and browser E2E runs) created. Safe to run repeatedly.
BEGIN;
DELETE FROM public.quiz_attempts WHERE quiz_date IN (SELECT quiz_date FROM public.quiz_questions WHERE question IN ('राजस्थान की राजधानी कौनसी है?', 'बाड़मेर राजस्थान के किस भाग में है?'));
DELETE FROM public.quiz_questions WHERE question IN ('राजस्थान की राजधानी कौनसी है?', 'बाड़मेर राजस्थान के किस भाग में है?');
DELETE FROM public.posts WHERE slug LIKE 'e2e-%';            -- cascades to job_details, views, shares, comments
DELETE FROM public.recruitments WHERE id = 'eeeeeeee-0000-4000-8000-0000000000d1';
DELETE FROM public.post_views WHERE post_id NOT IN (SELECT id FROM public.posts);
DELETE FROM public.push_subscriptions WHERE endpoint LIKE 'https://fcm.googleapis.com/fcm/send/test-%';
DELETE FROM auth.users WHERE email LIKE '%@example.test'; -- cascades to profiles, roles, notifications
COMMIT;
