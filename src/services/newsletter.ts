// Email alerts with double opt-in through the `newsletter` edge function (audit S7).
import { invokeFunction } from "@/services/functions";

export type SubscribeStatus = "pending" | "already_subscribed";

export async function subscribeNewsletter(input: { email: string; categories: string[]; turnstileToken?: string | null }) {
  return invokeFunction<{ status: SubscribeStatus }>("newsletter", {
    action: "subscribe",
    email: input.email.trim().toLowerCase(),
    categories: input.categories,
    consent: true,
    turnstileToken: input.turnstileToken ?? undefined,
  });
}
