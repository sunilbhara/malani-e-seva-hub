/// <reference lib="webworker" />
// Service worker (vite-plugin-pwa, injectManifest): precache the app shell, cache recent API reads
// for offline reading, and show push notifications (Blueprint Loop 1–2, audit P5).
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

self.skipWaiting();
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigations → cached index.html (but never for /sitemap.xml or edge-rendered assets).
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [/^\/sitemap\.xml/, /^\/robots\.txt/] }));

// Supabase REST reads: network first, fall back to the last copy when offline.
registerRoute(
  ({ url, request }) => request.method === "GET" && url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/"),
  new NetworkFirst({ cacheName: "api", networkTimeoutSeconds: 6, plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 3 * 24 * 3600 })] }),
);
// RPC reads (list_posts) are POST requests and are not cached by the browser cache API.

// Images (Cloudinary, Unsplash): cache first.
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({ cacheName: "images", plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * 24 * 3600 })] }),
);

// Fonts and other static same-origin assets.
registerRoute(
  ({ request, url }) => url.origin === self.location.origin && (request.destination === "font" || request.destination === "style"),
  new StaleWhileRevalidate({ cacheName: "static" }),
);

interface PushData {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

self.addEventListener("push", (event) => {
  let data: PushData = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  const title = data.title || "मालाणी बाड़मेर — नई अपडेट";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag,
      lang: "hi",
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data as { url?: string })?.url ?? "/", self.location.origin);
  // Only ever open our own site from a notification.
  const url = target.origin === self.location.origin || target.hostname.endsWith("malanibarmer.com") ? target.href : self.location.origin;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && new URL(client.url).origin === self.location.origin) {
          void (client as WindowClient).navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
