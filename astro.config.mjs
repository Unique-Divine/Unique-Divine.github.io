import { readFileSync } from "node:fs"
import path from "path"
import { fileURLToPath } from "url"
import { unified } from "@astrojs/markdown-remark"
import mdx from "@astrojs/mdx"
import partytown from "@astrojs/partytown"
import react from "@astrojs/react"
import compress from "astro-compress"
import icon from "astro-icon"
import { defineConfig } from "astro/config"

import { skillCoverValidation } from "./scripts/skill-covers.mjs"
import { ANALYTICS, SITE } from "./src/utils/config.ts"
import {
  readingTimeRemarkPlugin,
  responsiveTablesRehypePlugin,
} from "./src/utils/frontmatter.mjs"
import {
  canonicalSitemap,
  sitemapValidation,
} from "./src/utils/sitemap-build.mjs"
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

  // astro-compress minifies HTML below. Astro's own compressor would run first
  // and change what astro-compress receives.
  compressHTML: false,

  redirects: {
    ...Object.fromEntries(
      JSON.parse(
        readFileSync(new URL("./firebase.json", import.meta.url), "utf8"),
      )
        .hosting.redirects.filter((entry) => !entry.source.endsWith("/"))
        .map(({ source, destination }) => [source, destination]),
    ),
    "/discord-mcp/intent-review": "/discord-mcp",
  },

  integrations: [
    canonicalSitemap(),
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
    sitemapValidation(),
    skillCoverValidation(),
  ],

  markdown: {
    // Sätteri is Astro 7's default processor. The unified processor keeps the
    // remark and rehype pipeline the site's plugins and tests target.
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin],
    }),
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
