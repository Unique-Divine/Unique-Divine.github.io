/// <reference lib="dom" />

import {
  calculateRecord,
  CALCULATOR_STORAGE_KEY,
  createBlankCalculation,
  readCalculatorState,
  type CalculatorRecord,
  type CalculatorState,
} from "./model.ts"
import {
  buildSharedCalculationsUrl,
  MAX_SHARED_CALCULATIONS,
  mergeSharedCalculations,
  readSharedCalculationsUrl,
  removeSharedCalculationsFromUrl,
} from "./shareState.ts"
import {
  formatBps,
  formatPercent,
  formatUsd,
  type FeeCoverageResult,
} from "./volumeCalc.ts"

const root = document.querySelector<HTMLElement>(".sai-calculator")
const cards = root?.querySelector<HTMLElement>("#calculator-cards")
const addButton = root?.querySelector<HTMLButtonElement>("#add-calculation")
const shareButton = root?.querySelector<HTMLButtonElement>(
  "#share-calculations",
)
const storageStatus = root?.querySelector<HTMLElement>("#storage-status")
const sharedWarning = root?.querySelector<HTMLElement>("#shared-link-warning")
const sharedSession = root?.querySelector<HTMLElement>("#shared-session")
const sharedSessionTitle = root?.querySelector<HTMLElement>(
  "#shared-session-title",
)
const addSharedButton = root?.querySelector<HTMLButtonElement>(
  "#add-shared-calculations",
)
const dismissSharedButton = root?.querySelector<HTMLButtonElement>(
  "#dismiss-shared-calculations",
)
const shareDialog = root?.querySelector<HTMLDialogElement>("#share-dialog")
const closeShareDialog = root?.querySelector<HTMLButtonElement>(
  "#close-share-dialog",
)
const cancelShareDialog = root?.querySelector<HTMLButtonElement>(
  "#cancel-share-dialog",
)
const shareOptions = root?.querySelector<HTMLElement>("#share-options")
const shareError = root?.querySelector<HTMLElement>("#share-error")
const shareLinkField = root?.querySelector<HTMLElement>("#share-link-field")
const shareLinkOutput =
  root?.querySelector<HTMLInputElement>("#share-link-output")
const shareCopyStatus = root?.querySelector<HTMLElement>("#share-copy-status")
const copyShareLink = root?.querySelector<HTMLButtonElement>("#copy-share-link")

if (
  !root ||
  !cards ||
  !addButton ||
  !shareButton ||
  !storageStatus ||
  !sharedWarning ||
  !sharedSession ||
  !sharedSessionTitle ||
  !addSharedButton ||
  !dismissSharedButton ||
  !shareDialog ||
  !closeShareDialog ||
  !cancelShareDialog ||
  !shareOptions ||
  !shareError ||
  !shareLinkField ||
  !shareLinkOutput ||
  !shareCopyStatus ||
  !copyShareLink
) {
  throw new Error("Calculator page is missing required elements.")
}

let storedState: string | null = null
try {
  storedState = localStorage.getItem(CALCULATOR_STORAGE_KEY)
} catch {
  // saveState reports unavailable browser storage after the first render.
}

const localState = readCalculatorState(storedState)
const sharedLink = readSharedCalculationsUrl(window.location.href)
let mode: "local" | "shared" =
  sharedLink.status === "valid" ? "shared" : "local"
const state: CalculatorState = {
  version: 1,
  calculations:
    sharedLink.status === "valid"
      ? sharedLink.calculations
      : localState.calculations.map((record) => ({ ...record })),
}

if (sharedLink.status === "invalid") {
  sharedWarning.hidden = false
  sharedWarning.textContent = `The shared calculations could not be loaded. ${sharedLink.message}`
}

const replaceCalculations = (calculations: CalculatorRecord[]): void => {
  state.calculations.splice(
    0,
    state.calculations.length,
    ...calculations.map((record) => ({ ...record })),
  )
}

const saveState = (): void => {
  if (mode === "shared") {
    storageStatus.textContent = "Shared session · changes are not saved"
    storageStatus.classList.remove("storage-error")
    return
  }
  try {
    localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(state))
    storageStatus.textContent = "Saved in this browser"
    storageStatus.classList.remove("storage-error")
  } catch (error) {
    storageStatus.textContent = `Local save unavailable: ${
      error instanceof Error ? error.message : String(error)
    }`
    storageStatus.classList.add("storage-error")
  }
}

const renderSession = (): void => {
  const isShared = mode === "shared"
  sharedSession.hidden = !isShared
  if (isShared) {
    const count = state.calculations.length
    sharedSessionTitle.textContent = `Viewing ${count} shared calculation${count === 1 ? "" : "s"}`
  }
  saveState()
}

const appendMetric = (
  container: HTMLElement,
  label: string,
  value: string,
): void => {
  const metric = document.createElement("div")
  metric.className = "metric"
  const term = document.createElement("span")
  term.className = "metric-label"
  term.textContent = label
  const output = document.createElement("strong")
  output.textContent = value
  metric.append(term, output)
  container.append(metric)
}

