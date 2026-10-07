# Implementation TODO — Audit fixes + New UI & Engagement

Source documents: `docs/Malani_Application_Audit_Issues_and_Fixes.docx` (IDs S*, B*, P*, G*, U*)
and `docs/Malani_New_UI_and_Engagement_Blueprint.docx` (sections §1–§16).

Branch: `feat/audit-fixes-and-redesign`. Database work targets the new Mumbai project
`lncyzrytctqijvhjprtu`; the Singapore project is not modified.

Legend: `[ ]` todo · `[x]` done and tested · `[M]` needs a manual step by you (see the end)

## Phase A — Database (migrations in `supabase/migrations/`, applied to Mumbai)
- [x] A1  Trustworthy views: `record_post_view` RPC, `view_date`, daily-unique index, drop open insert (S2)
- [x] A2  Share logging per visitor/day, replaces open counter RPC (S10)
- [x] A3  PII: no email as display name, scrub, `user_roles` private (S3, S4)
- [x] A4  Scheduled posts auto-publish (pg_cron) + RLS `published_at <= now()` (B1)
- [x] A5  Comments: length limit, rate limit, hide/moderate, reports, Q&A replies + pinned answers (S9, §11 Loop 6)
- [x] A6  Newsletter: no anon insert; double opt-in tokens; unsubscribe (S7)
- [x] A7  Notifications: DB fan-out on publish, link to post, mark-read RPC, unread count (B3)
- [x] A8  Jobs data model: `recruitments`, `job_details`, `recruitment_follows`, `job_reminders` (§15, §9.7, Loops 2–3)
- [x] A9  Admin analytics RPC using counters (B2)
- [x] A10 Listing RPC: server pagination, filters, Hindi-friendly search (pg_trgm) (P2)
- [x] A11 Push subscriptions + preferences tables (§9.5, Loop 1)
- [x] A12 Daily GK quiz tables (Loop 4)
- [x] A13 Regenerate TypeScript types (B13)

## Phase B — Edge functions (Supabase)
- [x] B-1 `generate-blog`: admin-only, CORS lock, rate limit, HTML output + structured job fields (S1, S13, B5)
- [x] B-2 `newsletter`: subscribe (Turnstile) / confirm / unsubscribe (S7)
- [x] B-3 `delete-account` (S12, DPDP)
- [x] B-4 `cloudinary-sign`: admin-only signed uploads (S5)
- [x] B-5 `on-publish`: Telegram auto-post + push fan-out (Loop 1)
- [x] B-6 `reminders`: deadline reminders cron (Loop 2)
- [x] B-7 `weekly-digest` email (Loop 1)

## Phase C — Netlify
- [x] C1 Security headers + CSP report-only (S8)
- [x] C2 Edge function: correct OG/WhatsApp previews for posts (G1)
- [x] C3 Dynamic sitemap (G3)

## Phase D — Frontend foundation
- [x] D1 Lazy-load all routes, manual chunks (P1)
- [x] D2 Remove antd, react-toastify, react-icons, emailjs-com → one toast (Sonner), lucide, @emailjs/browser (P1, B14)
- [x] D3 TanStack Query for data (P4)
- [x] D4 GA4: every route + engagement events (B4)
- [x] D5 Design tokens, self-hosted Inter + Noto Sans Devanagari, dark mode (U1, §4–§7)
- [x] D6 Single business-info constant used everywhere (B12)
- [x] D7 AdSense: real slot, script once (B11)
- [x] D8 SEO: Hindi blog meta, `lang=hi`, published_at dates, JobPosting schema (G2, G4, G5, B10)
- [x] D9 PWA: manifest, icons, service worker, offline (P5)
- [x] D10 Types: regenerated DB types, remove casts, fix tsc + lint errors (B13)
- [M] D11 Dead code: 91 unused files are excluded from build/lint/typecheck and listed in `docs/dead-files.txt`; deleting them needs your OK (manual step 12) (B14)
- [x] D12 Rename service-role env var, fix scripts (S6)
- [x] D13 Link protocol validation (S14)

