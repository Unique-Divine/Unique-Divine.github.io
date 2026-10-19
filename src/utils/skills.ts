import { getCollection, type CollectionEntry } from "astro:content"

import type { Post } from "~/types"

export const SKILLS_REPOSITORY = "https://github.com/Unique-Divine/jiyuu"
export const skillInstallCommand = (folder: string) =>
  `npx skills add ${SKILLS_REPOSITORY}/tree/main/ai-skills/${folder}`

export async function getSkills() {
  return (await getCollection("skill"))
    .filter(({ data }) => data.kind === "skill")
    .sort((a, b) => a.data.name.localeCompare(b.data.name))
}

export function skillArchivePost(entry: CollectionEntry<"skill">): Post {
  return {
    id: `skill:${entry.id}`,
    slug: `ai-skills/${entry.data.route}`,
    permalink: `ai-skills/${entry.data.route}`,
    title: entry.data.title,
    excerpt: entry.data.description,
    image: skillCover(entry.data.folder),
    publishDate: entry.data.publishDate,
    category: "agent-skills",
    tags: ["agent-skills", "ai"],
    author: "Unique Divine",
    draft: false,
    kind: "skill",
  }
}

export const skillCover = (folder: string) => `/covers/skills/${folder}.png`
