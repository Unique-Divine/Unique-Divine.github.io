import measurements from "~/data/research/blockLatency.json"

export const data = measurements
export const PRIMARY = "cataclysm-1-validator"
export const ASSET_BASE = "/research/261019-block-latency/"
export type Pod = keyof typeof data.normal
export type Version = keyof typeof data.upgrades
export type Profile = (typeof data.normal)[Pod]
export type Phase = Profile["phases"][number]
export type State = keyof typeof data.explain

export const fmt = (value: number | null | undefined): string =>
  value == null
    ? "Unavailable"
    : value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
export const signed = (value: number) => `${value >= 0 ? "+" : ""}${fmt(value)}`
export const escapeText = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

export function table(headers: string[], rows: (string | number)[][]) {
  return `<table><thead><tr>${headers.map((s) => `<th scope="col">${escapeText(s)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v, i) => (i === 0 ? `<th scope="row">${escapeText(v)}</th>` : `<td>${escapeText(v)}</td>`)).join("")}</tr>`).join("")}</tbody></table>`
}

export function coverage(pod: Pod) {
  const profile = data.normal[pod]
  const complete = data.normal_bins[pod].filter((bin) => bin.complete).length
  return `${data.names[pod]} · ${profile.block_observations.delta.toLocaleString("en-US")} intervals · ${complete}/96 half-hour bins complete${profile.complete ? " · pooled window complete" : ". Snapshot 0 is incomplete because of a phase scrape gap."}`
}

export function endpoints(pod: Pod) {
  const p = data.normal[pod]
  return `Actual scrape endpoints: ${p.block_observations.first_scrape_utc} to ${p.block_observations.last_scrape_utc}. Requested window: ${p.start_utc} to ${p.end_utc}. Signed residual ${signed(p.residual_ms)} ms. Each boundary uses the preceding scrape, at most 90 seconds earlier.`
}

export function normalTable(pod: Pod) {
  return table(
    [
      "Phase",
      "Mean visit, ms",
      "Per block, ms",
      "Visits/block",
      "Share",
      "Coverage",
    ],
    data.normal[pod].phases.map((p) => [
      p.state,
      fmt(p.mean_visit_ms),
      fmt(p.contribution_ms_per_block),
      p.visits_per_block == null
        ? "Unavailable"
        : p.visits_per_block.toFixed(6),
      p.share_percent == null ? "Unavailable" : `${fmt(p.share_percent)}%`,
      !p.observed
        ? "Absent series"
        : (p.missing_count_samples_vs_block ?? 0) > 0
          ? `Missing ${p.missing_count_samples_vs_block} scrape(s)`
          : "Observed",
    ]),
  )
}

export function phaseDetail(pod: Pod, state: State) {
  const p = data.normal[pod].phases.find((phase) => phase.state === state)!
  const values = p.observed
    ? `${fmt(p.contribution_ms_per_block)} ms per block · ${fmt(p.share_percent)}% · ${fmt(p.mean_visit_ms)} ms per visit`
    : "Unavailable · absent series"
  return `<h3>${state}</h3><small>${values}</small><p>${escapeText(data.explain[state])}</p>`
}

export function scenarios(pod: Pod) {
  const p = data.normal[pod]
  const wait = p.phases.find(
    (phase) => phase.state === "NewHeight",
  )!.contribution_ms_per_block!
  return [
    { label: "Captured baseline", value: p.block_mean_ms, status: "Measured" },
    {
      label: "Zero remaining NewHeight wait",
      value: p.block_mean_ms - wait,
      status: "Hypothetical",
    },
    {
      label: "Zero Prevote and Precommit",
      value: p.zero_voting_scenario_ms,
      status: "Hypothetical",
    },
    {
      label: "Zero NewHeight and both voting phases",
      value: p.block_mean_ms - wait - p.voting_contribution_ms,
      status: "Hypothetical",
    },
  ]
}

export function scenarioTable(pod: Pod) {
  return table(
    ["Scenario", "Interval, ms", "Evidence status"],
    scenarios(pod).map((s) => [s.label, fmt(s.value), s.status]),
  )
}

export function scenarioText(pod: Pod) {
  const p = data.normal[pod]
  return `${fmt(p.block_mean_ms)} − ${fmt(p.voting_contribution_ms)} = ${fmt(p.zero_voting_scenario_ms)} ms in the zero-voting scenario. That subtracts ${fmt((100 * p.voting_contribution_ms) / p.block_mean_ms)}% of the measured interval. Other contributions and the signed residual stay fixed.`
}

export function recoveryDuration(version: Version) {
  const minutes = data.upgrades[version].recovery.seconds_from_anchor / 60
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min`
    : `${minutes} min`
}

export function upgradeFacts(version: Version) {
  const u = data.upgrades[version]
  return `<div class="bl-card"><span class="bl-badge">Initial interruption</span><h3>${fmt(u.gap.interval_seconds)} seconds</h3><p>Largest canonical header interval, at H+2. Header time derives from previous-height commit votes, so this is not a local halt stopwatch.</p></div><div class="bl-card"><span class="bl-badge">Recovery criterion</span><h3>Confirmed at +${recoveryDuration(version)}</h3><p>The qualifying 30-minute sequence runs from ${u.recovery.stable_start_utc.slice(11, 19)} to ${u.recovery.confirmed_utc.slice(11, 19)} UTC on ${u.recovery.confirmed_utc.slice(0, 10)}.</p></div>`
}

export function upgradeTable(version: Version) {
  const u = data.upgrades[version]
  const order = ["before", "transition", "recovery", "later"] as const
  const rows: string[][] = [
    ["Block mean", ...order.map((key) => fmt(u.tables[key].block_mean_ms))],
  ]
  for (const state of u.tables.before.phases.map((p) => p.state)) {
    rows.push([
      state,
      ...order.map((key) =>
        fmt(
          u.tables[key].phases.find((p) => p.state === state)
            ?.contribution_ms_per_block,
        ),
      ),
    ])
  }
  rows.push([
    "Signed residual",
    ...order.map((key) => signed(u.tables[key].residual_ms)),
  ])
  rows.push([
    "Coverage",
    ...order.map((key) =>
      u.tables[key].complete ? "Complete" : "INCOMPLETE · reset crossing",
    ),
  ])
  return table(
    [
      "Milliseconds per block",
      "Before −30 to −5 min",
      "Transition −5 to +5 min",
      "Recovery +5 to +30 min",
      "Later +30 to +60 min",
    ],
    rows,
  )
}

export function upgradeAnchor(version: Version) {
  const u = data.upgrades[version]
  return `Proposal ${u.anchor.proposal} · applied height ${u.anchor.height.toLocaleString("en-US")} · anchor ${u.anchor.time}. Transition counters include only observed running segments and exclude reset-crossing pairs. They do not include all stopped time.`
}
