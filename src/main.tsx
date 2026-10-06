import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
// Self-hosted variable fonts (Blueprint §5): Latin + Devanagari, no third-party font request.
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-devanagari";
import App from "./App";
import { I18nProvider } from "./i18n";
import { initAnalytics } from "./lib/analytics";
import "./index.css";

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </HelmetProvider>,
);

// Service worker: offline reading, faster repeat visits and push notifications.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  void import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
}