const renderSuccess = (panel: HTMLElement, result: FeeCoverageResult): void => {
  panel.className = "result-panel"
  panel.replaceChildren()

  const primary = document.createElement("div")
  primary.className = "primary-result"
  const label = document.createElement("span")
  label.textContent = "Required trading volume"
  const value = document.createElement("strong")
  value.textContent = formatUsd(result.volume_usd)
  primary.append(label, value)

  const metrics = document.createElement("div")
  metrics.className = "metric-grid"
  appendMetric(
    metrics,
    "Net earnings rate",
    `${formatBps(result.net_earnings_rate)} · ${formatPercent(result.net_earnings_rate)}`,
  )
  appendMetric(
    metrics,
    "Gross fee revenue",
    formatUsd(result.gross_fee_revenue_usd),
  )
  appendMetric(
    metrics,
    "External revenue share",
    formatUsd(result.external_rev_share_usd),
  )
  appendMetric(
    metrics,
    "Retained fee revenue",
    formatUsd(result.retained_fee_revenue_usd),
  )
  appendMetric(
    metrics,
    "Volume-based payout",
    formatUsd(result.volume_cost_usd),
  )
  appendMetric(metrics, "Net earnings", formatUsd(result.net_earnings_usd))

  panel.append(primary, metrics)
}

const renderResult = (card: HTMLElement, record: CalculatorRecord): void => {
  const panel = card.querySelector<HTMLElement>("[data-result]")
  if (!panel) return

  const view = calculateRecord(record)
  if (view.status === "success") {
    renderSuccess(panel, view.result)
    return
  }

  panel.replaceChildren()
  const message = document.createElement("p")
  if (view.status === "pending") {
    panel.className = "result-panel result-pending"
    message.textContent =
      "Enter all four deal terms to calculate required volume."
  } else {
    panel.className = "result-panel result-error"
    message.textContent = view.message
  }
  panel.append(message)
}

const field = (
  labelText: string,
  fieldName: Exclude<keyof CalculatorRecord, "id">,
  value: string,
  options: { prefix?: string; suffix?: string; placeholder?: string } = {},
): HTMLLabelElement => {
  const label = document.createElement("label")
  label.className = fieldName === "label" ? "field field-wide" : "field"
  const caption = document.createElement("span")
  caption.textContent = labelText
  const shell = document.createElement("span")
  shell.className = "input-shell"
  if (options.prefix) {
    const prefix = document.createElement("span")
    prefix.textContent = options.prefix
    shell.append(prefix)
  }
  const input = document.createElement("input")
  input.dataset.field = fieldName
  input.value = value
  input.placeholder = options.placeholder ?? ""
  input.autocomplete = "off"
  input.inputMode = fieldName === "label" ? "text" : "decimal"
  if (fieldName !== "label") input.type = "text"
  shell.append(input)
  if (options.suffix) {
    const suffix = document.createElement("span")
    suffix.textContent = options.suffix
    shell.append(suffix)
  }
  label.append(caption, shell)
  return label
}

const buildCard = (record: CalculatorRecord, index: number): HTMLElement => {
  const card = document.createElement("article")
  card.className = "calculator-card"
  card.dataset.id = record.id

  const header = document.createElement("header")
  const title = document.createElement("p")
  title.className = "card-number"
  title.textContent = `Calculation ${index + 1}`
  const actions = document.createElement("div")
  actions.className = "card-actions"
  for (const [action, text] of [
    ["duplicate", "Duplicate"],
    ["remove", "Remove"],
  ] as const) {
    const button = document.createElement("button")
    button.type = "button"
    button.dataset.action = action
    button.textContent = text
    actions.append(button)
  }
  header.append(title, actions)

  const fields = document.createElement("div")
  fields.className = "field-grid"
  fields.append(
    field("Scenario name", "label", record.label, {
      placeholder: "e.g. Partner launch incentive",
    }),
    field("Cost basis / Target ROI", "costBasisUsd", record.costBasisUsd, {
      prefix: "$",
      placeholder: "5000",
    }),
    field("Gross fee", "feeBps", record.feeBps, {
      suffix: "bps",
      placeholder: "8",
    }),
    field("External revenue share", "revSharePercent", record.revSharePercent, {
      suffix: "%",
      placeholder: "65",
    }),
    field("Volume payout", "perMillionPayout", record.perMillionPayout, {
      prefix: "$",
      suffix: "per $1M",
      placeholder: "100",
    }),
  )

  const result = document.createElement("section")
  result.dataset.result = ""
  result.setAttribute("aria-live", "polite")
  card.append(header, fields, result)
  renderResult(card, record)
  return card
}

const renderCards = (): void => {
  cards.replaceChildren()
  shareButton.disabled = !state.calculations.some(
    (record) => calculateRecord(record).status === "success",
  )
  if (state.calculations.length === 0) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = "No calculations yet. Add one when you are ready."
    cards.append(empty)
    return
  }
  state.calculations.forEach((record, index) => {
    cards.append(buildCard(record, index))
  })
}

