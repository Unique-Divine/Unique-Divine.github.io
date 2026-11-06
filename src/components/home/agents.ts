/** A coding agent that loads Agent Skills (`SKILL.md`) through `npx skills`. */
export interface SkillAgent {
  name: string
  /** Path under `public/` to an SVG or PNG whose alpha channel is the logo. */
  icon: string
  /**
   * Official brand color, taken from the agent's own logo file. Agents
   * without one light up in the full text color on hover.
   */
  brand?: string
  /** Mask scale for logos drawn small inside their view box. */
  scale?: number
  /** Use the logo's luminance as the mask, so black details cut out. */
  luminance?: boolean
}

const icon = (file: string) => `/assets/agent-icons/${file}`

/**
 * Agents listed as supported in the `skills` CLI's docs/agents.md
 * (skills@1.7.6), in display order.
 */
export const SKILL_AGENTS: SkillAgent[] = [
  { name: "Claude Code", icon: icon("claude.svg"), brand: "#D97757" },
  { name: "Codex", icon: icon("codex-mask.svg") },
  { name: "Cursor", icon: icon("cursor.svg") },
  { name: "GitHub Copilot", icon: icon("github-copilot.svg") },
  { name: "OpenCode", icon: icon("opencode.svg") },
  { name: "Amp", icon: icon("amp.svg"), brand: "#F34E3F" },
  {
    name: "Kiro",
    icon: icon("kiro-mask.svg"),
    brand: "#9046FF",
    scale: 1.45,
    luminance: true,
  },
  { name: "Grok", icon: icon("grok.svg") },
  { name: "Kimi", icon: icon("kimi.svg"), brand: "#1783FF" },
  { name: "Antigravity", icon: icon("antigravity.svg") },
  { name: "Droid", icon: icon("droid.png") },
  { name: "Pi", icon: icon("pi.svg") },
  { name: "Qoder", icon: icon("qoder-mask.svg") },
  { name: "Hermes Agent", icon: icon("hermes.svg") },
]
