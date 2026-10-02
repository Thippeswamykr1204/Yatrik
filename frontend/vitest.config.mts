import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    // Prevent Node 25+ native Web Storage from shadowing jsdom's browser storage.
    execArgv: ["--no-experimental-webstorage"],
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
