# malanibarmer.com — UX audit and redesign plan

**Date:** 8 October 2026 · **Site tested:** https://malanibarmer.com (live, Mumbai database) · **Admin tested:** the same build against the test backend (sample data), because the live admin needs your password.

**How it was tested**
- As a **reader** (a job seeker from Barmer on a phone) and as the **admin** (the shop owner managing posts, quiz and catalog).
- **Phone:** 390 × 844 px, touch, which is typical for a mid-range Android. **Desktop:** 1440 × 900.
- 17 reader pages and 6 admin pages, screenshots of each.
- Automatic checks on every page: sideways scrolling, text under 13 px, tap targets under 32 px, footer height, load time, and accessibility (axe: contrast, labels, headings).
- Screenshots referenced below are in [`docs/ux-audit/`](ux-audit/).

Severity: **P0** = broken or blocks the user · **P1** = hurts most users daily · **P2** = polish.

---

## 1. Summary — the 12 things that matter most

| # | Problem | Who | Sev |
|---|---|---|---|
| 1 | **Hindi/English switch does nothing.** The setting changes, but ~800 lines of text across 56 of 71 components are written directly in Hindi, so nothing on screen changes. | Reader | P0 |
| 2 | **Phone footer is 1,259 px tall** (1½ screens of links before the page ends). Desktop footer is 468 px. | Reader | P1 |
| 3 | **Social icons barely visible:** 16 px grey outline icons in a thin grey circle, no brand colour. Only Instagram and YouTube; no WhatsApp or Telegram channel. | Reader | P1 |
| 4 | **E-Mitra, Mobile & Electronics and Mataji Studio are buried.** On the phone home page they appear only after ~3½ screens of scrolling, as small icon cards with no photos. Most visitors never reach them. | Reader / business | P1 |
| 5 | **Small text everywhere:** bottom navigation 11 px, dates, footer, meta text and chips 12 px. Hard to read for older users, in sunlight, or on low-end screens. | Reader | P1 |
| 6 | **Small tap targets:** footer links ~19 px tall, carousel dots 3–8 px, “दाम पूछें” 21 px, login links 16 px. Recommended minimum is 44 px. | Reader | P1 |
| 7 | **Plain, repetitive look:** every section is the same white rounded card on a pale blue-grey background. Nothing guides the eye; there are no real photos, colour accents or section rhythm. | Reader | P1 |
| 8 | **Sideways scroll on phones** (page 395 px wide on a 390 px screen) on Home, Jobs and Blog, caused by the chip rows (`-mx-4`, e.g. `src/pages/Index.tsx:124`). | Reader | P1 |
| 9 | **Mixed English inside Hindi pages:** service-page bullet points and the “क्यों चुनते हैं” paragraphs are in English; post category values (“Government Job”) are English. | Reader | P1 |
| 10 | **Thin and repeated post content:** 6–7 posts; job posts repeat facts (e.g. “कुल पद: आधिकारिक नोटिफिकेशन के अनुसार”), one post is 125 words. This is also why AdSense rejected the site (“Low value content”). | Reader / business | P0 for income |
| 11 | **Admin on phone:** the tab bar hides “क्विज़” and “दुकान” off-screen with no hint, and the post editor stacks two bottom bars (publish + reader nav), eating ~20% of the screen. | Admin | P1 |
| 12 | **Slow first load:** 3–7 s on this connection (the home page is the slowest). The target audience is often on 4G with weak signal. | Reader | P1 |

---

## 2. Reader — issues by page

### 2.1 Global (header, navigation, footer, every page)

