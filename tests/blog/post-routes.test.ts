import { expect, test } from "bun:test"

import {
  assertUniquePermalinks,
  postPermalink,
} from "../../src/utils/post-routes"

test("dated article URLs use UTC publication dates and reject folder-based slugs", () => {
  const publishDate = new Date("2026-10-18T20:00:00-04:00")
  expect(postPermalink({ slug: "26-10-19-block-latency", publishDate })).toBe(
    "blog/26-10-19-block-latency",
  )
  for (const slug of [
    "winning/01-structured-freedom",
    "26-10-18-block-latency",
    "261019-block-latency",
  ])
    expect(() => postPermalink({ slug, publishDate })).toThrow(
      "UTC publication date",
    )
  expect(() =>
    postPermalink({ slug: "post", publishDate: new Date("invalid") }),
  ).toThrow("publication date")
})

test("standing pages require explicit routes and articles cannot override their date", () => {
  const publishDate = new Date("2022-06-12T00:00:00Z")
  expect(
    postPermalink({
      slug: "about-unique-divine",
      publishDate,
      kind: "page",
      permalink: "/about",
    }),
  ).toBe("about")
  expect(() =>
    postPermalink({ slug: "about", publishDate, kind: "page" }),
  ).toThrow("permalink")
  expect(() =>
    postPermalink({ slug: "22-06-12-about", publishDate, permalink: "/about" }),
  ).toThrow("cannot override")
  expect(() =>
    assertUniquePermalinks([{ permalink: "about" }, { permalink: "about" }]),
  ).toThrow("Duplicate")
})
