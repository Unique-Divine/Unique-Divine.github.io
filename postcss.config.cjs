// Tailwind 3 runs as a PostCSS plugin. This replaces @astrojs/tailwind,
// which has no Astro 5+ release, with the same two plugins it applied.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
