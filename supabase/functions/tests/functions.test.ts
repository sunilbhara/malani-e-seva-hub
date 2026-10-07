// Unit tests for edge function logic. Run: npx deno test --allow-env supabase/functions/tests
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { isoDate, normaliseDraft, safeUrl, sanitizeHtml } from "../generate-blog/draft.ts";
import { cloudinarySignature } from "../cloudinary-sign/sign.ts";
import { isOpenAt, openingHoursSpecification } from "../_shared/business.ts";
import { corsHeadersFor, escapeHtml } from "../_shared/http.ts";
import { confirmEmail, digestEmail, isValidEmail } from "../newsletter/templates.ts";
import { postTopics, pushPayload, telegramMessage, type PublishedPost } from "../on-publish/message.ts";
import { reminderText } from "../send-reminders/text.ts";
import { isAllowedPushEndpoint } from "../_shared/pushHosts.ts";
import { safeEqual } from "../_shared/internal.ts";
import { weekStartIst } from "../weekly-digest/week.ts";

Deno.test("sanitizeHtml keeps allowed tags and strips scripts, styles and attributes", () => {
  const html = `<h2 class="x" onclick="alert(1)">शीर्षक</h2><script>alert(1)</script><p style="color:red">पाठ <img src=x onerror=alert(1)></p><a href="javascript:alert(1)">bad</a><a href="https://rpsc.rajasthan.gov.in">ok</a><!-- c -->`;
  const out = sanitizeHtml(html);
  assertEquals(
    out,
    `<h2>शीर्षक</h2><p>पाठ </p><a>bad</a><a href="https://rpsc.rajasthan.gov.in" target="_blank" rel="noopener noreferrer">ok</a>`,
  );
});

Deno.test("safeUrl only accepts http(s)", () => {
  assertEquals(safeUrl("https://ssc.gov.in/apply"), "https://ssc.gov.in/apply");
  assertEquals(safeUrl("javascript:alert(1)"), null);
  assertEquals(safeUrl("ftp://x"), null);
  assertEquals(safeUrl("https://a b"), null);
  assertEquals(safeUrl(42), null);
});

Deno.test("isoDate validates real calendar dates", () => {
  assertEquals(isoDate("2026-10-25"), "2026-10-25");
  assertEquals(isoDate("2026-02-30"), null);
  assertEquals(isoDate("25/10/2026"), null);
});

Deno.test("normaliseDraft cleans AI output", () => {
  const draft = normaliseDraft({
    title: "  Rajasthan Police भर्ती 2026  ",
    metaDescription: "x".repeat(300),
    content: "<h2>पद</h2><script>x</script>",
    postType: "hack",
    tags: ["police", "police", "", 5],
    job: {
      organisation: "Rajasthan Police",
      totalPosts: "9617",
      qualifications: ["12th", "phd", "12th"],
      departments: ["police", "aliens"],
      state: "mars",
      ageMin: 26,
      ageMax: 18,
      applyStart: "2026-11-01",
      lastDate: "2026-10-25",
      fees: [{ category: "General", amount: 600 }, { category: "", amount: 1 }, { category: "SC", amount: -5 }],
      applyLink: "javascript:alert(1)",
      notificationPdf: "https://police.rajasthan.gov.in/n.pdf",
    },
  });
  assertEquals(draft.title, "Rajasthan Police भर्ती 2026");
  assertEquals(draft.metaDescription.length, 170);
  assertEquals(draft.content, "<h2>पद</h2>");
  assertEquals(draft.postType, "article");
  assertEquals(draft.tags, ["police"]);
  assert(draft.job);
  assertEquals(draft.job.totalPosts, 9617);
  assertEquals(draft.job.qualifications, ["12th"]);
  assertEquals(draft.job.departments, ["police"]);
  assertEquals(draft.job.state, "rajasthan");
  assertEquals(draft.job.ageMax, null, "age max below age min is dropped");
  assertEquals(draft.job.applyStart, null, "start after last date is dropped");
  assertEquals(draft.job.fees, [{ category: "General", amount: 600 }]);
  assertEquals(draft.job.applyLink, null);
  assertEquals(draft.job.notificationPdf, "https://police.rajasthan.gov.in/n.pdf");
});

Deno.test("normaliseDraft drops an empty job block", () => {
  assertEquals(normaliseDraft({ title: "t", content: "<p>c</p>", postType: "result", job: {} }).job, null);
});

