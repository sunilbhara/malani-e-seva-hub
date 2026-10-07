# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Malani E-Seva Hub (malanibarmer.com) — a Hindi-first React + TypeScript PWA for government job, admit-card and result updates in Barmer (Rajasthan), plus pages for the owner's e-Mitra / mobile shop / photo studio. Vite + shadcn/ui frontend, Supabase backend (Mumbai project `lncyzrytctqijvhjprtu`, ap-south-1), deployed on Netlify. The audit and redesign plans are in `docs/` (`IMPLEMENTATION_TODO.md` tracks status and manual steps).

## Commands

```bash
npm run dev              # Vite dev server on port 8080
npm run build            # Production build + service worker (dist/)
npm run build:analyze    # Build and write dist/stats.json (bundle composition)
npm run preview          # Serve dist/ on 4173 (needed to test the service worker)
npm run lint             # ESLint
npm run typecheck        # tsc for the app, src/sw.ts (WebWorker tsconfig) and e2e/ (tsconfig.e2e.json)
npm test                 # Vitest (jsdom): unit + integration — src/**/*.test.ts(x)
npm run test:unit        # lib, services, components only
npm run test:integration # pages + whole-app smoke test
npm run test:functions   # Deno tests for supabase/functions and netlify (via npx deno)
npm run test:e2e         # Playwright (installed Chrome; mobile + desktop) against a --mode e2e build
npm run test:e2e:ui      # Playwright UI mode
npm run test:all         # lint + typecheck + Vitest + Deno + Playwright
npm run ci               # lint + typecheck + test + build (Netlify build command; no Playwright)
npm run verify:anon-blog # What an anonymous visitor can/cannot read on the live DB
npm run generate:sitemap # Static fallback sitemap (production uses the edge function)
npm run db:apply -- <file.sql>      # Apply one migration over pg (needs SUPABASE_DB_URL + SUPABASE_CA_CERT)
npm run db:migrate-region [-- --apply]  # One-off Singapore → Mumbai data copy
```

Run a single Vitest file: `npx vitest run src/lib/__tests__/jobs.test.ts`; one Playwright spec: `npx playwright test e2e/admin.spec.ts --project=mobile`.
Database tests: run `supabase/tests/database.test.sql` in one session (it never commits). `supabase/tests/e2e-seed.sql` / `e2e-cleanup.sql` add and remove fixtures for manual browser checks against the real DB.

Test helpers (see `docs/TESTING.md`): services mock the client via `vi.mock("@/lib/supabase", …)` + `sb` from `src/test/supabaseMock.ts`; pages mock `@/hooks/useAuth` with `src/test/authMock.tsx` and render with `renderRoute` from `src/test/render.tsx`. Playwright never reaches Supabase: `.env.e2e` points at a fake host answered by the in-memory `e2e/support/backend.ts` (seed data in `e2e/support/data.ts`); every E2E test fails on console errors or unexpected third-party requests. When a page adds a new backend call, extend the mock backend too.

## Environment

`.env` (Vite exposes only `VITE_*` to the browser); `.env.local` overrides it locally and is gitignored.
- Browser: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`, `VITE_GOOGLE_ANALYTICS_ID`, `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT`, `VITE_EMAILJS_*`, `VITE_VAPID_PUBLIC_KEY`, `VITE_TURNSTILE_SITE_KEY`, `VITE_WHATSAPP_CHANNEL_URL`, `VITE_TELEGRAM_CHANNEL_URL`, `VITE_NEWSLETTER_ENABLED`, `VITE_GOOGLE_MAPS_API_KEY`. Read optional ones through `src/lib/config.ts`.
- Never put a secret behind `VITE_` — it ships in the bundle. Node scripts use `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_CA_CERT`, `OLD_DB_URL`/`NEW_DB_URL`.
- Edge-function secrets live in Supabase (see `docs/IMPLEMENTATION_TODO.md` manual step 4); Cloudinary uploads are signed server-side.

## Architecture

**Routing** (`src/App.tsx`): every page is `lazy()`-loaded under `AppShell` (header, bottom nav, footer, per-route `ErrorBoundary`). Post URLs stay `/blog/:identifier` (slug, or UUID for admin preview). Listings: `/jobs`, `/admit-card`, `/result`, `/blog` all render `pages/Listing.tsx` with a `kind`. When adding an indexable static route, also add it to `config/public-routes.json` (used by the sitemap edge function and script).

**Data layer:** TanStack Query (`src/lib/queryClient.ts` holds query keys). Pages call `src/services/*` only, never Supabase directly. Card lists come from the `list_posts` RPC (filters, job status, days left, `total_count`); job facts live in `job_details` (1:1 with posts) and `recruitments` group posts of one recruitment for follows. Job status rules exist twice and must agree: SQL in `list_posts` and `jobStatus()` in `src/lib/jobs.ts`. Generated types (`src/integrations/supabase/types.ts`) are current — regenerate after schema changes; don't edit files under `src/integrations/supabase/` by hand.

**Database (`supabase/migrations/`):** RLS everywhere, policies use `(select auth.uid())` and `public.has_role()`. Clients never write counters or notifications directly: views/shares/quiz/push go through SECURITY DEFINER RPCs (`record_post_view`, `record_post_share`, `submit_quiz`, `upsert_push_subscription`, `set_push_reminder`, `mark_notifications_read`, `moderate_comment`); column-level grants restrict what users may update. Triggers: publish normalisation (`published_at`, scheduled), `notify_on_publish` fan-out, `broadcast_on_publish` (calls the `on-publish` edge function via pg_net), comment rate limit / auto-pin admin answers / auto-hide after 3 reports. pg_cron: `publish-due-posts` (*/5), `send-reminders` (daily 08:00 IST), `weekly-digest` (Sunday). Any schema change needs a new migration with matching RLS, a DB test, and regenerated types.

