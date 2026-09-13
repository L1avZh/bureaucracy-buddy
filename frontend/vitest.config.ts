import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Kept separate from vite.config.ts: mixing `vite` and `vitest/config`
// plugin types in one file trips TS, because the two packages resolve
// slightly different nested `vite` versions with nominally incompatible
// (structurally identical) Plugin types. Vitest's esbuild-based transform
// handles our tsconfig's "jsx": "react-jsx" automatic runtime without
// needing @vitejs/plugin-react here, so plugins are unnecessary for tests.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    exclude: ["node_modules", "e2e", "dist"],
  },
});
