import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Offline support: generated service worker, network-first HTML so the app
  // never serves a stale shell, cache-first for hashed build assets.
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      manifest: {
        name: "Smart Krishi-Yatra AI",
        short_name: "Krishi-Yatra",
        description: "Fuel-indexed pooled agri-transport for Maharashtra.",
        theme_color: "#1B4332",
        background_color: "#1B4332",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/favicon.ico", sizes: "64x64 32x32 24x24 16x16", type: "image/x-icon" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,woff2,svg,png,ico}"],
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/health$/, /^\/_serverFn\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "krishi-pages", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:js|css|woff2|svg|png)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "krishi-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  vite: {
    // Source maps so Sentry-style monitoring can resolve minified stacks.
    build: { sourcemap: true },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