const persistMutation = (): void => {
  saveState()
  if (mode === "shared") renderSession()
}

cards.addEventListener("input", (event) => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const card = input.closest<HTMLElement>("[data-id]")
  const fieldName = input.dataset.field as
    | Exclude<keyof CalculatorRecord, "id">
    | undefined
  if (!card || !fieldName) return
  const record = state.calculations.find((item) => item.id === card.dataset.id)
  if (!record) return
  record[fieldName] = input.value
  persistMutation()
  renderResult(card, record)
  shareButton.disabled = !state.calculations.some(
    (calculation) => calculateRecord(calculation).status === "success",
  )
})

cards.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return
  const button = event.target.closest<HTMLButtonElement>("button[data-action]")
  const card = button?.closest<HTMLElement>("[data-id]")
  if (!button || !card) return
  const index = state.calculations.findIndex(
    (item) => item.id === card.dataset.id,
  )
  if (index < 0) return

  if (button.dataset.action === "remove") {
    state.calculations.splice(index, 1)
  } else if (button.dataset.action === "duplicate") {
    const source = state.calculations[index]
    if (!source) return
    state.calculations.splice(index + 1, 0, {
      ...source,
      id: crypto.randomUUID(),
      label: source.label ? `${source.label} copy` : "",
    })
  }
  persistMutation()
  renderCards()
})

addButton.addEventListener("click", () => {
  const record = createBlankCalculation()
  state.calculations.push(record)
  persistMutation()
  renderCards()
  cards
    .querySelector<HTMLElement>(
      `[data-id="${record.id}"] input[data-field="label"]`,
    )
    ?.focus()
})

const closeSharing = (): void => shareDialog.close()

const syncShareSelection = (): void => {
  const checkboxes = Array.from(
    shareOptions.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  )
  const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length
  checkboxes.forEach((checkbox) => {
    checkbox.disabled =
      !checkbox.checked && selectedCount >= MAX_SHARED_CALCULATIONS
  })
  copyShareLink.disabled = selectedCount === 0
}

const openSharing = (): void => {
  shareOptions.replaceChildren()
  shareError.hidden = true
  shareLinkField.hidden = true
  shareCopyStatus.textContent = ""
  const shareable = state.calculations
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => calculateRecord(record).status === "success")
  shareable.forEach(({ record, index }, optionIndex) => {
    const option = document.createElement("label")
    option.className = "share-option"
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.value = record.id
    checkbox.checked = optionIndex < MAX_SHARED_CALCULATIONS
    const text = document.createElement("span")
    const name = document.createElement("strong")
    name.textContent = record.label.trim() || `Calculation ${index + 1}`
    const details = document.createElement("small")
    details.textContent = `$${record.costBasisUsd || "—"} · ${record.feeBps || "—"} bps · ${record.revSharePercent || "—"}% share`
    text.append(name, details)
    option.append(checkbox, text)
    shareOptions.append(option)
  })
  syncShareSelection()
  shareDialog.showModal()
}

shareButton.addEventListener("click", openSharing)
closeShareDialog.addEventListener("click", closeSharing)
cancelShareDialog.addEventListener("click", closeSharing)
shareOptions.addEventListener("change", () => {
  syncShareSelection()
  shareError.hidden = true
  shareCopyStatus.textContent = ""
})

copyShareLink.addEventListener("click", async () => {
  const selectedIds = new Set(
    Array.from(
      shareOptions.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]:checked',
      ),
      (checkbox) => checkbox.value,
    ),
  )
  const selected = state.calculations.filter((record) =>
    selectedIds.has(record.id),
  )
  try {
    const link = buildSharedCalculationsUrl(selected, window.location.href)
    shareLinkOutput.value = link
    shareLinkField.hidden = false
    shareError.hidden = true
    try {
      await navigator.clipboard.writeText(link)
      shareCopyStatus.textContent = "Link copied."
    } catch {
      shareLinkOutput.focus()
      shareLinkOutput.select()
      shareCopyStatus.textContent =
        "Clipboard access was unavailable. Copy the selected link above."
    }
  } catch (error) {
    shareError.hidden = false
    shareError.textContent =
      error instanceof Error ? error.message : String(error)
    shareCopyStatus.textContent = ""
  }
})

const clearSharedHash = (): void => {
  history.replaceState(
    null,
    "",
    removeSharedCalculationsFromUrl(window.location.href),
  )
}

addSharedButton.addEventListener("click", () => {
  const merged = mergeSharedCalculations(
    localState.calculations,
    state.calculations,
  )
  replaceCalculations(merged)
  localState.calculations = merged.map((record) => ({ ...record }))
  mode = "local"
  clearSharedHash()
  renderSession()
  renderCards()
})

dismissSharedButton.addEventListener("click", () => {
  replaceCalculations(localState.calculations)
  mode = "local"
  clearSharedHash()
  renderSession()
  renderCards()
})

renderCards()
renderSession()
