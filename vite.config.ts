/// <reference types="vitest" />
import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { componentTagger } from "lovable-tagger";

/**
 * AdSense site verification: Google's reviewers look for the account meta tag and the official
 * loader in every page's <head>. Injected only when VITE_ADSENSE_CLIENT is a real publisher id,
 * so dev and E2E builds never contact Google.
 */
function adsenseHead(client: string | undefined): PluginOption {
  return {
    name: "adsense-head",
    transformIndexHtml() {
      if (!client || !/^ca-pub-\d{16}$/.test(client)) return [];
      return [
        { tag: "meta", attrs: { name: "google-adsense-account", content: client }, injectTo: "head" },
        {
          tag: "script",
          attrs: { async: true, src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`, crossorigin: "anonymous" },
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const plugins: PluginOption[] = [
    react(),
    adsenseHead(env.VITE_ADSENSE_CLIENT),
    mode === "development" && componentTagger(),
    // PWA: installable app, offline reading and web push (audit P5, Blueprint Loop 1).
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon.ico", "icons/apple-touch-icon.png", "logo.jpeg"],
      manifest: {
        name: "मालाणी बाड़मेर — सरकारी नौकरी अपडेट",
        short_name: "मालाणी",
        description: "सरकारी नौकरी, एडमिट कार्ड, रिजल्ट और ई-मित्र सेवाएँ — बाड़मेर",
        lang: "hi",
        dir: "ltr",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#F8FAFC",
        theme_color: "#1E3A8A",
        categories: ["education", "news", "productivity"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "नौकरियाँ", url: "/jobs?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "मेरी नौकरियाँ", url: "/my?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "आज की अपडेट", url: "/today?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      injectManifest: {
        // App shell only; fonts and images are cached at runtime on first use (keeps install small on 3G).
        globPatterns: ["**/*.{js,css,html,ico,webmanifest}", "icons/*.png"],
        // Admin-only chunks (editor, transliteration) are not worth downloading for readers.
        globIgnores: ["**/stats.json", "**/stats.html", "assets/editor-*.js", "assets/slug-*.js", "assets/Admin*.js", "assets/PostEditor-*.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ];

  if (mode === "analyze") {
    const { visualizer } = await import("rollup-plugin-visualizer");
    plugins.push(visualizer({ filename: "dist/stats.json", template: "raw-data", gzipSize: true }) as PluginOption);
  }

  return {
    server: { host: "::", port: 8080 },
    plugins: plugins.filter(Boolean),
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
    build: {
      target: "es2020",
      sourcemap: false,
      rollupOptions: {
        output: {
          // Stable vendor chunks cache well across deploys (audit P1).
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            supabase: ["@supabase/supabase-js"],
            query: ["@tanstack/react-query"],
            editor: ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-link", "@tiptap/extension-image", "@tiptap/extension-placeholder", "@tiptap/extension-text-align"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      css: false,
      coverage: { provider: "v8", include: ["src/lib/**", "src/services/**", "src/components/**"], reporter: ["text-summary"] },
    },
  };
});
