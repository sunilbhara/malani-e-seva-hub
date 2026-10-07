// Admin-only AI drafting of Hindi job posts with Gemini (audit S1, S13, B5).
import { corsHeadersFor, json } from "../_shared/http.ts";
import { adminClient, getCaller } from "../_shared/supabase.ts";
import { buildPrompt, normaliseDraft, RESPONSE_SCHEMA } from "./draft.ts";

const HOURLY_LIMIT = 30;
const MAX_INPUT = 20_000;
const MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  const { user, isAdmin } = await getCaller(req);
  if (!user) return json({ error: "Please sign in." }, 401, cors);
  if (!isAdmin) return json({ error: "Only admins can use the AI writer." }, 403, cors);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "AI writer is not configured." }, 503, cors);

  const body = await req.json().catch(() => null);
  const rawDetails = typeof body?.rawDetails === "string" ? body.rawDetails.trim() : "";
  if (!rawDetails) return json({ error: "Paste the job details first." }, 400, cors);
  if (rawDetails.length > MAX_INPUT) return json({ error: `Details are too long (max ${MAX_INPUT} characters).` }, 400, cors);

  const admin = adminClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("ai_generation_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if (countError) {
    console.error("rate limit lookup failed", countError);
    return json({ error: "Could not generate the draft. Please try again." }, 500, cors);
  }
  if ((count ?? 0) >= HOURLY_LIMIT) {
    return json({ error: "Hourly AI limit reached. Please try again later." }, 429, cors);
  }
  await admin.from("ai_generation_log").insert({ user_id: user.id });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(rawDetails) }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      },
    );
    if (!response.ok) {
      console.error("Gemini API error", response.status, await response.text());
      return json({ error: "The AI service is busy. Please try again in a minute." }, 502, cors);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      console.error("Gemini returned no text", JSON.stringify(data).slice(0, 500));
      return json({ error: "The AI returned an empty draft. Please try again." }, 502, cors);
    }
    const draft = normaliseDraft(JSON.parse(text));
    if (!draft.title || !draft.content) {
      return json({ error: "The AI draft was incomplete. Please try again." }, 502, cors);
    }
    return json(draft, 200, cors);
  } catch (e) {
    console.error("generate-blog failed", e);
    return json({ error: "Could not generate the draft. Please try again." }, 500, cors);
  }
});
