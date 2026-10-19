/** Display titles only. Keys remain the existing category/tag URL slugs. */
export const SECTION_TITLES: Record<
  "category" | "tag",
  Partial<Record<string, string>>
> = {
  category: { nibiru: "On Nibiru and Sai", "agent-skills": "Agent Skills" },
  tag: {
    "self-improvement": "On Self-Improvement and Productivity",
    "agent-skills": "Agent Skills",
    ai: "AI",
  },
}

export function getSectionTitleOverride(
  kind: keyof typeof SECTION_TITLES,
  slug: string,
): string | undefined {
  return Object.hasOwn(SECTION_TITLES[kind], slug)
    ? SECTION_TITLES[kind][slug]
    : undefined
}
