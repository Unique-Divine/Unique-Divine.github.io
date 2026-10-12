import { cloneElement, useEffect, useState } from "react"
import { GitHubCalendar } from "react-github-calendar"

import "./GitHubActivity.css"

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

export default function GitHubActivity() {
  const [colorScheme, setColorScheme] = useState<"light" | "dark" | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () =>
      setColorScheme(root.classList.contains("dark") ? "dark" : "light")

    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="github-activity"
      aria-labelledby="github-activity-heading"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="github-activity-heading"
            className="font-heading text-xl font-semibold text-slate-950 dark:text-white"
          >
            GitHub activity
          </h2>
          <a
            href="https://github.com/Unique-Divine"
            className="text-sm font-medium text-cyan-700 underline-offset-4 hover:underline dark:text-cyan-300"
          >
            View GitHub profile
          </a>
        </div>
        <div className="github-activity-chart [&_article]:mx-auto">
          {colorScheme === null ? (
            <div
              role="status"
              aria-label="Loading GitHub activity"
              className="h-28 rounded bg-slate-100 motion-safe:animate-pulse dark:bg-slate-800"
            />
          ) : (
            <GitHubCalendar
              username="Unique-Divine"
              year="last"
              colorScheme={colorScheme}
              theme={theme}
              blockSize={12}
              blockMargin={4}
              blockRadius={3}
              fontSize={14}
              showWeekdayLabels={["mon", "wed", "fri"]}
              errorMessage="GitHub activity is unavailable. You can still view my profile above."
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
      </div>
    </section>
  )
}
