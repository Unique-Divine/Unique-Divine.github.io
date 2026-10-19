import { getCollection } from "astro:content"

export async function getProjects() {
  const projects = await getCollection("project", ({ data }) => !data.draft)
  return projects.sort(
    (a, b) =>
      a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  )
}
