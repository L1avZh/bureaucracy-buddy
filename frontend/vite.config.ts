import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Dev proxy: the app calls same-origin `/api/*`. Vite proxies that to the
// FastAPI backend so the browser never needs CORS for local dev. In
// production, set VITE_API_URL to the deployed backend origin (or leave it
// unset and serve the frontend from the same origin as the API, in which
// case `/api` just works as-is).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon.svg"],
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "document" ||
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "font",
            handler: "CacheFirst",
            options: { cacheName: "app-shell" },
          },
        ],
      },
      manifest: {
        name: "Bureaucracy Buddy",
        short_name: "Buddy",
        description:
          "A personal assistant for tax filings, passport renewals, healthcare admin, immigration paperwork, and every other bureaucratic process.",
        start_url: "/",
        display: "standalone",
        background_color: "#f7f7f5",
        theme_color: "#2f6f5e",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing vendor libraries into their own
        // cacheable chunks so a deploy only invalidates the app-code chunk,
        // and the browser can fetch chunks in parallel on first load.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router"],
          "query-vendor": ["@tanstack/react-query", "react-hook-form", "@hookform/resolvers", "zod"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "cmdk",
          ],
          "i18n-vendor": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
    },
  },
});
