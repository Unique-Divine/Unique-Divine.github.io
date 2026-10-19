import path from "path"
import { fileURLToPath } from "url"
import mdx from "@astrojs/mdx"
import partytown from "@astrojs/partytown"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import compress from "astro-compress"
import icon from "astro-icon"
import { defineConfig, squooshImageService } from "astro/config"

import { ANALYTICS, SITE } from "./src/utils/config.ts"
import {
  readingTimeRemarkPlugin,
  responsiveTablesRehypePlugin,
} from "./src/utils/frontmatter.mjs"
import tasks from "./src/utils/tasks"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const whenExternalScripts = (items = []) =>
  ANALYTICS.vendors.googleAnalytics.id &&
  ANALYTICS.vendors.googleAnalytics.partytown
    ? Array.isArray(items)
      ? items.map((item) => item())
      : [items()]
    : []

export default defineConfig({
  site: SITE.site,
  base: SITE.base,
  trailingSlash: SITE.trailingSlash ? "always" : "never",

  output: "static",

  redirects: {
    "/discord-mcp/intent-review": "/discord-mcp",
  },

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
    mdx(),
    react(),
    icon({
      include: {
        tabler: ["*"],
        "flat-color-icons": [
          "template",
          "gallery",
          "approval",
          "document",
          "advertising",
          "currency-exchange",
          "voice-presentation",
          "business-contact",
          "database",
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ["dataLayer.push"] },
      }),
    ),

    compress({
      CSS: true,
      HTML: {
        "html-minifier-terser": {
          removeAttributeQuotes: false,
          // React's SSR text separators must survive HTML minification.
          ignoreCustomFragments: [/<astro-island\b[\s\S]*?<\/astro-island>/g],
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    tasks(),
  ],

  image: {
    service: squooshImageService(),
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin],
  },

  vite: {
    // A production build must not overwrite dependencies used by a live preview.
    plugins: [
      {
        name: "separate-vite-caches",
        config: (_config, { command }) => ({
          cacheDir: path.resolve(__dirname, `node_modules/.vite-${command}`),
        }),
      },
    ],
    optimizeDeps: { include: ["react-activity-calendar"] },
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
  },
})
