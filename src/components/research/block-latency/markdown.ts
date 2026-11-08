/**
 * Markdown for the block-latency components, used by the post's Markdown
 * copy (`src/utils/markdown-copies.ts`). Each widget renders the default
 * view of its web version, the voting validator, from the same model, so the
 * prose that cites "the table" or "the first row" still has it.
 */
import {
  imageMarkdown,
  markdownTable,
  type ComponentText,
} from "~/utils/markdown-copy"

import {
  ASSET_BASE,
  coverage,
  data,
  endpoints,
  fmt,
  normalRows,
  opportunityText,
  PRIMARY,
  scenarioRows,
  scenarioText,
  upgradeAnchor,
  upgradeFactList,
  upgradeRows,
  type TableData,
  type Version,
} from "./model"

const MODULE = "~/components/research/block-latency/"

const table = ({ headers, rows }: TableData) => markdownTable(headers, rows)
const blocks = (...parts: string[]) => parts.filter(Boolean).join("\n\n")

/** Component replacements keyed by import path, with absolute asset URLs. */
export function blockLatencyComponents(
  site: string,
): Record<string, ComponentText> {
  const asset = (file: string) => new URL(ASSET_BASE + file, site).href
  const figure = (file: string, alt: string) => imageMarkdown(alt, asset(file))
  const validator = data.normal[PRIMARY]

  const upgrade = (version: Version) =>
    blocks(
      `**Upgrade ${version}**`,
      figure(
        `variants/upgrade-${version}.svg`,
        `Voting-validator phase contributions before and after ${version}`,
      ),
      upgradeFactList(version)
        .map((fact) => `- ${fact.badge}: **${fact.title}.** ${fact.body}`)
        .join("\n"),
      table(upgradeRows(version)),
      upgradeAnchor(version),
      `[Detailed timeline for ${version}](${asset(`timeline-${version}.svg`)})`,
    )

  return {
    [`${MODULE}Figure.astro`]: ({ file, alt }) =>
      typeof file === "string" && typeof alt === "string"
        ? figure(file, alt)
        : undefined,
    // A color key for the figure that follows it; the copy has no colors.
    [`${MODULE}Legend.astro`]: () => "",
    [`${MODULE}Guide.astro`]: () => ({
      before: blocks(
        "Research note by Unique Divine · Nibiru production capture, " +
          "October 17 to 19, 2026 · All times UTC",
        `Voting validator baseline: **${fmt(validator.block_mean_ms)} ms** ` +
          "mean canonical block interval · " +
          `**${fmt(validator.voting_contribution_ms)} ms** Prevote + ` +
          "Precommit per block · " +
          `**${validator.block_observations.delta.toLocaleString("en-US")}**` +
          " observed intervals over 48 hours",
        "Data: " +
          [
            `[Display data, JSON](${asset("measurements.json")})`,
            `[Full generated tables](${asset("tables.md")})`,
            `[Asset hashes](${asset("provenance.json")})`,
            "[Original portable HTML guide](https://uniquedivine.com/f/26/" +
              "sai-node-perf/261019-visual-guide.html)",
          ].join(" · "),
      ),
      after: blocks(
        "Data and figures come from the fixed `2026-10-19-baseline-v1` " +
          "capture. The site uses a committed export and does not query " +
          "live nodes.",
        `Source report SHA-256 \`${data.source_sha256}\`.`,
      ),
    }),
    [`${MODULE}Budget.astro`]: () =>
      blocks(
        coverage(PRIMARY),
        figure(
          "normal-budget.svg",
          "Voting validator's phase budget over 48 hours, in milliseconds " +
            "per block",
        ),
        "Phase table, voting validator. Contribution is the phase-duration " +
          "counter change divided by block observations. Mean visit " +
          "divides by phase visits instead. Repeated rounds and skipped " +
          "states make these different.",
        table(normalRows(PRIMARY)),
        endpoints(PRIMARY),
      ),
    [`${MODULE}Opportunity.astro`]: () =>
      blocks(
        opportunityText(PRIMARY),
        "Scenario table · voting validator",
        table(scenarioRows(PRIMARY)),
      ),
    [`${MODULE}Upgrade.astro`]: () =>
      blocks(...(Object.keys(data.upgrades) as Version[]).map(upgrade)),
    [`${MODULE}Scenario.astro`]: () =>
      blocks(
        figure(
          "no-voting.svg",
          "Measured validator interval compared with a hypothetical " +
            "zero-voting interval",
        ),
        scenarioText(PRIMARY),
      ),
  }
}
