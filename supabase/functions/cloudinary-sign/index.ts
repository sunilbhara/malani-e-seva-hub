// Admin-only signed Cloudinary uploads (audit S5). The API secret never leaves the server.
import { corsHeadersFor, json } from "../_shared/http.ts";
import { getCaller } from "../_shared/supabase.ts";
import { cloudinarySignature } from "./sign.ts";

const FOLDER = "malani-blog";

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  const { user, isAdmin } = await getCaller(req);
  if (!user) return json({ error: "Please sign in." }, 401, cors);
  if (!isAdmin) return json({ error: "Only admins can upload images." }, 403, cors);

  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) return json({ error: "Image uploads are not configured." }, 503, cors);

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder: FOLDER, timestamp };
  const signature = await cloudinarySignature(params, apiSecret);
  return json({ cloudName, apiKey, timestamp, folder: FOLDER, signature }, 200, cors);
});
