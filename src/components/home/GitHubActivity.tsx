import { cloneElement, useEffect, useState } from "react"
import { ActivityCalendar, type Activity } from "react-activity-calendar"

import "./GitHubActivity.css"

import {
  readCachedContributions,
  refreshContributions,
} from "./githubActivityCache"

const theme = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#383A40", "#0e4429", "#006d32", "#26a641", "#39d353"],
}

function describeActivity({ date, count }: { date: string; count: number }) {
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  })
  return `${count} ${count === 1 ? "contribution" : "contributions"} on ${day}`
}

/** Sum of daily contribution counts. */
export function totalContributions(data: Pick<Activity, "count">[]): number {
  return data.reduce((sum, day) => sum + day.count, 0)
}

export default function GitHubActivity() {
  const [colorScheme, setColorScheme] = useState<"light" | "dark" | null>(null)
  const [data, setData] = useState<Activity[] | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let active = true
    const cached = readCachedContributions()
    if (cached) setData(cached)

    refreshContributions()
      .then((contributions) => {
        if (active) setData(contributions)
      })
      .catch(() => {
        if (active && !cached) setUnavailable(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () =>
      setColorScheme(root.classList.contains("dark") ? "dark" : "light")

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const total = data ? totalContributions(data) : null

  // A compact widget for the What I've Built section; the section heading
  // introduces it, so it carries no heading of its own.
  return (
    <div
      className="w-fit max-w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-400"
      aria-label="GitHub contributions in the last year"
      role="group"
    >
      <div className="github-activity-chart">
        {colorScheme === null ? (
          <div
            role="status"
            aria-label="Loading GitHub activity"
            className="h-[7.25rem] w-[45rem] max-w-full rounded bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800"
          />
        ) : unavailable ? (
          <p role="status" className="text-sm">
            GitHub activity is unavailable right now.
          </p>
        ) : (
          <ActivityCalendar
            data={data ?? []}
            loading={data === null}
            showTotalCount={false}
            showColorLegend={false}
            colorScheme={colorScheme}
            theme={theme}
            blockSize={10}
            blockMargin={3}
            blockRadius={2}
            fontSize={12}
            showWeekdayLabels={["mon", "wed", "fri"]}
            renderBlock={(block, activity) =>
              cloneElement(block, {
                "aria-label": describeActivity(activity),
              })
            }
            tooltips={{
              activity: { text: describeActivity },
            }}
          />
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm">
        <span>
          {total === null
            ? "Contributions in the last year"
            : `${total.toLocaleString("en-US")} contributions in the last year`}
        </span>
        <a
          href="https://github.com/Unique-Divine"
          className="text-xs font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
        >
          github.com/Unique-Divine
        </a>
      </p>
    </div>
  )
}
