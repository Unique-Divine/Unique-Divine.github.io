/**
 * Markdown body for the `/ai-skills` catalog's copy. Pure;
 * `src/utils/markdown-copies.ts` loads the skills and adds the title and
 * page URL. Links stay site-relative here and become absolute when the copy
 * is built.
 */

/** The skill fields the catalog lists. */
export interface CatalogSkill {
  name: string
  description: string
  route: string
}

/** The catalog as Markdown: intro, install command, then every skill. */
export function skillsCatalogMarkdown(
  skills: CatalogSkill[],
  repository: string,
): string {
  return (
    [
      "The instructions and references I give AI agents for work I do " +
        "often: reviewing code, investigating systems, querying chains, and " +
        "writing clearly.",
      "## Installation",
      "Each skill bundles a workflow with the references an agent needs. " +
        "Install one from its page, or browse the collection with this " +
        "command. Some workflows also need their own CLI tools or service " +
        "access; check the skill's instructions.",
      "```sh\nnpx skills add " + repository + "\n```",
      `## The Collection`,
      `${skills.length} skills. Each links to its page and its Markdown copy.`,
      skills
        .map(
          ({ name, description, route }) =>
            `- [${name}](/ai-skills/${route}): ` +
            `${description.replace(/\s+/g, " ").trim()} ` +
            `([Markdown](/ai-skills/${route}.md))`,
        )
        .join("\n"),
      `Source: [Unique-Divine/jiyuu](${repository}/tree/main/ai-skills).`,
    ].join("\n\n") + "\n"
  )
}