**Shop catalog:** products on `/mobile-electronics` and photos on `/mataji-studio` come from `catalog_items` (admin-managed at `/admin/catalog`, readers see `is_active` rows). Images are resized in the browser by `src/lib/catalogImage.ts` (products 800×800, studio 900×1200, WebP) and uploaded to the public Supabase Storage bucket `catalog` (admin-only writes, 512 KB, WebP/JPEG). Both pages render with `components/common/Carousel.tsx` (Swiper coverflow).

**Edge functions (`supabase/functions/`, Deno, shared code in `_shared/`):** `on-publish`, `send-reminders` and `weekly-digest` run with `verify_jwt = false` and accept only database calls carrying `x-internal-token` (`app_settings.internal_function_token`, sent by `call_edge_function`; checked in `_shared/internal.ts`). `generate-blog` (admin-only Gemini draft returning HTML + structured job JSON), `newsletter` (double opt-in, unsubscribe), `delete-account`, `cloudinary-sign`, `on-publish` (Telegram + web push), `send-reminders`, `weekly-digest`. Pure logic is split into small modules tested in `supabase/functions/tests/`.

**Netlify (`netlify/`):** `edge-functions/blog-og.ts` rewrites title/OG/canonical for `/blog/*` so WhatsApp/Telegram previews work; `edge-functions/sitemap.ts` serves a live sitemap. Static SEO tags in `index.html` and edge-inserted ones carry `data-rh="true"` so react-helmet replaces them instead of duplicating. Headers/CSP (report-only for now) are in `netlify.toml`.

**PWA:** `vite-plugin-pwa` (injectManifest) builds `src/sw.ts`: app-shell precache (admin chunks excluded), NetworkFirst for Supabase REST GETs, CacheFirst images, push + notificationclick handlers. Registered only in production (`src/main.tsx`).

**Engagement features:** guest saves in localStorage synced to bookmarks after login (`useSavedPosts`), reader preferences sheet on the 2nd page view (`src/lib/preferences.ts`), reminders (account, push, or `.ics` fallback), WhatsApp share + generated status image (`src/lib/statusCard.ts`), daily GK quiz with streaks, Q&A comments, "form help" WhatsApp CTA to the shop.

**UI:** Hindi-first copy written inline in components (i18n catalogs in `src/i18n/` remain for the service pages; default language `hi`). Design tokens are HSL CSS variables in `src/index.css` with dark mode via `[data-theme="dark"]` (`src/lib/theme.tsx`); fonts are self-hosted Inter + Noto Sans Devanagari. Toasts: Sonner only. Icons: lucide only. Business name/address/phone/hours come from `src/lib/business.ts` — never hard-code them. Post HTML is always sanitised with DOMPurify (`src/lib/html.ts`) before rendering. Links from admins/AI go through `safeHttpUrl`; redirects through `safeRedirectPath`.

**Removed legacy code:** the pre-redesign components/pages (old blog, admin, Hero, etc.) were deleted on 2026-10-06; recover from git history if ever needed.