| ID | Issue | Device | Evidence | Fix |
|---|---|---|---|---|
| G1 | Language switch has no visible effect; it sits in the footer, where nobody looks for it. | Both | Clicking “English” sets `lang=en-IN` and stores `malani-language=en`, but the H1 and header text stay Hindi. | Either make real translations for all interface text (buttons, labels, navigation, headings), or remove the switch until then. Move it to the header menu as “हिंदी / EN”. Post content stays in the language it was written in. |
| G2 | Footer: all 4 link groups stacked on the phone, 1,259 px. | Phone | [`m-footer.png`](ux-audit/m-footer.png) | Phone: one compact block (logo, address, call/WhatsApp buttons, social row), with link groups collapsed in accordions, about 350–450 px. Desktop: keep the 4 columns, reduce padding. |
| G3 | Social icons faint, only 2 networks. | Both | [`d-footer.png`](ux-audit/d-footer.png) | 44 px buttons with brand-coloured icons (Instagram, YouTube, WhatsApp channel, Telegram), with labels on desktop. Use the existing `VITE_WHATSAPP_CHANNEL_URL` / `VITE_TELEGRAM_CHANNEL_URL`. |
| G4 | Bottom navigation labels are 11 px; “रिजल्ट/एडमिट” is long. There is no tab for the shop services. | Phone | [`m-home-0.png`](ux-audit/m-home-0.png) | 12–13 px labels with a heavier weight. Tabs: होम · नौकरियाँ · **सेवाएँ** · सेव · प्रोफ़ाइल. Admit card and result move into tabs on the Jobs screen. |
| G5 | Text under 13 px: dates, meta, chips, footer, disclaimer. | Both | automatic check, every page | Minimum 14 px for anything readable, 16–17 px body, line height 1.6 for Devanagari. |
| G6 | Tap targets under 44 px (footer links, inline links, dots, “दाम पूछें”). | Phone | automatic check | 44 px minimum height for every link and button; footer links get 44 px rows; carousel dots become a larger 24 px hit area. |
| G7 | Sideways scroll from chip rows. | Phone | page width 395 px on a 390 px screen | Use `overflow-x: clip` on the page wrapper and replace `-mx-4` with scroll padding (`scroll-px-4`). |
| G8 | The preferences sheet (“3 सवाल…”) pops up on the second page a visitor opens and covers the content they tapped on. | Phone | [`m-jobs-0.png`](ux-audit/m-jobs-0.png) (first run) | Don’t interrupt. Show an inline card on Home and Jobs (“अपनी नौकरियाँ चुनें”); open the sheet only when tapped. |
| G9 | Slow first load (3–7 s). Biggest files: editor 384 KB (admin only, fine), main bundle 263 KB, Supabase client 205 KB, React 164 KB. | Phone | load timings | Render the job list from a cached snapshot first, preload the first API call, lazy-load AdSense/analytics after first interaction, and add real photos as small WebP (≤ 60 KB). |
| G10 | The header is plain: logo, name, search only. No quick way to call or WhatsApp on the phone. | Phone | [`m-home-0.png`](ux-audit/m-home-0.png) | Add a small WhatsApp button in the header on the phone (the desktop already has “फॉर्म भरवाएँ”). |

### 2.2 Home

| ID | Issue | Device | Fix |
|---|---|---|---|
| H1 | Services appear only after newsletter, push and trust cards (~3½ phone screens), as plain icon cards with no photos. Earlier versions showed shop images. | Both | Put a **“हमारी दुकान”** strip right below the search: 3 large photo tiles (ई-मित्र · मोबाइल · माताजी स्टूडियो) that scroll sideways on the phone and sit in one row on desktop, with real shop photos. |
| H2 | “आज की अपडेट” shows one row; “नई भर्तियाँ” shows one card in a 3-column grid, so the desktop is mostly empty space. | Desktop | [`d-home-1.png`](ux-audit/d-home-1.png) | One combined “ताज़ा अपडेट” list (jobs, admit cards, results, latest first, 6–8 items) with type labels. Show “नई भर्तियाँ” only when there are 3 or more. |
| H3 | Trust card says “दुकान अभी बंद है” as a feature, which reads as negative. | Both | Show open/closed as a small status next to the shop address (“अभी खुला · रात 8 बजे तक”), not as a headline card. |
| H4 | Push and newsletter cards are both on Home, each with its own heading. | Both | Merge into one “अलर्ट पाएँ” card: WhatsApp channel (most used by this audience), Telegram, push, email. |
| H5 | No deadlines-at-a-glance. | Both | A “अंतिम तिथि नज़दीक” row: 3–5 jobs closing within 7 days, with big day counts. |

### 2.3 Jobs, Admit card, Result, Blog listings

