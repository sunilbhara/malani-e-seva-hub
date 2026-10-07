/** Cloudinary signature: SHA-1 of the alphabetically sorted params string plus the API secret. */
export async function cloudinarySignature(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign + apiSecret));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
