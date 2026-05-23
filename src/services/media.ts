/**
 * Cloudinary upload service for blog images.
 * - Validates type and size before upload
 * - Compresses preserving PNG transparency when possible
 * - Applies smart Cloudinary delivery transformations
 */

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

const CLOUDINARY_FOLDER = "malani-blog";
const DELIVERY_TRANSFORM = "f_auto,q_auto:good,w_1400,c_limit";

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
}

function getCloudinaryEnv() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary env vars missing: VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET",
    );
  }
  return { cloudName, uploadPreset };
}

function validateImageFile(file: File): AllowedMime {
  if (!file) throw new Error("No file provided.");
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMime)) {
    throw new Error("Unsupported image format. Use JPEG, PNG, or WebP.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Image is larger than 5 MB. Please choose a smaller file.");
  }
  return file.type as AllowedMime;
}

/**
 * Compress an image client-side while preserving its original format when
 * possible. PNGs (which may contain transparency) stay PNG. JPEG/WebP are
 * recompressed at the requested quality.
 */
function compressImage(
  file: File,
  mimeType: AllowedMime,
  maxWidth = 1600,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // PNGs do not accept a quality argument — preserve format & transparency.
        const useQuality = mimeType !== "image/png";
        canvas.toBlob(
          (blob) => resolve(blob ?? file),
          mimeType,
          useQuality ? quality : undefined,
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    image.src = url;
  });
}

/**
 * Inject Cloudinary delivery transforms into a secure URL.
 * Idempotent: existing transform segments are replaced.
 */
function withDeliveryTransform(secureUrl: string): string {
  return secureUrl.replace(/\/upload\/(?:[^/]+\/)?/, `/upload/${DELIVERY_TRANSFORM}/`);
}

export async function uploadBlogImageToCloudinary(file: File): Promise<string> {
  const mimeType = validateImageFile(file);
  const { cloudName, uploadPreset } = getCloudinaryEnv();

  const compressed = await compressImage(file, mimeType);

  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", CLOUDINARY_FOLDER);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("Network error while uploading image. Please try again.");
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = errBody?.error?.message ? `: ${errBody.error.message}` : "";
    } catch {
      /* ignore */
    }
    throw new Error(`Image upload failed (${response.status})${detail}`);
  }

  const data = (await response.json()) as CloudinaryUploadResponse;
  if (!data?.secure_url) throw new Error("Cloudinary returned no URL.");
  return withDeliveryTransform(data.secure_url);
}
