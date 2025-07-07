import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "@vite-pwa/plugin";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      workbox: {
        /* offline routes etc. */
      },
      manifest: {
        name: "מזכיר ביורוקרטיה",
        short_name: "ביורוקרטיה",
        lang: "he",
        start_url: "/",
        display: "standalone",
        icons: [
          { src: "/maskable.png", sizes: "192x192", purpose: "maskable" },
          { src: "/icon-512.png", sizes: "512x512", purpose: "any" },
        ],
      },
    }),
  ],
});
