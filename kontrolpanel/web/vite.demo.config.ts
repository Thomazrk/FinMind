import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

/**
 * Builds a clickable demo of the panel with the seed data baked in and the
 * Firestore/auth layer swapped for in-memory mocks. Everything is inlined into
 * one HTML file so it can be opened straight from disk.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^(\.\.?\/)+data\/firestore$/, replacement: resolve(__dirname, "demo/mockFirestore.ts") },
      { find: /^(\.\.?\/)+auth$/, replacement: resolve(__dirname, "demo/mockAuth.tsx") },
    ],
  },
  build: {
    outDir: "demo-dist",
    rollupOptions: { input: resolve(__dirname, "demo.html") },
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
