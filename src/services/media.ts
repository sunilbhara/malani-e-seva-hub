/**
 * Blog image uploads (cover photos and images inside posts) to the public `post-media`
 * Supabase Storage bucket. Admin-only by storage RLS; no extra API keys needed.
 * - Validates type and size before upload
 * - Downscales in the browser (max 1400 px wide) and encodes WebP under 300 KB
 *   (keeps PNG only when it is already small, e.g. screenshots with text)
 */
import { supabase } from "@/lib/supabase";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 300 * 1024;
const MAX_DIMENSION = 1400;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const BUCKET = "post-media";

export function validateImage(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return "केवल JPG, PNG या WebP फोटो अपलोड करें।";
  }
  if (file.size > MAX_INPUT_BYTES) return "फोटो 10 MB से छोटी होनी चाहिए।";
  return null;
}

async function shrink(file: File): Promise<Blob> {
  if (file.size <= MAX_UPLOAD_BYTES && file.type !== "image/png") return file;
  if (typeof createImageBitmap !== "function") {
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error("फोटो 300 KB से बड़ी है। छोटी फोटो चुनें।");
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("यह फोटो खुल नहीं सकी। कोई दूसरी फोटो चुनें।");
  const scale = Math.min(1, MAX_DIMENSION / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  if (file.type === "image/png" && file.size <= MAX_UPLOAD_BYTES) return file;
  for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    const out = blob && blob.type === "image/webp" ? blob : await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (out && out.size <= MAX_UPLOAD_BYTES) return out;
  }
  throw new Error("फोटो का साइज़ 300 KB से कम नहीं हो सका। कोई दूसरी फोटो चुनें।");
}

/** Uploads a blog image and returns its public URL. */
export async function uploadBlogImage(file: File): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  const blob = await shrink(file);
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message.includes("exceeded") ? "फोटो 300 KB से बड़ी है।" : "फोटो अपलोड नहीं हो सकी।");
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
