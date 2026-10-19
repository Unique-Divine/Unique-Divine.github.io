import type { MarkdownHeading } from "astro"
import { getCollection } from "astro:content"

import { getSectionTitleOverride } from "../data/blogSections"
import { SITE_PAGES } from "../data/sitePages"
import { fetchPosts } from "./blog"
import { APP_BLOG, METADATA, SITE } from "./config"
import {
  getAsset,
  getBlogPermalink,
  getCanonical,
  getPermalink,
} from "./permalinks"
import { getProjects } from "./projects"
import { isDiscoverablePage } from "./sitemap-policy.mjs"
import { getSitemapTagLabel } from "./tags"

export interface SitemapLink {
  href: string
  label: string
}
export interface SitemapSection {
  id: string
  title: string
  pages: SitemapLink[]
  groups?: SitemapGroup[]
}
export interface SitemapGroup {
  id: string
  title: string
  href?: string
  pages: SitemapLink[]
}

export function getSitemapHeadings(
  sections: SitemapSection[],
): MarkdownHeading[] {
  return sections.flatMap((section) => [
    { depth: 2, slug: `sitemap-${section.id}`, text: section.title },
    ...(section.groups ?? []).map((group) => ({
      depth: 3,
      slug: group.id,
      text: group.title,
    })),
  ])
}

export async function getSitemapSections(): Promise<SitemapSection[]> {
  const posts = await fetchPosts()
  const projects = await getProjects()
  const skillReferences = (await getCollection("skill"))
    .filter(({ data }) => data.kind === "reference")
    .sort((a, b) => a.data.route.localeCompare(b.data.route, "en"))
  const enabled = (kind: "post" | "list" | "category" | "tag") =>
    APP_BLOG.isEnabled &&
    APP_BLOG[kind].isEnabled &&
    (APP_BLOG[kind].robots.index ?? METADATA.robots?.index) !== false
  const publicPosts = posts
    .filter((post) =>
      isDiscoverablePage(
        String(getCanonical(getPermalink(post.permalink, "post"))),
        {
          site: SITE.site,
          draft: post.draft,
          index:
            post.metadata?.robots?.index ??
            APP_BLOG.post.robots.index ??
            METADATA.robots?.index,
          canonical: post.metadata?.canonical,
        },
      ),
    )
    .sort(
      (a, b) =>
        b.publishDate.valueOf() - a.publishDate.valueOf() ||
        a.id.localeCompare(b.id, "en"),
    )
  const archives = (kind: "category" | "tag") => {
    if (!enabled(kind)) return []
    const slugs = new Set(
      posts.flatMap((post) =>
        kind === "tag" ? post.tags ?? [] : post.category ? [post.category] : [],
      ),
    )
    return [...slugs]
      .map((slug) => ({
        href: getPermalink(slug, kind),
        label:
          kind === "tag"
            ? getSitemapTagLabel(slug)
            : getSectionTitleOverride("category", slug) ??
              slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll("-", " "),
      }))
      .sort(
        (a, b) =>
          a.label.localeCompare(b.label, "en") ||
          a.href.localeCompare(b.href, "en"),
      )
  }
  const articleLinks = (category?: string) =>
    APP_BLOG.isEnabled && APP_BLOG.post.isEnabled
      ? publicPosts
          .filter((post) => post.category === category)
          .map((post) => ({
            href: getPermalink(post.permalink, "post"),
            label: post.title,
          }))
      : []
  const categories = [
    ...new Set(posts.flatMap((post) => (post.category ? [post.category] : []))),
  ]
  const categoryArchives = new Map(
    archives("category").map((page) => [page.href, page]),
  )
  const groups: SitemapGroup[] = categories
    .map((category) => {
      const archive = categoryArchives.get(getPermalink(category, "category"))
      return {
        id: `sitemap-blog-category-${category}`,
        title:
          archive?.label ??
          getSectionTitleOverride("category", category) ??
          category.charAt(0).toUpperCase() +
            category.slice(1).replaceAll("-", " "),
        href: archive?.href,
        pages: articleLinks(category),
      }
    })
    .sort(
      (a, b) =>
        a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id, "en"),
    )
  groups.push({
    id: "sitemap-blog-uncategorized",
    title: "Other posts",
    pages: articleLinks(),
  })
  const sections: SitemapSection[] = [
    {
      id: "site",
      title: "Site pages",
      pages: SITE_PAGES.map((page) => ({
        ...page,
        href: getPermalink(page.href),
      })),
    },
    {
      id: "projects",
      title: "Projects",
      pages: [
        { href: getPermalink("/code/projects"), label: "All projects" },
        ...projects.map((project) => ({
          href: getPermalink(`/code/projects/${project.slug}`),
          label: project.data.title,
        })),
      ],
    },
    {
      id: "blog",
      title: "Blog and essays",
      pages: [
        ...(enabled("list")
          ? [{ href: getBlogPermalink(), label: "All blog posts" }]
          : []),
      ],
      groups,
    },
    { id: "tags", title: "Tags", pages: archives("tag") },
    {
      id: "skill-references",
      title: "Agent skill references",
      pages: skillReferences.map(({ data }) => ({
        href: getPermalink(`/ai-skills/${data.route}`),
        label: data.title,
      })),
    },
    {
      id: "resources",
      title: "Crawler resources",
      pages: [
        { href: getAsset("sitemap-index.xml"), label: "XML sitemap index" },
        { href: getAsset("rss.xml"), label: "RSS feed" },
      ],
    },
  ]
  const seen = new Set<string>()
  const include = (page: SitemapLink, resource = false) => {
    if (seen.has(page.href)) return false
    if (
      !resource &&
      !isDiscoverablePage(String(getCanonical(page.href)), {
        site: SITE.site,
        index: METADATA.robots?.index,
      })
    )
      return false
    seen.add(page.href)
    return true
  }
  return sections
    .map((section) => ({
      ...section,
      pages: section.pages.filter((page) =>
        include(page, section.id === "resources"),
      ),
      groups: section.groups
        ?.map((group) => ({
          ...group,
          href:
            group.href && include({ href: group.href, label: group.title })
              ? group.href
              : undefined,
          pages: group.pages.filter((page) => include(page)),
        }))
        .filter((group) => group.href || group.pages.length > 0),
    }))
    .filter(
      (section) =>
        section.pages.length > 0 || (section.groups?.length ?? 0) > 0,
    )
}
