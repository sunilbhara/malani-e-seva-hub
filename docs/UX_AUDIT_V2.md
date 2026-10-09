# UX audit v2 — after Phases 0–5 (2026-10-09)

Reviewed on the live site (malanibarmer.com). Mobile was tested at 390 px and desktop at 1440 px, across 17 routes.
Screenshots are in `.playwright-mcp/final/` (gitignored). The numbers come from `report.json`.

**Who uses the site:**
- 10th/12th/graduate job seekers in Barmer. They use Android phones on patchy 4G, read Hindi first and live on WhatsApp.
- Parents and walk-in e-Mitra customers.
- Local buyers who compare phone prices before visiting the shop.

These users trust three things: the right last date, a real shop and a real person.

## What is working now

- **Brand:** Navy and amber read as one brand on every page. There are no "AI gradients". The real shop photos and the owner photo build trust.
- **Job post page (strongest screen):**
  - status pill, then days left, then last date;
  - fee table and struck-through past dates;
  - sticky "फॉर्म भरवाएँ" CTA;
  - reading-size control.
- **Clean audit results:**
  - no horizontal scroll on any page after today's fix (the jobs and blog pages were 407 px wide before it);
  - 0 axe violations;
  - 0 console errors.
- **Footer:** It is now dark and compact, and the social icons are easy to see.
- **Products:** The page reads as a real shop: grid, prices, MRP cut and collections.

## Findings and suggestions (most valuable first)

### P0 — trust and content (biggest impact, mostly admin work, little code)

1. **Most jobs have no last date.**
   - Only 1 of the 4 live jobs has `job_details`. The other cards show an excerpt instead of status, days left and last date.
   - The last date is the one fact the user came for.
   - Suggestion:
     - backfill `job_details` for every live job post;
     - make the "last date" check in the editor's pre-publish checklist a hard warning for job posts.
2. **"ताज़ा अपडेट" shows posts from May.**
   - A May post labelled "fresh" in October tells users the site is abandoned.
   - Suggestion:
     - hide expired jobs from home;
     - show "अंतिम तिथि निकल गई" on old ones;
     - for evergreen articles, show "अपडेट: <date>".
3. **English titles copied from source sites.**
   - Example: "India Post Gramin Dak Sevaks GDS Recruitment Schedule II July 2026 Apply Online Form for 23757 Post".
   - These are long, English and look scraped. They also hurt AdSense review, which checks for original content.
   - Suggestion: use a short Hindi title, e.g. "डाक विभाग GDS भर्ती 2026 — 23,757 पद". Keep the English code in the subtitle or the slug.
4. **Stock product photos.**
   - The products page uses stock photos (iPhone 15 Pro on a wooden table, MacBook Air M3).
   - They look premium but generic. A MacBook from a Barmer mobile shop raises doubt.
   - Suggestion:
     - photograph the real stock at the counter: same white or wooden background, phone held in hand;
     - list what the shop actually sells (Redmi, Vivo, Oppo, Samsung A-series, accessories).

### P1 — design and UX improvements (code)

5. **Home: three stacked sign-up cards** (quiz, push, email).
   - Stacked like this, they cause CTA fatigue, and email is the weakest channel for this audience.
   - Suggestion: merge them into one card, "नई भर्ती की खबर कैसे पाएँ?", with three choices in this order: WhatsApp channel (primary), notifications, email. Move the quiz to its own small banner near the job list.
6. **Home update list has no deadline signal.**
   - Suggestion:
     - add a right-aligned chip to each row, e.g. "6 नवं तक" or "3 दिन बचे" in amber or red;
     - separate "भर्ती" and "लेख" rows (tabs or two short lists) so jobs aren't pushed down.
7. **Job cards are not uniform.**
   - Cards with details and cards without them have different structures and heights, so the desktop grid looks ragged.
   - Suggestion: use one card anatomy for every card (org, then title clamped to 2 lines, then a qualification/last-date row, then actions). Show "तिथि जल्द" when the date is missing.
8. **Product card alignment.**
   - Some titles take 1 line and others take 2, so prices sit at different heights.
   - Suggestion:
     - clamp titles to 2 lines with a fixed `min-height`;
     - pin the price and button to the bottom of the card;
     - add an EMI hint ("₹X/महीना से") and an "दुकान पर उपलब्ध" badge. EMI is the main buying trigger in this market.
9. **Header subtitle is cut off on mobile** ("नौकरी अपडेट · ई-मित्र …").
   - Suggestion: shorten it to "बाड़मेर" on small screens, or hide it.
10. **Text that is too small:** the 11 px labels under the post action bar (सेव / शेयर / अगली). Raise them to 12–13 px. Devanagari needs about 1 px more than Latin text to read equally well.
11. **Shop trust signals:**
    - Add a Google rating and review count with a "Google पर देखें" link on the e-Mitra, mobile and studio pages and in the home shop strip.
    - Add "X साल से बाड़मेर में".
    - Show a few named, consented customer quotes.
12. **E-Mitra prices:** fill real fees in `src/config/emitraServices.ts`. "शुल्क पूछें" everywhere reads as hidden pricing.

### P2 — polish

13. **Studio page:** add a 3–4 item "पैकेज" strip ("पासपोर्ट फोटो ₹X", "प्री-वेडिंग से शुरू"), and a WhatsApp "तारीख बुक करें" button with a prefilled message.
14. **Mobile footer (734 px):** It is acceptable now. Shortening the disclaimer to one line with "और पढ़ें" would save about 120 px.
15. **Home first paint (7.6 s on the audit network):** Now that the shell is fast, this time comes from data. Move to the static home snapshot used for repeat visits. A further option is to prerender the home HTML at build time.
16. **Dark mode:** do a visual pass of the shop photos and the amber CTA on the dark surface. This audit did not check them.
17. **Empty and expired states:** when a filter returns nothing, offer "WhatsApp पर पूछें — हम बताएँगे" instead of a dead end.

## Suggested order

1. Content backfill: items 1–4 (admin, about 1–2 hours).
2. Code sprint A: items 5–10 (about a day).
3. Code sprint B: items 11–13 and 15.
