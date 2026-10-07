-- Browser E2E fixtures: one admin author (cannot sign in: no usable password), job posts in
-- every state, a recruitment, today's quiz. Everything is tagged e2e- / @example.test.
-- Remove with supabase/tests/e2e-cleanup.sql before copying production data in.
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'eeeeeeee-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
        'e2e-admin@example.test', '', now(), '{"full_name":"मालाणी टीम"}', '{}', now(), now());
INSERT INTO public.user_roles (user_id, role) VALUES ('eeeeeeee-0000-4000-8000-000000000001', 'admin');

INSERT INTO public.recruitments (id, name, organisation)
VALUES ('eeeeeeee-0000-4000-8000-0000000000d1', 'E2E राजस्थान पुलिस कांस्टेबल 2026', 'राजस्थान पुलिस');

INSERT INTO public.posts (id, title, content, author_id, slug, status, post_type, category, tags, is_verified, official_link)
VALUES
  ('eeeeeeee-0000-4000-8000-0000000000a1', 'राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद',
   '<h2>भर्ती का संक्षिप्त विवरण</h2><p>राजस्थान पुलिस ने कांस्टेबल के 9617 पदों पर भर्ती निकाली है।</p><h2>योग्यता</h2><ul><li>12वीं पास</li></ul><h2>आवेदन कैसे करें</h2><ol><li>आधिकारिक वेबसाइट खोलें</li><li>फॉर्म भरें</li></ol><p><a href="https://police.rajasthan.gov.in">आधिकारिक वेबसाइट</a></p>',
   'eeeeeeee-0000-4000-8000-000000000001', 'e2e-rajasthan-police-constable-2026', 'published', 'job', 'Government Job', ARRAY['police','rajasthan'], true, 'https://police.rajasthan.gov.in'),
  ('eeeeeeee-0000-4000-8000-0000000000a2', 'SBI क्लर्क भर्ती 2026 — 5000 पद',
   '<h2>भर्ती विवरण</h2><p>स्नातक युवाओं के लिए SBI में क्लर्क भर्ती।</p>',
   'eeeeeeee-0000-4000-8000-000000000001', 'e2e-sbi-clerk-2026', 'published', 'job', 'Government Job', ARRAY['bank'], true, NULL),
  ('eeeeeeee-0000-4000-8000-0000000000a3', 'पटवारी भर्ती 2025 — आवेदन बंद',
   '<p>यह भर्ती बंद हो चुकी है।</p>',
   'eeeeeeee-0000-4000-8000-000000000001', 'e2e-patwari-closed', 'published', 'job', 'Government Job', '{}', false, NULL),
  ('eeeeeeee-0000-4000-8000-0000000000a4', 'राजस्थान पुलिस कांस्टेबल एडमिट कार्ड जारी',
   '<h2>एडमिट कार्ड कैसे डाउनलोड करें</h2><ol><li>वेबसाइट खोलें</li></ol>',
   'eeeeeeee-0000-4000-8000-000000000001', 'e2e-police-admit-card', 'published', 'admit_card', 'Admit Card', '{}', true, NULL),
  ('eeeeeeee-0000-4000-8000-0000000000a5', 'REET मुख्य परीक्षा रिजल्ट घोषित',
   '<h2>रिजल्ट कैसे देखें</h2><p>रोल नंबर डालें।</p>',
   'eeeeeeee-0000-4000-8000-000000000001', 'e2e-reet-result', 'published', 'result', 'Result', '{}', true, NULL),
  ('eeeeeeee-0000-4000-8000-0000000000a6', 'E2E ड्राफ्ट — दिखना नहीं चाहिए',
   '<p>draft</p>', 'eeeeeeee-0000-4000-8000-000000000001', 'e2e-draft', 'draft', 'job', 'Government Job', '{}', false, NULL);

INSERT INTO public.job_details (post_id, recruitment_id, organisation, total_posts, qualifications, departments, state, age_min, age_max, salary, fees, apply_start, last_date, exam_date, apply_link, official_website)
VALUES
  ('eeeeeeee-0000-4000-8000-0000000000a1', 'eeeeeeee-0000-4000-8000-0000000000d1', 'राजस्थान पुलिस', 9617, ARRAY['12th'], ARRAY['police'], 'rajasthan', 18, 25, '₹ 24,000 – 26,000',
   '[{"category":"सामान्य / OBC","amount":600},{"category":"SC / ST","amount":400}]',
   (now() AT TIME ZONE 'Asia/Kolkata')::date - 5, (now() AT TIME ZONE 'Asia/Kolkata')::date + 3, (now() AT TIME ZONE 'Asia/Kolkata')::date + 60,
   'https://police.rajasthan.gov.in/apply', 'https://police.rajasthan.gov.in'),
  ('eeeeeeee-0000-4000-8000-0000000000a2', NULL, 'भारतीय स्टेट बैंक', 5000, ARRAY['graduate'], ARRAY['bank'], 'all_india', 20, 28, NULL, '[{"category":"सामान्य","amount":750}]',
   (now() AT TIME ZONE 'Asia/Kolkata')::date - 2, (now() AT TIME ZONE 'Asia/Kolkata')::date + 25, NULL, NULL, NULL),
  ('eeeeeeee-0000-4000-8000-0000000000a3', NULL, 'राजस्व मंडल', 2020, ARRAY['graduate'], ARRAY['patwari'], 'rajasthan', NULL, NULL, NULL, '[]',
   (now() AT TIME ZONE 'Asia/Kolkata')::date - 40, (now() AT TIME ZONE 'Asia/Kolkata')::date - 10, NULL, NULL, NULL),
  ('eeeeeeee-0000-4000-8000-0000000000a4', 'eeeeeeee-0000-4000-8000-0000000000d1', 'राजस्थान पुलिस', NULL, ARRAY['12th'], ARRAY['police'], 'rajasthan', NULL, NULL, NULL, '[]',
   NULL, NULL, (now() AT TIME ZONE 'Asia/Kolkata')::date + 60, NULL, NULL);

INSERT INTO public.quiz_questions (quiz_date, position, question, options, correct_index, explanation) VALUES
  ((now() AT TIME ZONE 'Asia/Kolkata')::date, 1, 'राजस्थान की राजधानी कौनसी है?', ARRAY['जोधपुर', 'जयपुर', 'बाड़मेर', 'अजमेर'], 1, 'जयपुर 1949 से राजधानी है।'),
  ((now() AT TIME ZONE 'Asia/Kolkata')::date, 2, 'बाड़मेर राजस्थान के किस भाग में है?', ARRAY['उत्तर', 'पूर्व', 'पश्चिम', 'दक्षिण'], 2, NULL);

COMMIT;
