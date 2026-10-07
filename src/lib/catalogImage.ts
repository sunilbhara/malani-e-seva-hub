/**
 * Shop catalog photos are normalised in the browser before upload, so every card in the
 * carousels has the same shape and a small file:
 *  - products: 800×800 (1:1), studio photos: 900×1200 (3:4), WebP
 *  - "crop" fills the frame (centre crop); "fit" shows the whole photo on a white background
 * The `catalog` storage bucket accepts only WebP/JPEG up to 512 KB (see the migration).
 */
export type CatalogKind = "product" | "studio_photo";
export type FitMode = "crop" | "fit";

export const IMAGE_SPECS: Record<CatalogKind, { width: number; height: number; minSide: number; label: string }> = {
  product: { width: 800, height: 800, minSide: 500, label: "800×800 px (चौकोर)" },
  studio_photo: { width: 900, height: 1200, minSide: 600, label: "900×1200 px (3:4, खड़ी फोटो)" },
};

export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 512 * 1024;
const INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateCatalogFile(file: File): string | null {
  if (!INPUT_TYPES.includes(file.type)) return "केवल JPG, PNG या WebP फोटो चुनें।";
  if (file.size > MAX_INPUT_BYTES) return "फोटो 15 MB से छोटी होनी चाहिए।";
  return null;
}

export function validateDimensions(kind: CatalogKind, width: number, height: number): string | null {
  const { minSide } = IMAGE_SPECS[kind];
  if (Math.min(width, height) < minSide) {
    return `फोटो बहुत छोटी है (${width}×${height})। कम से कम ${minSide} px चौड़ी और ऊँची फोटो चुनें, ताकि धुंधली न दिखे।`;
  }
  return null;
}

export interface DrawPlan {
  /** Source rectangle to read. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Destination rectangle on the output canvas. */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/** Where to draw a srcW×srcH photo on an outW×outH canvas. */
export function drawPlan(srcW: number, srcH: number, outW: number, outH: number, mode: FitMode): DrawPlan {
  const srcRatio = srcW / srcH;
  const outRatio = outW / outH;
  if (mode === "crop") {
    if (srcRatio > outRatio) {
      const sw = Math.round(srcH * outRatio);
      return { sx: Math.round((srcW - sw) / 2), sy: 0, sw, sh: srcH, dx: 0, dy: 0, dw: outW, dh: outH };
    }
    const sh = Math.round(srcW / outRatio);
    return { sx: 0, sy: Math.round((srcH - sh) / 2), sw: srcW, sh, dx: 0, dy: 0, dw: outW, dh: outH };
  }
  const scale = Math.min(outW / srcW, outH / srcH);
  const dw = Math.round(srcW * scale);
  const dh = Math.round(srcH * scale);
  return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: Math.round((outW - dw) / 2), dy: Math.round((outH - dh) / 2), dw, dh };
}

/** Resizes a photo to the catalog spec and encodes it under MAX_OUTPUT_BYTES. */
export async function prepareCatalogImage(file: File, kind: CatalogKind, mode: FitMode): Promise<Blob> {
  const problem = validateCatalogFile(file);
  if (problem) throw new Error(problem);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("यह फोटो खुल नहीं सकी। कोई दूसरी फोटो चुनें।");
  const sizeProblem = validateDimensions(kind, bitmap.width, bitmap.height);
  if (sizeProblem) throw new Error(sizeProblem);

  const { width, height } = IMAGE_SPECS[kind];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("फोटो तैयार नहीं हो सकी।");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  const p = drawPlan(bitmap.width, bitmap.height, width, height, mode);
  ctx.drawImage(bitmap, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.dw, p.dh);
  bitmap.close?.();

  for (const quality of [0.85, 0.75, 0.65, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    // Browsers without WebP encoding fall back to PNG; use JPEG then.
    const out = blob && blob.type === "image/webp" ? blob : await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (out && out.size <= MAX_OUTPUT_BYTES) return out;
  }
  throw new Error("फोटो का साइज़ कम नहीं हो सका। कोई दूसरी फोटो चुनें।");
}

export function formatPrice(price: number | null): string | null {
  return price === null ? null : `₹${price.toLocaleString("en-IN")}`;
}
