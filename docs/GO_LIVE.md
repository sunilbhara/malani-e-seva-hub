# Go-live runbook

Do the phases in order. Secrets go only into dashboards or your local `.env` — never into git
(the repo is public) and never behind a `VITE_` name.

**Ordering rule:** the data copy (step 9) refuses a non-empty target, and the old site keeps
taking signups/comments until you switch. So: finish phases 1–3, then do steps 9 → 17 on the
same day, and don't publish posts on the old site after step 9.

## Phase 1 — Security clean-up (today)

1. **Google Maps key in git history.** An old commit contains `AIzaSyB41DRU…`. In Google Cloud
   Console → APIs & Services → Credentials: delete it (the new site doesn't need it), or restrict
   it to HTTP referrer `https://malanibarmer.com/*` and the Maps JavaScript API only.
2. **Check GitHub secret scanning.** Repo → Settings → Code security → enable Secret scanning and
   Push protection (free for public repos).
3. **Delete unused legacy files** (91 files listed in `docs/dead-files.txt`):
   ```bash
   xargs -a docs/dead-files.txt git rm -q --ignore-unmatch
   ```
   Then in `tsconfig.app.json` set `"exclude": ["src/sw.ts"]` (keep the service worker excluded), set `config/legacy-files.json`
   to `[]`, and run `npm run test:all`.

## Phase 2 — Accounts and keys (any time before go-live)

4. **Telegram:** create a bot with @BotFather (token) and a public channel; add the bot as channel
   admin; the channel id (e.g. `@malanibarmer` or `-100…`) is `TELEGRAM_CHAT_ID`.
5. **WhatsApp Channel:** create it in WhatsApp → Updates → Channels; copy the invite link.
6. **Resend (newsletter + auth emails):** add domain `malanibarmer.com`, add the DNS records it
   shows, wait for "Verified"; create an API key. Sender: `मालाणी बाड़मेर <updates@malanibarmer.com>`.
7. **Cloudflare Turnstile:** add a widget for `malanibarmer.com` → site key + secret key.
8. **Web push keys:** `npx web-push generate-vapid-keys` → public + private key.
   Also have ready: Gemini API key, Cloudinary cloud name / API key / API secret, GA4 id,
   AdSense client + a display-ad slot id, EmailJS ids.

## Phase 3 — Supabase (Mumbai project `lncyzrytctqijvhjprtu`)

9. **Copy the data** (go-live day). In `.env` set `OLD_DB_URL`, `NEW_DB_URL` (Dashboard → Connect →
   Session pooler, port 5432) and `SUPABASE_CA_CERT` (Settings → Database → SSL → download):
   ```bash
   node scripts/migrate-region.mjs
   node scripts/migrate-region.mjs --apply
   ```
   It must print `All tables copied exactly.` Then delete those three lines from `.env`.
10. **Check it:** SQL editor → `select email, role from auth.users u join user_roles r on r.user_id = u.id where role = 'admin';`
    (your account must be listed) and run `supabase/tests/database.test.sql` (all PASS, it rolls back).
11. **Auth → URL configuration:** Site URL `https://malanibarmer.com`; Redirect URLs
    `https://malanibarmer.com/**`, `https://deploy-preview-*--<your-netlify-site>.netlify.app/**`,
    `http://localhost:8080/**`.
12. **Auth → Providers → Google:** in Google Cloud → OAuth client, add authorised redirect URI
    `https://lncyzrytctqijvhjprtu.supabase.co/auth/v1/callback`; paste client id + secret in Supabase.
13. **Auth → settings:** minimum password length 8, enable leaked-password protection; Auth →
    SMTP: use Resend SMTP (`smtp.resend.com`, user `resend`, password = API key) — the built-in
    mailer is rate-limited and not for production; translate the email templates to Hindi.
14. **Edge Functions → Secrets:** `GEMINI_API_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
    `CLOUDINARY_API_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:<your email>`,
    `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY`,
    `SITE_URL=https://malanibarmer.com`, `ALLOWED_ORIGINS=https://malanibarmer.com,https://www.malanibarmer.com`.

## Phase 4 — Other dashboards

15. **Cloudinary:** delete the old unsigned upload preset (uploads are signed by the server now).
16. **EmailJS:** Account → Security → allowed origins `https://malanibarmer.com`.

## Phase 5 — Netlify and the deploy preview

17. **Netlify → Environment variables** (use `.env.example` as the list): `VITE_SUPABASE_URL`,
    `VITE_SUPABASE_PUBLISHABLE_KEY` (Mumbai), `VITE_SITE_URL`, `VITE_GOOGLE_ANALYTICS_ID`,
    `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT`, `VITE_VAPID_PUBLIC_KEY`, `VITE_TURNSTILE_SITE_KEY`,
    `VITE_WHATSAPP_CHANNEL_URL`, `VITE_TELEGRAM_CHANNEL_URL`, `VITE_NEWSLETTER_ENABLED=true`,
    `VITE_EMAILJS_*`. **Delete** `VITE_SUPABASE_SERVICE_ROLE_KEY` and `VITE_CLOUDINARY_UPLOAD_PRESET`.
    Build command comes from `netlify.toml` (`npm run ci`); Node 20+.
18. **Push and open a pull request:**
    ```bash
    git add -A
    git commit -m "Audit fixes, redesign, Mumbai migration, tests"
    git push -u origin feat/audit-fixes-and-redesign
    ```
    Open the PR on GitHub; wait for the Netlify deploy preview to go green.
19. **Test the preview by hand** (what automated tests can't do):
    - Sign up → confirmation email arrives (check spam) → link signs you in.
    - Google sign-in; "पासवर्ड भूल गए?" email → `/auth/reset` works.
    - As admin: AI draft, cover photo upload, publish a test job → it appears on `/jobs`, a
      Telegram post arrives, push arrives on your Android phone (enable alerts first).
    - Share that post link in WhatsApp → preview shows the post title and image.
    - `/sitemap.xml` lists the post; contact form email reaches you; newsletter confirm email arrives.
    - Install the app on Android ("Add to home screen"); open it offline once.
    - Delete the test post and test accounts afterwards.

## Phase 6 — Go live

20. Merge the PR into `main` → Netlify deploys production.
21. On `https://malanibarmer.com`: open home, a job post, sign in, open admin. Check the browser
    console has no errors.
22. **Google Search Console:** submit `https://malanibarmer.com/sitemap.xml`; test one job post in
    the Rich Results Test (JobPosting should be valid).

## Phase 7 — First weeks

23. Watch Supabase → Logs / Advisors and Netlify → Functions logs for errors.
24. After 7 days with no CSP reports in the console, change `Content-Security-Policy-Report-Only`
    to `Content-Security-Policy` in `netlify.toml`.
25. After 7 days on Mumbai with no issues: pause the old Singapore project (keep it paused, not
    deleted, for another month).
26. Fill real prices in `src/config/emitraServices.ts` and confirm shop hours in
    `supabase/functions/_shared/business.ts`.
27. Before every release: `npm run test:all`.
