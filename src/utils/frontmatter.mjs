import { rehypeHeadingIds } from "@astrojs/markdown-remark"
import { toString } from "mdast-util-to-string"
import getReadingTime from "reading-time"

export function readingTimeRemarkPlugin() {
  return function (tree, file) {
    const textOnPage = toString(tree)
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes)

    file.data.astro.frontmatter.readingTime = readingTime
  }
}

export function responsiveTablesRehypePlugin() {
  return function (tree) {
    if (!tree.children) return

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i]

      if (child.type === "element" && child.tagName === "table") {
        const wrapper = {
          type: "element",
          tagName: "div",
          properties: {
            style: "overflow:auto",
          },
          children: [child],
        }

        tree.children[i] = wrapper

        i++
      }
    }
  }
}

/**
 * Keeps the heading IDs Astro 4 generated. Astro 4 dropped one trailing "-"
 * from each slug, so "GET /" became "get"; Astro 5 and later keep "get-".
 * Published anchors and in-page links use the Astro 4 form. Astro's own
 * heading pass runs after user plugins, keeps IDs that are already set, and
 * rebuilds the headings list from them.
 */
export function legacyHeadingIdsRehypePlugin() {
  const assignIds = rehypeHeadingIds()
  return function (tree, file) {
    const generated = []
    const collect = (node) => {
      if (
        node.type === "element" &&
        /^h[1-6]$/.test(node.tagName) &&
        typeof node.properties?.id !== "string"
      )
        generated.push(node)
      node.children?.forEach(collect)
    }
    collect(tree)
    assignIds(tree, file)
    for (const node of generated) {
      const { id } = node.properties
      if (id.endsWith("-")) node.properties.id = id.slice(0, -1)
    }
  }
}

/** The site's Markdown plugins, shared by astro.config.mjs and tests. */
export const markdownPlugins = {
  remarkPlugins: [readingTimeRemarkPlugin],
  rehypePlugins: [responsiveTablesRehypePlugin, legacyHeadingIdsRehypePlugin],
}