| ID | Issue | Fix |
|---|---|---|
| L1 | Card styles differ in one list: one card has a blue left border, another doesn't; some show the organisation, some show “भर्ती”. | One card design: organisation logo or initials, title (2 lines), status chip, big “X दिन बचे”, qualification, save/share. |
| L2 | English titles copied from other sites (“India Post Gramin Dak Sevaks GDS Recruitment Schedule II July…”), truncated with “…”. | Hindi titles in your own words. The editor already shows a formula; add a warning when the title is mostly English. |
| L3 | “4 भर्तियाँ” on Jobs but 6 on Blog: readers don't know the difference between जॉब and लेख. | Rename Blog to “सभी अपडेट” everywhere (the page title already is) and show type chips. |
| L4 | Filter chips and the filter button sit far apart; the chip row scrolls off-screen with no hint. | Put the filter button first in the chip row, and add a fade at the right edge. |

### 2.4 Post page

| ID | Issue | Device | Fix |
|---|---|---|---|
| P1 | Very long: 13,856 px on the phone (16 screens). | Phone | Keep facts at the top (they are good), then collapse long sections (“पूरी जानकारी पढ़ें”), and limit AI-generated filler. |
| P2 | Two tables of contents on desktop (sidebar plus inline), and the contents list includes “Step 1 … Step 8” entries. | Desktop | [`d-post-0.png`](ux-audit/d-post-0.png): show one table of contents, with H2 headings only. |
| P3 | Two orange buttons with nearly the same text: “फॉर्म हमसे भरवाएँ” in the page and “फॉर्म भरवाएँ” sticky at the bottom. | Phone | [`m-post-0.png`](ux-audit/m-post-0.png): keep the sticky bar only, with WhatsApp plus Apply. |
| P4 | The font-size control row (T अ अ अ अ) is visually noisy and unclear. | Both | One “अ+” button that opens a small menu. |
| P5 | Emojis in every heading look unprofessional at this density. | Both | At most one per post. The editor should strip emoji from headings, or warn. |

### 2.5 Shop pages (Services, Mobile & Electronics, Mataji Studio)

| ID | Issue | Fix |
|---|---|---|
| S1 | E-Mitra page: every service shows “दाम पूछें”, with no price; 6,962 px long on the phone. | Show a starting price (“₹50 से”) and the time taken. Group services in tabs (नौकरी फॉर्म / प्रमाण पत्र / पहचान / बिल). |
| S2 | English bullet points and English paragraphs under Hindi headings. | [`m-services-0.png`](ux-audit/m-services-0.png), [`m-mobile-1.png`](ux-audit/m-mobile-1.png): translate the `seoPages` copy in `src/i18n/hindiOverrides.ts`. |
| S3 | Stock photos (Unsplash iPhone, MacBook, headphones). Buyers want the actual shop and real stock. | Replace through the new admin “दुकान” tab with real photos; add photos of the shop counter, studio and staff. |
| S4 | Carousel dots are 3–8 px. | Bigger dots or a “2 / 6” counter. |
| S5 | No reviews or trust signals (Google rating, years in business, number of forms filled). | Add a short trust row: Google rating, “10+ साल”, “5,000+ फॉर्म भरे” (real numbers only). |

### 2.6 Other pages

- **Login (L-1):** “पासवर्ड भूल गए?” and “नया खाता बनाएँ” are 21–24 px tall links at 12 px. Make them full-width secondary buttons. Google sign-in should come first once the redirect fix is done.
- **Newsletter (N-1):** opening `/newsletter` directly shows “लिंक मान्य नहीं है” as the H1. Show the subscribe form when there is no token.
- **Quiz (Q-1):** streak shows “0 दिन” before the first attempt. Hide it until there is a streak.
- **404:** fine. Add the 3 most popular pages as shortcuts.

---

## 3. Admin — issues

