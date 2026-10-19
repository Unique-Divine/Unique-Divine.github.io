import fs from "node:fs"

const tasksIntegration = () => {
  let config
  return {
    name: "AstroWind:tasks",
    hooks: {
      "astro:config:done": ({ config: resolved }) => {
        config = resolved
      },
      "astro:build:done": () => {
        if (
          !config.integrations.some(
            (integration) => integration.name === "@astrojs/sitemap",
          )
        )
          return
        const sitemapName = "sitemap-index.xml"
        if (!fs.existsSync(new URL(sitemapName, config.outDir)))
          throw new Error("XML sitemap index was not generated")
        const source = new URL("robots.txt", config.publicDir)
        const robots = fs.existsSync(source)
          ? fs.readFileSync(source, "utf8")
          : "User-agent: *\nAllow: /\n"
        const declaration = `Sitemap: ${new URL(sitemapName, new URL(config.base, config.site)).href}`
        const pattern = /^Sitemap:.*$/m
        fs.writeFileSync(
          new URL("robots.txt", config.outDir),
          pattern.test(robots)
            ? robots.replace(pattern, declaration)
            : `${robots.trimEnd()}\n\n${declaration}\n`,
        )
      },
    },
  }
}

export default tasksIntegration
