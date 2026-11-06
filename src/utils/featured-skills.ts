/** A skill the home page highlights, with a one-line summary in plain language. */
export interface FeaturedSkillPick {
  /** The skill's `name` in the skill collection. */
  name: string
  /** One plain sentence on what the skill does for the reader. */
  summary: string
}

/** The fields of a skill collection entry that the home page needs. */
export interface SkillSummarySource {
  name: string
  route: string
  kind: "skill" | "reference"
}

export interface FeaturedSkill {
  name: string
  href: string
  summary: string
}

/** Skills shown on the home page, in display order. */
export const HOME_SKILL_PICKS: FeaturedSkillPick[] = [
  {
    name: "gh-rev",
    summary:
      "Keeps a running review ledger for a branch or pull request across passes.",
  },
  {
    name: "drill-spec",
    summary: "Questions your plan until every open decision has an answer.",
  },
  {
    name: "unslop",
    summary: "Cuts the tells that make writing read as machine-made.",
  },
  {
    name: "herdr",
    summary: "Lets an agent drive panes, tabs, and other agents in Herdr.",
  },
  {
    name: "tailscale-serve",
    summary: "Puts a local dev server on HTTPS so you can open it on a phone.",
  },
  {
    name: "sai-perps",
    summary: "Looks up Sai markets, trades, vaults, and balances from live data.",
  },
]

/**
 * Resolves home-page picks against the skill collection. Keeps pick order,
 * links each pick to its skill page, and drops picks the collection lacks so
 * a renamed or unpublished skill never renders a dead link.
 */
export function pickFeaturedSkills(
  skills: SkillSummarySource[],
  picks: FeaturedSkillPick[] = HOME_SKILL_PICKS,
): FeaturedSkill[] {
  const byName = new Map(
    skills
      .filter((skill) => skill.kind === "skill")
      .map((skill) => [skill.name, skill]),
  )
  return picks.flatMap((pick) => {
    const skill = byName.get(pick.name)
    if (!skill) return []
    return [
      {
        name: skill.name,
        href: `/ai-skills/${skill.route}`,
        summary: pick.summary,
      },
    ]
  })
}