| ID | Issue | Device | Evidence | Fix |
|---|---|---|---|---|
| A1 | The admin tab bar overflows: “क्विज़” and “दुकान” are off-screen with no scroll hint. | Phone | [`m-admin-dash-0.png`](ux-audit/m-admin-dash-0.png) | A 2-row grid of 6 icon tiles on the dashboard, plus a compact tab bar with a right-edge fade. |
| A2 | The post editor shows the publish bar **and** the reader bottom navigation, about 20% of the screen. | Phone | [`m-admin-editor-0.png`](ux-audit/m-admin-editor-0.png) | Hide the reader bottom navigation inside `/admin`. |
| A3 | “कैटेगरी” values are English (“Government Job”) and duplicate “पोस्ट का प्रकार”. | Both | | Drop the separate category, or derive it from the type, and show Hindi labels. |
| A4 | The dashboard shows totals only; there's no to-do list. | Both | | Add “आज के काम”: unanswered questions, jobs closing in 3 days with no update, drafts, posts under 600 words (needed for AdSense), today's quiz missing. |
| A5 | The post list on the phone shows title and status only: no date, views or quick actions. | Phone | [`m-admin-posts-0.png`](ux-audit/m-admin-posts-0.png) | Each row shows date · views · word count, with edit, preview and share-to-WhatsApp. |
| A6 | Cover image upload and “AI से ड्राफ़्ट” fail because the Cloudinary and Gemini keys are not set in Supabase. | Both | known config gap | Add `CLOUDINARY_*` and `GEMINI_API_KEY`, or move cover uploads to the Supabase Storage approach the shop catalog already uses (no extra keys). |
| A7 | No content-quality guard. | Both | | The editor shows a word count, a “mostly English” warning, a missing-official-link warning, and a duplicate-title check before publishing. |
| A8 | No quick “share to WhatsApp channel / Telegram” after publishing (Telegram only works once its keys are set). | Both | | After publishing, show a share sheet with the status image (already built for readers). |

---

## 4. Redesign direction

### 4.1 Who it is for (design brief)

- **Mostly phones:** mid-range Android, often shared in the family, 4G that drops to 3G, outdoor use in bright sun.
- **Hindi-first readers:** many are comfortable reading Hindi but not English. Some are older parents looking for forms.
- **WhatsApp is the main channel:** they trust a real local shop more than a website.

What they want, in order:
1. Is there a job for me?
2. What is the last date?
3. Can someone fill the form for me?
4. Where is the shop?

So the redesign keeps **job updates as the core**, and makes the **shop visible and trustworthy on the first screen**.

Design principles from research on mobile UIs for Hindi-speaking and low-literacy users:
- **Familiar patterns.** Big icon-plus-label tiles, like PhonePe or Paytm service grids.
- **Icons plus words, never icons alone.**
- **Very short sentences.**
- **One main action per screen.**
- **Large type and high contrast.**
- **Allow for shared phones.** Don't depend on being logged in.

