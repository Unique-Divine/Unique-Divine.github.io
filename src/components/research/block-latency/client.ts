import {
  ASSET_BASE,
  coverage,
  data,
  endpoints,
  fmt,
  normalTable,
  opportunityText,
  phaseDetail,
  PRIMARY,
  scenarioTable,
  scenarioText,
  upgradeAnchor,
  upgradeFacts,
  upgradeTable,
  type Pod,
  type State,
  type Version,
} from "./model"

function initialize(root: HTMLElement) {
  const find = <T extends Element = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!
  let pod: Pod = PRIMARY
  let state: State = "NewHeight"

  function show(view: string, file: string, alt: string) {
    const figure = find(`[data-view="${view}"]`)
    const image = figure.querySelector<HTMLImageElement>(
      "[data-diagram-preview]",
    )!
    image.src = `${ASSET_BASE}${file}`
    image.alt = alt
    const size = data.figures[file as keyof typeof data.figures]
    image.width = size.width
    image.height = size.height
  }

  function detail() {
    find("[data-phase-detail]").innerHTML = phaseDetail(pod, state)
    for (const button of root.querySelectorAll<HTMLButtonElement>(
      "[data-state]",
    )) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.state === state),
      )
    }
  }

  function normal() {
    const suffix = pod.replace("cataclysm-1-", "")
    show(
      "budget",
      pod === PRIMARY ? "normal-budget.svg" : `variants/normal-${suffix}.svg`,
      `${data.names[pod]} phase budget over 48 hours, in milliseconds per block`,
    )
    show(
      "scenario",
      pod === PRIMARY ? "no-voting.svg" : `variants/no-voting-${suffix}.svg`,
      `${data.names[pod]} measured interval and hypothetical zero-voting scenario`,
    )
    find("[data-coverage]").textContent = coverage(pod)
    find("[data-normal-table]").innerHTML = normalTable(pod)
    find("[data-endpoints]").textContent = endpoints(pod)
    find("[data-scenario-table]").innerHTML = scenarioTable(pod)
    find("[data-opportunity-text]").textContent = opportunityText(pod)
    find("[data-scenario-text]").textContent = scenarioText(pod)
    find("[data-scenario-node]").textContent =
      `Scenario table · ${data.names[pod]}${data.normal[pod].complete ? "" : " · incomplete coverage"}`
    for (const button of root.querySelectorAll<HTMLButtonElement>(
      "[data-state]",
    )) {
      const phase = data.normal[pod].phases.find(
        (p) => p.state === button.dataset.state,
      )!
      button.querySelector("strong")!.textContent =
        `${fmt(phase.contribution_ms_per_block)}${phase.observed ? " ms" : ""}`
      button.querySelector("span:last-child")!.textContent = phase.observed
        ? `${fmt(phase.share_percent)}% of block mean`
        : "Absent series"
    }
    detail()
  }

  const node = find<HTMLSelectElement>("#bl-node")
  node.addEventListener("change", () => {
    if (!(node.value in data.normal)) return
    pod = node.value as Pod
    normal()
  })
  const upgrade = find<HTMLSelectElement>("#bl-upgrade")
  upgrade.addEventListener("change", () => {
    if (!(upgrade.value in data.upgrades)) return
    const version = upgrade.value as Version
    show(
      "upgrade",
      `variants/upgrade-${version}.svg`,
      `Voting-validator phase contributions before and after ${version}`,
    )
    find("[data-upgrade-facts]").innerHTML = upgradeFacts(version)
    find("[data-upgrade-table]").innerHTML = upgradeTable(version)
    find("[data-upgrade-anchor]").textContent = upgradeAnchor(version)
    find<HTMLAnchorElement>("[data-timeline]").href =
      `${ASSET_BASE}timeline-${version}.svg`
  })
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "[data-state]",
  )) {
    button.addEventListener("click", () => {
      state = button.dataset.state as State
      detail()
    })
  }
  // The static document remains useful if enhancement fails or is disabled.
  for (const control of root.querySelectorAll<
    HTMLButtonElement | HTMLSelectElement
  >("[disabled]"))
    control.disabled = false
}

for (const root of document.querySelectorAll<HTMLElement>(
  "[data-block-latency]",
))
  initialize(root)
