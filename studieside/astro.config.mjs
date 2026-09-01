// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { studio } from "./src/data/studio";

export default defineConfig({
  // Bruges til kanoniske adresser og sitemap. Ret domænet i src/data/studio.ts.
  site: studio.url,
  integrations: [sitemap()],
  build: { format: "directory" },
});