## Phase E — New UI (Blueprint)
- [x] E1 Header + mobile bottom nav + notification bell (§8)
- [x] E2 Home: search-first hero, personalised feed, closing soon, today's updates, E-Mitra band, alerts, services (§9.1)
- [x] E3 Job card + status/countdown components (§10)
- [x] E4 Listings: /jobs, /admit-card, /result with filters sheet + pagination (§9.3)
- [x] E5 Post detail: Quick Facts, dates/fee tables, clickable TOC, working font scale, bottom action bar, reminder, follow, Q&A, related by category, WhatsApp share + status card (§9.2, B6–B9, U5)
- [x] E6 My Jobs: guest saves, tracker, reminders (§9.4, U6)
- [x] E7 Preference sheet (§9.5)
- [x] E8 Services page: price list, open-now, WhatsApp (§9.6)
- [x] E9 Admin (UI built; DB/RPC side tested — click-through needs your admin login, see manual step 13): structured job editor, Gemini pre-fill, moderation, accurate analytics (§9.7)
- [x] E10 Auth: forgot/reset password, min 8 chars, confirm redirect, delete account (S12)
- [x] E11 Today's updates page + daily GK quiz (Loop 4)
- [x] E12 Contact/booking forms: Turnstile + honeypot (S11)
- [x] E13 All UI copy in Hindi; accessibility fixes (U3, U7)

## Phase F — Testing
- [x] F1 Vitest + Testing Library set up; unit tests for utils/services/components
- [x] F2 Database tests (RLS + RPCs) against Mumbai
- [x] F3 Build, type-check, lint gates
- [x] F4 Browser end-to-end checks of every page and flow
- [x] F5 Clean test data out of Mumbai before the real data copy

## Deviation from the blueprint
- Post URLs stay at `/blog/:slug` (already indexed by Google). `/jobs`, `/admit-card`, `/result`
  are listing pages that link to those URLs, so no SEO is lost.

## Test results (2026-10-06)
| Suite | Command | Result |
|---|---|---|
| Lint | `npm run lint` | 0 errors (8 fast-refresh warnings on context/provider files) |
| Type-check | `npm run typecheck` | clean (app + service worker) |
| Unit + integration (Vitest) | `npm test` | 280/280 pass (18 files) |
| Edge + Netlify functions | `npm run test:functions` | 21/21 pass |
| Playwright E2E (mobile + desktop) | `npm run test:e2e` | 164 tests — see `docs/TESTING.md` |
| Database (RLS, RPCs, triggers) | `supabase/tests/database.test.sql` on Mumbai | 81/81 pass + push/SSRF section re-run 5/5, rolled back |
| Anonymous access | `npm run verify:anon-blog` | 6/6 pass |
| Browser E2E (preview build, seeded data) | manual run in browser | all reader flows pass; data removed afterwards |
| Production build | `npm run build` | main chunk 248 kB (82 kB gzip), precache 1.46 MB |

Browser E2E covered: home + preference sheet + personalised feed, listings, chip filters, search,
filter sheet with live count, post page (facts, dates, fees, TOC, font size, JSON-LD, one canonical),
guest save → My Jobs, reminder fallback (.ics), share sheet + WhatsApp status image, Today, quiz
(score, answers, streak), service/legal pages, 404s, login redirects for /profile and /admin,
dark mode, desktop grid, PWA install + offline shell, views/shares/quiz/on-publish recorded in DB.

Not clicked through in the browser (needs a real sign-in): sign-up/login, Google OAuth, comments/Q&A,
follow/applied, account reminders, admin editor/AI draft/moderation/quiz editor. Their database rules
are covered by the 81 DB tests; please click through once after the data copy (step 13).

## Manual steps for you
Do these in order. Secrets go into dashboards or `.env`, never into chat or git.

1. **Copy the data Singapore → Mumbai.** In `.env` set `OLD_DB_URL`, `NEW_DB_URL` (Session pooler
   strings, port 5432) and `SUPABASE_CA_CERT` (download the CA from Project Settings → Database → SSL).
   Run `node scripts/migrate-region.mjs` (dry run), then `node scripts/migrate-region.mjs --apply`.
   It must end with "All tables copied exactly." Mumbai is currently empty apart from `app_settings`.