Deno.test("cloudinarySignature matches Cloudinary's documented example", async () => {
  const sig = await cloudinarySignature(
    { timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" },
    "abcd",
  );
  assertEquals(sig, "bfd09f95f331f558cbd1320e67aa8d488770583e");
});

Deno.test("isOpenAt uses IST shop hours", () => {
  // Monday 2026-10-05 10:00 IST = 04:30 UTC → open
  assert(isOpenAt(new Date("2026-10-05T04:30:00Z")));
  // Monday 20:30 IST = 15:00 UTC → closed
  assert(!isOpenAt(new Date("2026-10-05T15:00:00Z")));
  // Sunday 2026-10-04 17:00 IST = 11:30 UTC → open; 18:30 IST = 13:00 UTC → closed
  assert(isOpenAt(new Date("2026-10-04T11:30:00Z")));
  assert(!isOpenAt(new Date("2026-10-04T13:00:00Z")));
  // Saturday 23:00 UTC = Sunday 04:30 IST → closed (day rollover)
  assert(!isOpenAt(new Date("2026-10-03T23:00:00Z")));
  assertEquals(openingHoursSpecification().length, 2);
});

Deno.test("CORS only echoes allowed origins", () => {
  const allowed = corsHeadersFor(new Request("https://x", { headers: { Origin: "https://malanibarmer.com" } }), ["https://malanibarmer.com"]);
  assertEquals(allowed["Access-Control-Allow-Origin"], "https://malanibarmer.com");
  const evil = corsHeadersFor(new Request("https://x", { headers: { Origin: "https://evil.example" } }), ["https://malanibarmer.com"]);
  assertEquals(evil["Access-Control-Allow-Origin"], "https://malanibarmer.com");
});

Deno.test("escapeHtml escapes markup", () => {
  assertEquals(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

Deno.test("email validation", () => {
  assert(isValidEmail("ramesh.kumar@gmail.com"));
  assert(!isValidEmail("ramesh@"));
  assert(!isValidEmail("a b@c.com"));
  assert(!isValidEmail("<script>@x.com"));
});

Deno.test("emails escape user-controlled text and include unsubscribe link", () => {
  const confirm = confirmEmail("https://f/confirm?token=1", "https://f/unsub?token=2");
  assertStringIncludes(confirm.html, "https://f/confirm?token=1");
  assertStringIncludes(confirm.html, "https://f/unsub?token=2");
  const digest = digestEmail([{ title: "<b>Bad</b>", url: "https://s/blog/x", lastDate: "2026-10-25", totalPosts: 9617 }], [], "https://u", "https://s");
  assertStringIncludes(digest.html, "&lt;b&gt;Bad&lt;/b&gt;");
  assertStringIncludes(digest.html, "9,617 पद");
  assertStringIncludes(digest.html, "25 अक्टू 2026");
});

const POST: PublishedPost = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "RSMSSB पटवारी भर्ती 2026 <test>",
  slug: "rsmssb-patwari-2026",
  post_type: "job",
  seo_description: "2020 पदों पर भर्ती",
  excerpt: null,
  job: { organisation: "RSMSSB", total_posts: 2020, last_date: "2026-10-25", qualifications: ["graduate"], departments: ["patwari"] },
};

Deno.test("telegram message is escaped and contains key facts and tracked link", () => {
  const msg = telegramMessage(POST, "https://malanibarmer.com");
  assertStringIncludes(msg, "&lt;test&gt;");
  assertStringIncludes(msg, "कुल पद: 2,020");
  assertStringIncludes(msg, "अंतिम तिथि: 25 अक्टूबर 2026");
  assertStringIncludes(msg, "https://malanibarmer.com/blog/rsmssb-patwari-2026?utm_source=telegram");
});

Deno.test("push payload and topics", () => {
  const p = pushPayload(POST, "https://malanibarmer.com");
  assertEquals(p.body, "2,020 पद · अंतिम तिथि 25 अक्टूबर 2026");
  assertEquals(p.tag, `post-${POST.id}`);
  assertEquals(postTopics(POST), ["all", "graduate", "patwari"]);
});

Deno.test("reminder text", () => {
  assertEquals(reminderText({ stage: "1d", title: "X" }).title, "⏰ कल अंतिम दिन!");
  assertStringIncludes(reminderText({ stage: "3d", title: "X" }).body, "3 दिन बाद");
});

Deno.test("push endpoints are limited to real Web Push services (SSRF guard)", () => {
  for (const ok of [
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/QK1",
    "https://wns2-bl2p.notify.windows.com/w/?token=x",
  ]) assert(isAllowedPushEndpoint(ok), ok);
  for (const bad of [
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://evil.com/fcm.googleapis.com",
    "https://fcm.googleapis.com.evil.com/x",
    "https://notify.windows.com/x",
    "https://fcm.googleapis.com:8443/x",
    "https://user:pw@fcm.googleapis.com/x",
    "https://169.254.169.254/latest",
    "not a url",
  ]) assert(!isAllowedPushEndpoint(bad), bad);
});

Deno.test("internal token comparison is exact and rejects empty values", () => {
  assert(safeEqual("abc123", "abc123"));
  assert(!safeEqual("abc123", "abc124"));
  assert(!safeEqual("abc123", "abc12"));
  assert(!safeEqual("", ""));
});

Deno.test("weekly digest uses one Monday-based IST week, whatever day it runs", () => {
  // 2026-10-04 is a Sunday; 02:30 UTC = 08:00 IST (cron time).
  assertEquals(weekStartIst(new Date("2026-10-04T02:30:00Z")), "2026-09-28");
  assertEquals(weekStartIst(new Date("2026-10-05T02:30:00Z")), "2026-10-05"); // Monday
  assertEquals(weekStartIst(new Date("2026-10-07T12:00:00Z")), "2026-10-05"); // Wednesday, same week
  assertEquals(weekStartIst(new Date("2026-10-11T18:00:00Z")), "2026-10-05"); // Sunday 23:30 IST
  assertEquals(weekStartIst(new Date("2026-10-11T18:31:00Z")), "2026-10-12"); // Monday 00:01 IST
});
