// Optional integrations. Each feature hides itself when its variable is not set.
const env = import.meta.env;

export const config = {
  whatsappChannelUrl: (env.VITE_WHATSAPP_CHANNEL_URL as string | undefined) || null,
  telegramChannelUrl: (env.VITE_TELEGRAM_CHANNEL_URL as string | undefined) || null,
  turnstileSiteKey: (env.VITE_TURNSTILE_SITE_KEY as string | undefined) || null,
  vapidPublicKey: (env.VITE_VAPID_PUBLIC_KEY as string | undefined) || null,
  adsenseClient: (env.VITE_ADSENSE_CLIENT as string | undefined) || null,
  adsenseSlot: (env.VITE_ADSENSE_SLOT as string | undefined) || null,
  googleMapsKey: (env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || null,
  // Set to "true" once RESEND_API_KEY and EMAIL_FROM are configured for the newsletter edge function.
  newsletterEnabled: env.VITE_NEWSLETTER_ENABLED === "true",
};
