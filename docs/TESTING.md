# Testing guide

Every layer can be run on your machine before going live. None of the frontend tests touch
real data: unit and integration tests mock Supabase, and Playwright runs against a separate
build (`--mode e2e`, see `.env.e2e`) whose fake Supabase host is answered inside the browser
by `e2e/support/backend.ts`.

## Run everything

```bash
npm run test:all
```

This runs lint → type-check (app, service worker, E2E) → Vitest → Deno function tests →
Playwright (mobile + desktop). Expect about 15 minutes; Playwright builds the app itself.

## The layers

| Layer | Command | Where | What it proves |
|---|---|---|---|
| Unit | `npm run test:unit` | `src/lib/__tests__`, `src/services/__tests__`, `src/components/__tests__` | Date/IST maths, job status rules (same as SQL), URL/redirect safety, HTML sanitising, sharing text, saved jobs, preferences, quiz streaks, form validation, slugs, analytics queue, theme, SEO JSON-LD, every service's queries/payloads/error handling (posts, comments, tracker, quiz, auth, media, AI, newsletter, profile) |
| Integration | `npm run test:integration` | `src/pages/__tests__`, `src/__tests__` | Each page rendered with router, React Query, Helmet and i18n: login/sign-up/reset flows, listings with filters/URL sync/pagination/errors, post page (facts, TOC, XSS safety, save, like, follow, reminder, Q&A, share), My Jobs, quiz, profile, admin guard, post editor (validation, payload, AI draft, scheduling, uploads), admin posts/quiz/dashboard, newsletter, contact form, app shell; plus a smoke test that renders the real `<App/>` on **every route** with an empty and with a failing backend |
| Edge functions | `npm run test:functions` | `supabase/functions/tests`, `netlify/tests` | Sanitiser, AI draft normaliser, Cloudinary signature, CORS, email templates, Telegram/push messages, reminder text, push-host allowlist (SSRF), OG head rewrite, sitemap |
| Database | run `supabase/tests/database.test.sql` in the Supabase SQL editor | Mumbai project | 82 checks of RLS, grants, triggers and RPCs (last full run 81/81 before the SSRF check was added; the push/SSRF section was re-run separately, 5/5); runs in one transaction and rolls back |
| End-to-end | `npm run test:e2e` | `e2e/*.spec.ts` | Real browser (installed Chrome) on Pixel 7 and 1280px desktop against the production build |

### End-to-end coverage (`e2e/`)

- `reader.spec.ts` — home, preference sheet (2nd visit, save, skip), personalised feed, home search,
  jobs listing (badges, chips, search, filter sheet, shareable URLs, infinite scroll, empty and
  outage states), result/admit tabs, post page (facts, safe links, one view per visit, TOC
  anchors, guest save → My Jobs → remove, calendar reminder download, WhatsApp/Telegram/copy,
  status image via native share **and** via download, sign-in prompts, UUID → slug redirect,
  drafts hidden), Today, quiz (answers, score, explanation, streak after reload), static pages, 404.
- `auth.spec.ts` — wrong password, sign-in with return path, guest saves moved into the account,
  sign-up (weak password, success, existing email), forgot password, Google redirect,
  protected-page redirects, sign-out.
- `signed-in.spec.ts` — like/follow/applied/reminder saved to the account, tracker progress,
  asking a question, notification bell, profile rename + theme, account deletion, reader blocked
  from admin.
- `admin.spec.ts` — dashboard, editor validation, creating a job post with the real TipTap editor
  (checks the exact database payloads and that it becomes public), AI draft, scheduling, posts
  list delete, draft preview, quiz editor, moderation.
- `quality.spec.ts` — one canonical + post-specific OG tags + JobPosting JSON-LD (not for closed
  jobs), noindex on private/search pages, unique titles on every public route, PWA manifest and
  icons, offline app shell via the service worker, **axe accessibility scans (WCAG 2.1 AA) in
  light and dark mode**, keyboard skip link and Escape, 40px tap targets, no sideways scroll at
  360px on every page, dark mode, bottom-nav state, contact form (EmailJS + honeypot), newsletter
  consent and double opt-in.

Every E2E test also fails automatically on any uncaught page error, console error, or request to
an unexpected third-party host.

## Useful commands

```bash
npx vitest run src/pages/__tests__/PostPage.test.tsx   # one file
npm run test:watch                                     # Vitest watch mode
npm run test:coverage                                  # coverage summary
npm run test:e2e:ui                                    # Playwright UI: watch tests run step by step
npx playwright test e2e/admin.spec.ts --project=mobile # one spec, one device
npm run test:e2e:report                                # open the last HTML report (traces, screenshots)
```

Playwright uses your installed Google Chrome. On a machine without Chrome, run
`npx playwright install chromium` once and set `PW_CHANNEL=chromium`.

## What automated tests cannot prove (check by hand once on the deploy preview)

- Real Supabase Auth emails (confirmation, password reset) arrive and their links work.
- Google sign-in completes with your real OAuth client.
- Real Gemini output quality, real Cloudinary upload, real EmailJS delivery, Telegram posts and
  web-push notifications on a phone (needs the secrets from `IMPLEMENTATION_TODO.md`).
- Netlify edge functions (OG previews, live sitemap) on the deployed domain — share a post link in
  WhatsApp and open `/sitemap.xml`.
- Visual taste: colours, spacing and photos on a real low-end Android phone.

## Adding tests

- Services: mock the client with `vi.mock("@/lib/supabase", …)` and `sb` from `src/test/supabaseMock.ts`;
  assert on `sb.find(table, method)` and `opArgs(...)`.
- Pages: mock `@/hooks/useAuth` with `src/test/authMock.tsx` (`signIn("admin")`), mock services with
  `vi.mock`, and render with `renderRoute(<Page />, { route, path })` from `src/test/render.tsx`.
- E2E: import `test`/`expect` from `e2e/support/test.ts`; seed data lives in `e2e/support/data.ts`,
  and `backend.writes("table")`, `backend.rpcCalls("name")` show what the app sent.
