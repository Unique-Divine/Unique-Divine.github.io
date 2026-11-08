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
import { markdownPlugins } from "./src/utils/frontmatter.mjs"
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
      // Vite already minifies CSS (see vite.build.cssMinify). astro-compress
      // 2.4 would run Lightning CSS again for recent browsers only, which
      // strips prefixes and rewrites media queries.
      CSS: false,
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
    processor: unified(markdownPlugins),
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
    // Minify CSS with esbuild, as Astro 4 did. Vite 8's default, Lightning
    // CSS, rounds numbers to six significant digits: Tailwind Typography's
    // 1.3333333em becomes 1.33333em, which shifts prose layout by a fraction
    // of a pixel per paragraph. Prefixes come from autoprefixer and media
    // queries from postcss.config.cjs, not from the minifier. esbuild is an
    // optional Vite peer, so package.json pins it (0.28.2, in Vite's range);
    // a different version can change the minified CSS.
    build: {
      cssMinify: "esbuild",
    },
    optimizeDeps: { include: ["react-activity-calendar"] },
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./src"),
      },
    },
  },
})
