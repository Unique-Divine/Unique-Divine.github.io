import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { parse } from "ultrahtml"
import { querySelector, querySelectorAll } from "ultrahtml/selector"

const dist = new URL("../../dist/", import.meta.url)
const html = (route: string) =>
  readFileSync(new URL(`${route.replace(/^\//, "")}/index.html`, dist), "utf8")

test("skill images are shared between archive covers and social metadata", () => {
  for (const route of [
    "/ai-skills",
    "/ai-skills/repo-map",
    "/ai-skills/repo-map/reference",
  ]) {
    const document = parse(html(route))
    const image = querySelector(document, 'meta[property="og:image"]')
      ?.attributes.content
    expect(image).toBe(
      `https://uniquedivine.com/covers/skills/${route === "/ai-skills" ? "catalogue" : "repo-map"}.png`,
    )
    expect(
      querySelector(document, 'meta[name="twitter:card"]')?.attributes.content,
    ).toBe("summary_large_image")
    expect(
      existsSync(
        new URL(image!.replace("https://uniquedivine.com/", ""), dist),
      ),
    ).toBe(true)
  }
  const archive = parse(html("/category/agent-skills"))
  expect(
    querySelectorAll(archive, "img").some((node) =>
      node.attributes.src?.includes("/covers/skills/"),
    ),
  ).toBe(true)
})
