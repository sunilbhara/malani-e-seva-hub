/**
 * Blog image uploads to Cloudinary using short-lived server signatures (audit S5).
 * - Validates type and size before upload
 * - Downscales large photos in the browser (keeps PNG transparency)
 * - Returns a delivery URL with automatic format and quality
 */
import { invokeFunction } from "@/services/functions";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const DELIVERY_TRANSFORM = "f_auto,q_auto:good,w_1400,c_limit";

interface Signature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function validateImage(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return "केवल JPG, PNG या WebP फोटो अपलोड करें।";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) return "फोटो 5 MB से छोटी होनी चाहिए।";
  return null;
}

async function downscale(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const type = file.type === "image/png" ? "image/png" : "image/webp";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export function deliveryUrl(secureUrl: string): string {
  return secureUrl.includes("/upload/") ? secureUrl.replace("/upload/", `/upload/${DELIVERY_TRANSFORM}/`) : secureUrl;
}

export async function uploadBlogImage(file: File): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  const sig = await invokeFunction<Signature>("cloudinary-sign", {});
  const body = new FormData();
  body.append("file", await downscale(file));
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  body.append("signature", sig.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
  const data = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message ?? "फोटो अपलोड नहीं हो सकी।");
  return deliveryUrl(data.secure_url);
}
