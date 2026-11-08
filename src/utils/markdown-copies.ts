import { posix } from "node:path"
import type { ImageMetadata } from "astro"
import { getImage } from "astro:assets"
import { getCollection } from "astro:content"

import { fetchPosts } from "./blog"
import { SITE } from "./config"
import { fetchLocalImages } from "./images"
import { absoluteUrl } from "./llms"
import { markdownComponents } from "./markdown-components"
import {
  markdownCopyHref,
  reduceMarkdown,
  type MarkdownCopy,
} from "./markdown-copy"
import { getPermalink } from "./permalinks"
import { getProjects } from "./projects"
import { isPublicPage, isPublicPost } from "./sitemap"

/** One page that gets a Markdown copy. */
export interface MarkdownSource {
  /** Site-relative HTML page path, such as `/blog/x`. */
  page: string
  /** Site-relative copy path, such as `/blog/x.md`. */
  href: string
  title: string
  publishDate?: Date
  updateDate?: Date
  /** Raw entry body, without frontmatter. */
  body: string
  /** Source file relative to the repository root. */
  filePath: string
}

function siteOrigin(): string {
  if (!SITE.site) throw new Error("src/config.yaml must set site.site")
  return SITE.site
}

/**
 * Pages that get a Markdown copy: the public articles and projects that
 * llms.txt lists, with the same filters. Standing pages and skills don't.
 */
export async function getMarkdownSources(): Promise<MarkdownSource[]> {
  const entries = new Map(
    (await getCollection("post")).map((entry) => [entry.id, entry]),
  )
  const posts = (await fetchPosts())
    .filter((post) => post.kind === "article" && isPublicPost(post))
    .map((post): MarkdownSource => {
      const entry = entries.get(post.id)
      if (!entry?.filePath || entry.body === undefined)
        throw new Error(`No Markdown source for post ${post.id}`)
      const page = getPermalink(post.permalink, "post")
      return {
        page,
        href: markdownCopyHref(page),
        title: post.title,
        publishDate: post.publishDate,
        updateDate: post.updateDate,
        body: entry.body,
        filePath: entry.filePath,
      }
    })
  const projects = (await getProjects())
    .map((project) => ({
      project,
      page: getPermalink(`/code/projects/${project.id}`),
    }))
    .filter(({ page }) => isPublicPage(page))
    .map(({ project, page }): MarkdownSource => {
      if (!project.filePath || project.body === undefined)
        throw new Error(`No Markdown source for project ${project.id}`)
      return {
        page,
        href: markdownCopyHref(page),
        title: project.data.title,
        body: project.body,
        filePath: project.filePath,
      }
    })
  return [...posts, ...projects]
}

/**
 * Absolute URL of an optimized image under `src/assets/images`, given its
 * path relative to the entry file. `getImage` with no options emits the same
 * file as Astro's Markdown image pipeline, so the copy links to the image the
 * HTML page uses.
 */
async function optimizedImage(
  url: string,
  filePath: string,
): Promise<string | undefined> {
  const key = url.startsWith("~/")
    ? url.replace("~/", "/src/")
    : posix.join(posix.dirname(`/${filePath}`), decodeURI(url))
  const load = (await fetchLocalImages())?.[key]
  if (!load) return undefined
  const { default: src } = (await load()) as { default: ImageMetadata }
  const image = await getImage({ src })
  return new URL(image.src, siteOrigin()).href
}

/** Builds the copy for one source. */
export async function buildMarkdownCopy(
  source: MarkdownSource,
): Promise<MarkdownCopy> {
  const site = siteOrigin()
  const page = absoluteUrl(source.page, site)
  return {
    title: source.title,
    url: page,
    publishDate: source.publishDate,
    updateDate: source.updateDate,
    body: await reduceMarkdown(source.body, {
      mdx: source.filePath.endsWith(".mdx"),
      page,
      site,
      resolveImage: (url) => optimizedImage(url, source.filePath),
      components: markdownComponents(site),
    }),
  }
}
