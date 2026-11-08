// Tailwind 3 runs as a PostCSS plugin. This replaces @astrojs/tailwind,
// which has no Astro 5+ release, with the same two plugins it applied.
//
// Autoprefixer's default query, "defaults", resolves against whatever
// caniuse-lite is installed, so its prefixes drift as the data updates. This
// list is what "defaults" resolved to with caniuse-lite 1.0.30001587, the
// data the Astro 4 build used, which keeps the site's prefixes unchanged.
// Current data lists only the latest Android WebView and Opera Mobile, so
// those two use ">=".
const browsers = [
  "and_chr 121",
  "and_ff 122",
  "and_qq 13.1",
  "and_uc 15.5",
  "android >= 121",
  "chrome 121",
  "chrome 120",
  "chrome 119",
  "chrome 109",
  "edge 121",
  "edge 120",
  "firefox 122",
  "firefox 121",
  "firefox 115",
  "ios_saf 17.3",
  "ios_saf 17.2",
  "ios_saf 17.1",
  "ios_saf 16.6-16.7",
  "ios_saf 16.3",
  "ios_saf 16.1",
  "ios_saf 15.6-15.8",
  "kaios 3.0-3.1",
  "kaios 2.5",
  "op_mini all",
  "op_mob >= 73",
  "opera 106",
  "opera 105",
  "safari 17.3",
  "safari 17.2",
  "safari 17.1",
  "safari 16.6",
  "samsung 23",
  "samsung 22",
]

module.exports = {
  plugins: {
    tailwindcss: {},
    // Astro 7's compiler reprints scoped <style> blocks, turning
    // (max-width: 600px) into (width <= 600px), which Safari before 16.4
    // ignores. This turns them back.
    "@csstools/postcss-media-minmax": {},
    autoprefixer: { overrideBrowserslist: browsers },
  },
}
