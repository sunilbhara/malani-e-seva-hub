/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_GOOGLE_ANALYTICS_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID_MATAJI_STUDIO?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_WHATSAPP_CHANNEL_URL?: string;
  readonly VITE_TELEGRAM_CHANNEL_URL?: string;
  readonly VITE_NEWSLETTER_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
