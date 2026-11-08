import type { APIRoute } from "astro"

import { fetchPosts, fetchStandingPages } from "~/utils/blog"
import { METADATA, SITE } from "~/utils/config"
import { newestFirst } from "~/utils/content-order"
import { buildLlmsIndex, renderLlmsTxt } from "~/utils/llms"
import { getMarkdownSources } from "~/utils/markdown-copies"
import { getAsset, getPermalink } from "~/utils/permalinks"
import { getProjects } from "~/utils/projects"
import { isPublicPage, isPublicPost } from "~/utils/sitemap"
import { getSkills } from "~/utils/skills"

/**
 * `/llms.txt`, generated at build time from the same collections, filters,
 * and order as the sitemap, so new posts appear without hand edits.
 */
export const GET: APIRoute = async () => {
  if (!SITE.site) throw new Error("src/config.yaml must set site.site")
  const aboutHref = getPermalink("/about")
  const standing = (await fetchStandingPages()).filter(isPublicPost)
  const projects = (await getProjects()).filter((project) =>
    isPublicPage(getPermalink(`/code/projects/${project.id}`)),
  )
  const index = buildLlmsIndex({
    name: SITE.name,
    description: METADATA.description ?? "",
    about: standing.find(
      (page) => getPermalink(page.permalink, "post") === aboutHref,
    ),
    pages: standing
      .filter((page) => getPermalink(page.permalink, "post") !== aboutHref)
      .sort((a, b) => a.permalink.localeCompare(b.permalink, "en")),
    posts: (await fetchPosts()).filter(isPublicPost).sort(newestFirst),
    projects,
    // Posts and projects link to their generated `.md` copies; skills to the
    // SKILL.md files that `just skills-import` copies into public/.
    markdown: new Map([
      ...(await getMarkdownSources()).map(
        ({ page, href }) => [page, href] as const,
      ),
      ...(await getSkills()).map(
        ({ data }) =>
          [
            getPermalink(`ai-skills/${data.route}`, "post"),
            getAsset(`ai-skills-source/${data.source}`),
          ] as const,
      ),
    ]),
  })
  // No Content-Type: the static build writes only dist/llms.txt, which
  // Firebase serves by extension as text/plain, so dev matches production.
  return new Response(renderLlmsTxt(index, SITE.site))
}
