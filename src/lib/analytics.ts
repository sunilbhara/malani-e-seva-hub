// GA4 page views on every route change and the engagement events from Blueprint §14 (audit B4).
// react-ga4 is loaded after first paint; calls made before it arrives are queued.
type GA = typeof import("react-ga4").default;

const MEASUREMENT_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID as string | undefined;
let initialised = false;
let ga: GA | null = null;
const queue: Array<(ga: GA) => void> = [];

function withGa(fn: (ga: GA) => void): void {
  if (!initialised) return;
  if (ga) fn(ga);
  else queue.push(fn);
}

export function initAnalytics(): boolean {
  if (initialised) return true;
  if (!MEASUREMENT_ID || import.meta.env.MODE === "test") return false;
  initialised = true;
  void import("react-ga4").then(({ default: ReactGA }) => {
    ReactGA.initialize(MEASUREMENT_ID, { gtagOptions: { send_page_view: false } });
    ga = ReactGA;
    queue.splice(0).forEach((fn) => fn(ReactGA));
  });
  return true;
}

export function trackPageView(path: string, title?: string): void {
  withGa((g) => g.send({ hitType: "pageview", page: path, title }));
}

export type AnalyticsEvent =
  | "job_view"
  | "search"
  | "filter_apply"
  | "save_job"
  | "reminder_set"
  | "follow_recruitment"
  | "mark_applied"
  | "share_whatsapp"
  | "share_native"
  | "share_copy"
  | "share_status_card"
  | "form_help_click"
  | "push_subscribe"
  | "channel_click"
  | "quiz_complete"
  | "newsletter_subscribe"
  | "sign_up"
  | "login"
  | "preferences_saved"
  | "comment_posted";

export function track(event: AnalyticsEvent, params: Record<string, string | number | boolean | undefined> = {}): void {
  if (!initialised) return;
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));
  withGa((g) => g.event(event, clean));
}
