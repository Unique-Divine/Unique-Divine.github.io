import type { Activity } from "react-activity-calendar"

const storageKey = "github-activity:v1:Unique-Divine:last"
const apiUrl =
  "https://github-contributions-api.jogruber.de/v4/Unique-Divine?y=last"

let savedData: Activity[] | null = null
let pendingRequest: Promise<Activity[]> | null = null

function parseContributions(value: unknown): Activity[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Missing GitHub contribution data")
  }

  const dates = new Set<string>()
  for (const day of value) {
    if (
      !day ||
      typeof day.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
      !Number.isSafeInteger(day.count) ||
      day.count < 0 ||
      !Number.isInteger(day.level) ||
      day.level < 0 ||
      day.level > 4
    ) {
      throw new Error("Invalid GitHub contribution data")
    }

    const date = new Date(`${day.date}T00:00:00Z`)
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== day.date ||
      dates.has(day.date)
    ) {
      throw new Error("Invalid GitHub contribution date")
    }
    dates.add(day.date)
  }

  return value
    .map(({ date, count, level }) => ({ date, count, level }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function readCachedContributions(): Activity[] | null {
  if (savedData) return savedData

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) savedData = parseContributions(JSON.parse(stored))
  } catch {
    // Missing storage access or invalid data should not prevent a fresh fetch.
  }

  return savedData
}

export function refreshContributions(): Promise<Activity[]> {
  if (pendingRequest) return pendingRequest

  pendingRequest = (async () => {
    const response = await fetch(apiUrl)
    if (!response.ok) throw new Error("GitHub activity is unavailable")
    const body = await response.json()
    const contributions = parseContributions(body?.contributions)
    savedData = contributions
    try {
      localStorage.setItem(storageKey, JSON.stringify(contributions))
    } catch {
      // Keep the in-memory cache when storage is disabled or full.
    }
    return contributions
  })().finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}
