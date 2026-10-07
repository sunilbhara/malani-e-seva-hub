// Contact and booking enquiries through EmailJS, with basic spam protection (audit S11):
// a hidden honeypot field, a minimum fill time and one message per minute per browser.
// Also restrict "Allowed origins" in the EmailJS dashboard to malanibarmer.com.
import emailjs from "@emailjs/browser";
import { readJson, writeJson } from "@/lib/storage";

const THROTTLE_KEY = "malani-last-enquiry";
const THROTTLE_MS = 60_000;
const MIN_FILL_MS = 3_000;

export class EnquiryError extends Error {
  constructor(public code: "throttled" | "spam" | "not_configured" | "failed") {
    super(code);
  }
}

export interface EnquiryGuard {
  honeypot: string;
  startedAt: number;
}

export async function sendEnquiry(templateId: string | undefined, params: Record<string, string>, guard: EnquiryGuard): Promise<void> {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
  if (!serviceId || !publicKey || !templateId) throw new EnquiryError("not_configured");
  // Bots fill hidden fields and submit instantly; pretend success so they don't retry.
  if (guard.honeypot.trim() || Date.now() - guard.startedAt < MIN_FILL_MS) throw new EnquiryError("spam");
  const last = readJson<number>(THROTTLE_KEY, 0);
  if (Date.now() - last < THROTTLE_MS) throw new EnquiryError("throttled");
  try {
    await emailjs.send(serviceId, templateId, params, { publicKey, limitRate: { id: "malani-enquiry", throttle: THROTTLE_MS } });
    writeJson(THROTTLE_KEY, Date.now());
  } catch {
    throw new EnquiryError("failed");
  }
}
