/**
 * "Copy for LLM" button. Copied from the Sai docs
 * (`sai-web/docs-app/src/components/CopyForLLM.tsx`), which took it from the
 * nibi-web explorer. It keeps the states, tooltip, icons, and accessibility
 * behavior. Here it copies a context line, the page URL, and the Markdown
 * that the site serves at the page's URL plus `.md`, which
 * `PageActions.astro` passes in.
 */
import { useEffect, useId, useRef, useState } from "react"
import "./CopyForLLM.css"

export interface CopyForLLMProps {
  /** Markdown source to copy. */
  markdown: string
  /** Context sentence placed before the page URL. */
  intro: string
}

/** Build the clipboard text: context, page URL, then the page Markdown. */
export function pageMarkdown(
  { markdown, intro }: CopyForLLMProps,
  pageUrl: string,
): string {
  const url = new URL(pageUrl)
  url.hash = ""
  // Make site-relative links absolute so they work outside the page.
  const body = markdown.trim().replace(/\]\(\//g, `](${url.origin}/`)
  return `${intro} Page: ${url.href}\n\n${body}\n`
}

export default function CopyForLLM(props: CopyForLLMProps) {
  const [state, setState] = useState<"idle" | "copying" | "copied">("idle")
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [failed, setFailed] = useState(false)
  const tooltipId = useId()
  const active = useRef(false)
  const pending = useRef(false)
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
      clearTimeout(reset.current)
    }
  }, [])
  const showTooltip = (hovered || focused) && !dismissed
  const label =
    state === "copying"
      ? "Copying…"
      : state === "copied"
      ? "Copied!"
      : "Copy for LLM"
  async function copy() {
    if (pending.current) return
    pending.current = true
    clearTimeout(reset.current)
    setFailed(false)
    setState("copying")
    try {
      await navigator.clipboard.writeText(
        pageMarkdown(props, window.location.href),
      )
      if (!active.current) return
      setState("copied")
      reset.current = setTimeout(() => setState("idle"), 2000)
    } catch {
      if (!active.current) return
      setState("idle")
      setFailed(true)
    } finally {
      pending.current = false
    }
  }
  return (
    <span
      className="ex-copy-action"
      onMouseEnter={() => {
        setHovered(true)
        setDismissed(false)
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="ex-copy-llm"
        onClick={() => void copy()}
        onFocus={() => {
          setFocused(true)
          setDismissed(false)
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setDismissed(true)
        }}
        aria-disabled={state === "copying"}
        aria-busy={state === "copying"}
        aria-describedby={showTooltip ? tooltipId : undefined}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
          className={state === "copying" ? "ex-copy-spinner" : undefined}
        >
          {state === "copying" ? (
            <path d="M12 3a9 9 0 1 1-9 9" />
          ) : state === "copied" ? (
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 3 3 5-6" />
            </>
          ) : (
            <>
              <rect x="5" y="5" width="14" height="16" rx="2" />
              <rect x="9" y="2" width="6" height="5" rx="1" />
              <path d="M9 12h6m-6 4h6" />
            </>
          )}
        </svg>
        <span>{label}</span>
      </button>
      <span
        className="ex-copy-announcement"
        aria-live="polite"
        aria-atomic="true"
      >
        {failed ? "Could not copy to clipboard." : state === "idle" ? "" : label}
      </span>
      {showTooltip && (
        <span id={tooltipId} role="tooltip" className="ex-copy-tooltip">
          Copy page as Markdown
        </span>
      )}
    </span>
  )
}