([Ungrammary — designing for Bharat](https://www.ungrammary.com/post/ux-ui-design-for-bharat), [Medhi et al., Microsoft Research](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/ToCHI2711_Medhi.pdf))

Award-winning news sites (NYT, BBC, Guardian — Webby winners) share the same traits:
- strong typographic hierarchy;
- one clear lead story;
- dense but scannable lists;
- restrained colour used to signal meaning, not decoration.

([Webby Awards — best mobile sites](https://www.webbyawards.com/press/press-releases/the-12th-annual-webby-awards-announce-winners-for-best-mobile-sites), [journalism.co.uk](https://www.journalism.co.uk/new-york-times-takes-best-news-website-prize-at-webby-awards/))

### 4.2 Visual system — premium, flat, no gradients

| Token | Colour | Use |
|---|---|---|
| Ink (primary) | `#14213D` deep indigo-navy | Header, headings, primary buttons |
| Marigold (accent) | `#E09F3E` | “फॉर्म भरवाएँ”, highlights, the active tab underline — a Rajasthan cue, used sparingly. Text on marigold is always Ink (never white, which fails contrast). |
| Terracotta | `#B5523B` | Closing-soon deadlines, important badges |
| Leaf | `#2E7D4F` | “आवेदन जारी”, open status, success |
| Ivory (background) | `#FAF7F2` | Page background (warm, easier on the eyes than blue-grey) |
| Surface | `#FFFFFF` with a 1 px `#E8E2D8` border | Cards |
| Text | `#1C1F26` / muted `#5A6170` | Body / meta (passes 4.5:1 on ivory) |
| Dark mode | Ink `#0F1626` background, Ivory text, same accents | |

- **No gradients, glows or glass.** Use colour blocks, thin rules and real photos.
- **Type:** Noto Sans Devanagari and Inter. Body 17 px / 1.65, H1 28–32 px phone, 600 weight headings, 14 px minimum meta.
- **Shape:** 12 px card radius, 999 px chips, 4 px colour bar for status (instead of whole-card borders).
- **Texture:** a subtle Rajasthani *jaali* line motif only in the header band and footer (very low contrast), so it feels local without looking “AI-made”.
- **Photos:** real shop photos, 4:3 tiles, WebP under 60 KB, always with Hindi captions.

### 4.3 New phone home (top to bottom)

1. **Header (ink):** logo · “मालाणी बाड़मेर” · search · WhatsApp button.
2. **Search** with the chips (10वीं · 12वीं · ग्रेजुएट · पुलिस · रेलवे …), filter button first.
3. **“हमारी दुकान” strip:** 3 photo tiles (ई-मित्र · मोबाइल · स्टूडियो) and a “फॉर्म भरवाएँ” WhatsApp button. Visible on the first screen.
4. **“अंतिम तिथि नज़दीक”:** 3–5 cards with large day counts in terracotta.
5. **“ताज़ा अपडेट”:** a mixed list of jobs, admit cards and results, with type labels, 8 items and “सभी देखें”.
6. **Personalise card:** “अपनी योग्यता चुनें — सिर्फ़ आपकी नौकरियाँ” (inline, no popup).
7. **Daily GK quiz** teaser (1 question shown directly).
8. **Alerts card:** WhatsApp channel · Telegram · notification · email.
9. **Shop info:** map snippet, open/closed status, call and directions buttons.
10. **Compact footer.**

Desktop:
- A 2-column layout: updates on the left (2/3), with a sticky right column showing the shop card, closing-soon list and alerts.
- The shop strip becomes a 3-tile row under the hero.

### 4.4 Navigation

- **Phone bottom bar:** होम · नौकरियाँ · सेवाएँ · सेव · प्रोफ़ाइल (13 px labels, 56 px tall, active state in marigold).
- **Jobs screen tabs:** भर्ती · एडमिट कार्ड · रिजल्ट · परीक्षा तिथि.
- **Language and theme:** move from the footer to the profile/menu sheet and the desktop header.

### 4.5 Language (fixes issue #1)

Recommended approach:
1. Move all interface text (about 800 lines) into `src/i18n/` catalogs (`hi` default, `en`).
2. Translate the interface chrome first: navigation, buttons, labels, empty states, footer.
3. Leave posts in the language they were written in; show “यह पोस्ट हिंदी में है” when English is selected.

Effort: about 1–2 weeks of careful work. If you'd rather not invest that now, **remove the switch**. A switch that does nothing hurts trust more than having none.

---

## 5. Roadmap

| Phase | What | Effort | Result |
|---|---|---|---|
| **0 — Quick fixes** | G2–G7, G8, P2, P3, S2, A1, A2, A3, N-1, Q-1; hide the language switch | 1–2 days | Readable, no sideways scroll, compact footer, visible social icons, no popups |
| **1 — New look** | Colour/type tokens (§4.2), new header, home layout (§4.3), job card, shop strip with real photos, bottom navigation with सेवाएँ | 4–6 days | Premium, local, shop visible on the first screen |
| **2 — Shop pages** | Prices and tabs on E-Mitra, real product and studio photos, trust row | 2–3 days | More WhatsApp enquiries |
| **3 — Admin** | A4–A8: to-do dashboard, content-quality guard, share after publish, cover uploads via Storage | 3–4 days | Faster publishing, better posts (also helps AdSense) |
| **4 — Language** | Full i18n (§4.5) | 1–2 weeks | A switch that really works |
| **5 — Speed** | G9: snapshot-first rendering, deferred third-party scripts, image budget | 2–3 days | First content in about 1.5 s on 4G |
| **Ongoing — Content** | 25–30 original Hindi posts, regular updates, then request an AdSense review | Owner | AdSense approval and traffic |

Every phase keeps the current tests green and adds tests for new behaviour (unit, Playwright mobile + desktop, axe).

---

## 6. Appendix — measured numbers (live site, 8 Oct 2026)

| Page | Phone height | Desktop height | Phone load | Notes |
|---|---|---|---|---|
| Home | 4,291 px | 2,411 px | 7.1 s | sideways scroll; services at ~3,000 px |
| Jobs | 2,729 | 1,378 | 4.4 s | sideways scroll |
| Post (RRB NTPC) | 13,856 | 10,042 | 5.0 s | two tables of contents on desktop |
| Services | 6,962 | 4,006 | 4.7 s | no prices |
| Mobile & Electronics | 6,160 | 3,841 | 4.5 s | stock photos |
| Mataji Studio | 6,195 | 3,767 | 3.9 s | — |
| Footer (all pages) | 1,259 | 468 | — | — |

Accessibility (axe: contrast, link/button names, image alt, labels, heading order): **no violations** on the pages tested. The problems are size and layout, not contrast.
