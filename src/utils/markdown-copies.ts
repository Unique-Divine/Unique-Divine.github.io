import { readdir, readFile } from "node:fs/promises"
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
  markdownPagePath,
  pageCopyIntro,
  pagePath,
  parseMarkdownPage,
  reduceMarkdown,
  renderMarkdownCopy,
  skillCopyBody,
  type MarkdownCopy,
  type PageCopy,
} from "./markdown-copy"
import { MCP_CATALOG_PATH, MCP_CATALOG_TITLE, serverPath } from "./mcp"
import { mcpCatalogMarkdown, mcpServerMarkdown } from "./mcp-markdown"
import { getMcpServers } from "./mcp-servers"
import { getAsset, getPermalink } from "./permalinks"
import { getProjects } from "./projects"
import { isPublicPage, isPublicPost } from "./sitemap"
import { getSkills, SKILLS_REPOSITORY } from "./skills"
import { skillsCatalogMarkdown } from "./skills-markdown"

/** One page that gets a Markdown copy. */
export interface MarkdownSource {
  kind: "post" | "project" | "skill" | "mcp" | "page"
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
  /**
   * Site-relative URL that relative links in the body resolve against, when
   * the source is served apart from its page, such as a raw `SKILL.md`.
   */
  linkBase?: string
}

function siteOrigin(): string {
  if (!SITE.site) throw new Error("src/config.yaml must set site.site")
  return SITE.site
}

/**
 * Pages that get a Markdown copy: the public articles and projects that
 * llms.txt lists, with the same filters, plus the public skill and MCP
 * pages and Markdown pages that set `copyForLlm: true`. Other standing
 * pages don't.
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
        kind: "post",
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
        kind: "project",
        page,
        href: markdownCopyHref(page),
        title: project.data.title,
        body: project.body,
        filePath: project.filePath,
      }
    })
  return [
    ...posts,
    ...projects,
    ...(await skillSources()),
    ...(await mcpSources()),
    ...(await markdownPageSources()),
  ]
}

/**
 * Markdown pages under `src/pages`, such as `/discord-mcp`, that turn the
 * button on with `copyForLlm: true` in frontmatter. The frontmatter is the
 * one switch: `MarkdownLayout` reads the same field.
 */
async function markdownPageSources(): Promise<MarkdownSource[]> {
  const files = (await readdir("src/pages", { recursive: true }))
    .map(String)
    .filter((file) => file.endsWith(".md"))
    .sort()
  const sources: MarkdownSource[] = []
  for (const file of files) {
    const filePath = `src/pages/${file.replace(/\\/g, "/")}`
    const parsed = parseMarkdownPage(await readFile(filePath, "utf8"))
    const page = getPermalink(markdownPagePath(file))
    if (!parsed.copyForLlm || !isPublicPage(page)) continue
    if (!parsed.title) throw new Error(`${filePath} needs a title`)
    sources.push({
      kind: "page",
      page,
      href: markdownCopyHref(page),
      title: parsed.title,
      body: parsed.body,
      filePath,
    })
  }
  return sources
}

/**
 * The `/ai-skills` catalog, then the skill and reference pages. A skill
 * page's body comes from the raw file that `just skills-import` copies into
 * `public/ai-skills-source/`, the same file the page's "Original Markdown"
 * link downloads.
 */
async function skillSources(): Promise<MarkdownSource[]> {
  const catalog = getPermalink("/ai-skills")
  const catalogSource: MarkdownSource = {
    kind: "skill",
    page: catalog,
    href: markdownCopyHref(catalog),
    title: "Agent Skills",
    body: skillsCatalogMarkdown(
      (await getSkills()).map(({ data }) => data),
      SKILLS_REPOSITORY,
    ),
    filePath: "src/content/skill",
  }
  const skills = (await getCollection("skill"))
    .map((entry) => ({
      data: entry.data,
      page: getPermalink(`/ai-skills/${entry.data.route}`),
    }))
    .filter(({ page }) => isPublicPage(page))
  const pages = await Promise.all(
    skills.map(async ({ data, page }): Promise<MarkdownSource> => {
      const filePath = `public/ai-skills-source/${data.source}`
      return {
        kind: "skill",
        page,
        href: markdownCopyHref(page),
        title: data.title,
        body: skillCopyBody(await readFile(filePath, "utf8"), data.description),
        filePath,
        linkBase: getAsset(`ai-skills-source/${data.source}`),
      }
    }),
  )
  return [catalogSource, ...pages].filter(({ page }) => isPublicPage(page))
}

/** The MCP catalog and each server page, generated from the manifests. */
async function mcpSources(): Promise<MarkdownSource[]> {
  const servers = await getMcpServers()
  const catalog = getPermalink(MCP_CATALOG_PATH)
  const sources: MarkdownSource[] = [
    {
      kind: "mcp",
      page: catalog,
      href: markdownCopyHref(catalog),
      title: MCP_CATALOG_TITLE,
      body: mcpCatalogMarkdown(servers),
      filePath: "src/content/mcp",
    },
    ...servers.map((server): MarkdownSource => {
      const page = getPermalink(serverPath(server.slug))
      return {
        kind: "mcp",
        page,
        href: markdownCopyHref(page),
        title: server.title,
        body: mcpServerMarkdown(server),
        filePath: `src/content/mcp/${server.slug}.json`,
      }
    }),
  ]
  return sources.filter(({ page }) => isPublicPage(page))
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
      base: source.linkBase && new URL(source.linkBase, site).href,
    }),
  }
}

/**
 * The button's text for a page, built by the same code as its `.md` copy.
 * Throws for a page with no copy, so turning the button on for one fails
 * the build instead of shipping a button with nothing to copy.
 */
export async function getPageCopy(pathname: string): Promise<PageCopy> {
  const page = pagePath(pathname)
  const source = (await getMarkdownSources()).find(
    (candidate) => candidate.page === page,
  )
  if (!source)
    throw new Error(
      `copyForLlm is on for ${page}, but it has no Markdown copy. ` +
        "Add it to getMarkdownSources in src/utils/markdown-copies.ts.",
    )
  return {
    markdown: renderMarkdownCopy(await buildMarkdownCopy(source)),
    intro: pageCopyIntro(source.title),
  }
}
