/**
 * Builds `/llms.txt` (https://llmstxt.org) from the site's content. These
 * functions are pure; `src/pages/llms.txt.ts` loads the collections, filters
 * them with the sitemap's rules, and passes plain data in.
 */
import type { Post } from "~/types"

import { getAsset, getBlogPermalink, getPermalink } from "./permalinks"

export interface LlmsLink {
  title: string
  /** Site-relative path, such as `/blog/26-10-19-block-latency`. */
  href: string
  description?: string
}

export interface LlmsSection {
  title: string
  links: LlmsLink[]
}

export interface LlmsIndex {
  title: string
  summary: string
  details?: string
  sections: LlmsSection[]
}

/** A post, standing page, or skill as `fetchPosts` returns it. */
export type LlmsPost = Pick<
  Post,
  "title" | "permalink" | "excerpt" | "kind" | "metadata" | "headings"
>

export interface LlmsProject {
  id: string
  data: { title: string; summary: string; tagline?: string }
}

export interface LlmsSource {
  name: string
  description: string
  about?: LlmsPost
  /** Standing pages other than About, such as `/code` and `/about/media`. */
  pages: LlmsPost[]
  /** Published articles and skills, newest first. */
  posts: LlmsPost[]
  projects: LlmsProject[]
}

const MAX_DESCRIPTION = 200

/**
 * Collapses text to one line and shortens it to whole sentences within
 * `max` characters. A first sentence longer than `max` is cut at a word.
 */
export function oneLine(text = "", max = MAX_DESCRIPTION): string {
  const line = text.replace(/\s+/g, " ").trim()
  if (line.length <= max) return line
  // A sentence ends at . ! or ? before a space, so `.github` stays whole.
  const sentences = line.split(/(?<=[.!?])\s+/)
  let kept = ""
  for (const sentence of sentences) {
    const next = kept ? `${kept} ${sentence}` : sentence
    if (next.length > max) break
    kept = next
  }
  if (kept && /[.!?]$/.test(kept)) return kept
  const cut = line.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:]+$/, "") + "…"
}

/**
 * Absolute URL for a site path. Paths other than the root drop a trailing
 * slash, matching Firebase's `trailingSlash: false` and the sitemap.
 */
export function absoluteUrl(href: string, site: string): string {
  const url = new URL(href, site)
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "")
  return url.href
}

/** Escapes characters that would end Markdown link text early. */
export function escapeLinkText(text: string): string {
  return text.replace(/([\\[\]])/g, "\\$1")
}

/**
 * One-line description of a post: its excerpt or SEO description. Standing
 * pages such as About may instead use their first `##` heading; article
 * headings name sections, not the article, so articles never do.
 */
export function postDescription(post: LlmsPost): string {
  return oneLine(
    post.excerpt?.trim() ||
      post.metadata?.description?.trim() ||
      (post.kind === "page"
        ? post.headings?.find((heading) => heading.depth === 2)?.text
        : undefined),
  )
}

export function postLink(post: LlmsPost): LlmsLink {
  return {
    title: post.title,
    href: getPermalink(post.permalink, "post"),
    description: postDescription(post),
  }
}

export function projectLink(project: LlmsProject): LlmsLink {
  return {
    title: project.data.title,
    href: getPermalink(`/code/projects/${project.id}`),
    description: oneLine(project.data.tagline ?? project.data.summary),
  }
}

/** Groups the site's public content into llms.txt sections. */
export function buildLlmsIndex(source: LlmsSource): LlmsIndex {
  const articles = source.posts.filter((post) => post.kind !== "skill")
  const skills = source.posts.filter((post) => post.kind === "skill")
  return {
    title: source.name,
    summary: oneLine(source.description),
    details:
      "Links point to canonical pages. Writing is listed newest first; " +
      "new posts appear here when the site is rebuilt.",
    sections: [
      {
        title: "Site",
        links: [
          {
            title: "Home",
            href: getPermalink("/"),
            description:
              "Introduction, agent skills, featured projects, and " +
              "the latest posts.",
          },
          ...(source.about ? [postLink(source.about)] : []),
          {
            title: "Blog",
            href: getBlogPermalink(),
            description: "Every published post, newest first.",
          },
          ...source.pages.map(postLink),
        ],
      },
      {
        title: "Feeds",
        links: [
          {
            title: "RSS feed",
            href: getAsset("rss.xml"),
            description: "RSS 2.0 feed of blog posts and agent skills.",
          },
        ],
      },
      { title: "Writing", links: articles.map(postLink) },
      {
        title: "Projects",
        links: [
          {
            title: "All projects",
            href: getPermalink("/code/projects"),
            description: "Open-source software and products I build.",
          },
          ...source.projects.map(projectLink),
        ],
      },
      {
        title: "Agent skills",
        links: [
          {
            title: "Agent skills",
            href: getPermalink("/ai-skills"),
            description: "Public agent skills I use and maintain.",
          },
          ...skills.map(postLink),
        ],
      },
    ],
  }
}

/**
 * Renders the llmstxt.org layout: one H1, a blockquote summary, optional
 * details, then `##` sections of `- [Title](url): description` links. A URL
 * that appears earlier is skipped, and empty sections are dropped.
 */
export function renderLlmsTxt(index: LlmsIndex, site: string): string {
  const seen = new Set<string>()
  const body = index.sections.flatMap((section) => {
    const lines = section.links.flatMap((link) => {
      const url = absoluteUrl(link.href, site)
      if (seen.has(url)) return []
      seen.add(url)
      const description = oneLine(link.description)
      return [
        `- [${escapeLinkText(oneLine(link.title))}](${url})` +
          (description ? `: ${description}` : ""),
      ]
    })
    return lines.length ? [`## ${section.title}`, "", ...lines, ""] : []
  })
  return [
    `# ${index.title}`,
    "",
    `> ${oneLine(index.summary)}`,
    "",
    ...(index.details ? [index.details, ""] : []),
    ...body,
  ].join("\n")
}

/**
 * The entry link target of each `- [Title](url)` list line. Links inside a
 * description are not entries, so they are ignored.
 */
export function llmsLinks(text: string): string[] {
  return [...text.matchAll(/^- \[(?:\\.|[^\]\\])*\]\(([^)\s]+)\)/gm)].map(
    (match) => match[1],
  )
}