2. **Point the app at Mumbai.** In `.env` and in Netlify → Environment variables set
   `VITE_SUPABASE_URL=https://lncyzrytctqijvhjprtu.supabase.co` and the new publishable key
   (already in `.env.local`, which is only for your machine). Remove `VITE_SUPABASE_SERVICE_ROLE_KEY`
   from `.env`/Netlify; scripts now use `SUPABASE_SERVICE_ROLE_KEY` (never `VITE_`).
3. **Supabase Auth (Mumbai dashboard → Authentication).** URL configuration: Site URL
   `https://malanibarmer.com`; redirect URLs `https://malanibarmer.com/**` and
   `http://localhost:8080/**`. Enable Google provider with your Google client ID/secret and add
   `https://lncyzrytctqijvhjprtu.supabase.co/auth/v1/callback` to the Google Cloud OAuth client.
   Turn on leaked-password protection and set minimum password length to 8. Set the SMTP sender
   (or keep Supabase's) and check the Hindi email templates.
4. **Edge function secrets (Mumbai → Edge Functions → Secrets).** `GEMINI_API_KEY` (optional
   `GEMINI_MODEL`), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` your email; generate keys with
   `npx web-push generate-vapid-keys`), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RESEND_API_KEY`,
   `EMAIL_FROM` (verified sender domain in Resend), `TURNSTILE_SECRET_KEY`,
   `SITE_URL=https://malanibarmer.com`, `ALLOWED_ORIGINS=https://malanibarmer.com,http://localhost:8080`.
   All 7 functions are already deployed; they skip a channel cleanly until its secret exists.
5. **Netlify environment variables.** `VITE_VAPID_PUBLIC_KEY` (same public key), `VITE_TURNSTILE_SITE_KEY`,
   `VITE_WHATSAPP_CHANNEL_URL`, `VITE_TELEGRAM_CHANNEL_URL`, `VITE_NEWSLETTER_ENABLED=true` (after
   step 4's Resend setup), `VITE_ADSENSE_SLOT` (a real display-ad slot id), plus the existing
   `VITE_GOOGLE_ANALYTICS_ID`, `VITE_ADSENSE_CLIENT`, `VITE_EMAILJS_*`, `VITE_SITE_URL`.
   The build command is now `npm run ci` (lint + typecheck + tests + build).
6. **Create the channels.** A WhatsApp Channel and a Telegram channel; add the bot as admin of the
   Telegram channel and use the channel id as `TELEGRAM_CHAT_ID`.
7. **Cloudinary.** Delete the old unsigned upload preset (uploads are now signed by the
   `cloudinary-sign` function), then remove `VITE_CLOUDINARY_UPLOAD_PRESET` from env.
8. **Cloudflare Turnstile.** Create a widget for `malanibarmer.com` (site key → Netlify, secret → step 4).
9. **EmailJS.** Restrict Allowed origins to `https://malanibarmer.com`.
10. **Business data.** Check shop hours in `src/lib/business.ts` and fill real prices in
    `src/config/emitraServices.ts` (currently shown as "दाम पूछें").
11. **Deploy.** Commit and push this branch (`feat/audit-fixes-and-redesign`), open a PR, let the
    Netlify deploy preview build, then merge.
12. **Delete dead files** listed in `docs/dead-files.txt` (91 files, unused, excluded from the build):
    `xargs -a docs/dead-files.txt git rm` then remove the `legacy` entries from `tsconfig.app.json`,
    `eslint.config.js` and `config/legacy-files.json`. Remove unused Radix packages afterwards.
13. **Click-through as admin on the deploy preview:** sign up, Google login, ask and answer a question,
    follow a recruitment, set a reminder, create a post with the AI draft, schedule a post, add a quiz.
14. **After one week:** switch the CSP in `netlify.toml` from `Content-Security-Policy-Report-Only`
    to `Content-Security-Policy` if the browser console shows no violations.
15. **After verifying production on Mumbai:** pause the old Singapore project; if the old service-role
    key was ever in the client bundle or git history, roll it in the Singapore dashboard first.
16. **Search Console:** submit `https://malanibarmer.com/sitemap.xml` and request indexing of the home page.
