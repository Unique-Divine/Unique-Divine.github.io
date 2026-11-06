import { useEffect, useMemo, useRef, useState } from "react"

import type { FeaturedSkill } from "~/utils/featured-skills"

import "./SkillSession.css"

import {
  buildTimeline,
  fallbackScript,
  formatElapsed,
  seededRandom,
  SKILL_SESSION_SCRIPTS,
  sliceSpans,
  visibleCount,
  type FinalState,
  type SessionTimeline,
  type SkillSessionScript,
  type Span,
} from "./skillSessions"

/** How long a finished transcript stays on screen before auto-play moves on. */
const HOLD_MS = 3400
/** Hover must rest this long on a sidebar item before it takes over. */
const HOVER_SELECT_MS = 140
/** Spinner seconds shown per real second, so the timer visibly ticks. */
const TIMER_SPEED = 5
const SPINNER = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"]

type SidebarState = "idle" | "working" | FinalState

interface Session {
  skill: FeaturedSkill
  script: SkillSessionScript
  timeline: SessionTimeline
}

const stateGlyph: Record<SidebarState, string> = {
  idle: "○",
  working: "●",
  done: "●",
  blocked: "◉",
}

const stateLabel: Record<SidebarState, string> = {
  idle: "idle · claude",
  working: "working · claude",
  done: "done · claude",
  blocked: "blocked · needs you",
}

function SpanText({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <span className={`ss-tone-${span.tone ?? "plain"}`} key={i}>
          {span.text}
        </span>
      ))}
    </>
  )
}

function buildSessions(skills: FeaturedSkill[]): Session[] {
  return skills.map((skill, index) => {
    const script =
      SKILL_SESSION_SCRIPTS.find(({ name }) => name === skill.name) ??
      fallbackScript(skill.name, skill.summary)
    const timeline = buildTimeline(script, undefined, seededRandom(index + 11))
    return { skill, script, timeline }
  })
}

export default function SkillSession({ skills }: { skills: FeaturedSkill[] }) {
  const sessions = useMemo(() => buildSessions(skills), [skills])
  const [active, setActive] = useState(0)
  // Server render shows the first transcript complete, so the section reads
  // fine without JavaScript. The client restarts it from zero on mount.
  const [elapsed, setElapsed] = useState(Number.POSITIVE_INFINITY)
  const [finished, setFinished] = useState<Record<string, FinalState>>({})
  const [paused, setPaused] = useState(false)
  const startRef = useRef(0)
  const hoverTimer = useRef<number>()
  const transcriptRef = useRef<HTMLDivElement>(null)

  const session = sessions[active]
  const { timeline, script } = session

  const select = (index: number) => {
    window.clearTimeout(hoverTimer.current)
    if (index === active) return
    setActive(index)
    startRef.current = performance.now()
    setElapsed(0)
  }

  // One animation loop drives typing, the spinner, the timer, and auto-play.
  useEffect(() => {
    startRef.current = performance.now()
    setElapsed(0)
    let frame = 0
    const tick = (now: number) => {
      setElapsed(now - startRef.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const done = elapsed >= timeline.end
  useEffect(() => {
    if (!done || !Number.isFinite(elapsed)) return
    setFinished((prev) =>
      prev[script.name] === script.finalState
        ? prev
        : { ...prev, [script.name]: script.finalState },
    )
  }, [done, elapsed, script])

  useEffect(() => {
    if (paused || !Number.isFinite(elapsed)) return
    if (elapsed < timeline.end + HOLD_MS) return
    const next = (active + 1) % sessions.length
    setActive(next)
    startRef.current = performance.now()
    setElapsed(0)
  }, [elapsed, paused, active, sessions.length, timeline.end])

  const sidebarState = (index: number): SidebarState => {
    const name = sessions[index].skill.name
    if (index === active) return done ? script.finalState : "working"
    return finished[name] ?? "idle"
  }

  // Typed progress for the active transcript.
  const visible = timeline.lines.map((line) =>
    visibleCount(line.times, elapsed),
  )
  const typingLine = visible.findIndex(
    (count, i) => count > 0 && count < timeline.lines[i].times.length,
  )
  const typedChars = visible.reduce((sum, count) => sum + count, 0)
  const working = elapsed >= timeline.promptEnd && !done
  const agentSeconds =
    Math.max(0, Math.min(elapsed, timeline.end) - timeline.promptEnd) / 1000
  const spinnerFrame =
    SPINNER[Math.floor(Math.max(0, elapsed) / 110) % SPINNER.length]
  const contextK = script.contextK + Math.round(typedChars * 0.06)
  const contextPct = Math.max(1, Math.round((contextK / 1000) * 100))
  // The prompt types in the input box, then moves into the transcript.
  const promptSent = elapsed >= timeline.promptEnd
  const draft = promptSent
    ? []
    : sliceSpans(timeline.lines[0].spans, visible[0])

  // Keep the newest line in view, like a terminal, when a pane is short.
  useEffect(() => {
    const el = transcriptRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [typedChars, active])

  return (
    <div
      className="ss-mock"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        window.clearTimeout(hoverTimer.current)
        setPaused(false)
      }}
    >
      <nav className="ss-sidebar" aria-label="Featured agent skills">
        <p className="ss-sidebar-title">
          <span>skills</span>
          <span className="ss-sidebar-count">{sessions.length}</span>
        </p>
        <ul>
          {sessions.map(({ skill }, index) => {
            const state = sidebarState(index)
            return (
              <li key={skill.name}>
                <a
                  className={`ss-item ss-${state}${index === active ? " is-active" : ""}`}
                  href={skill.href}
                  aria-current={index === active ? "true" : undefined}
                  onMouseEnter={() => {
                    window.clearTimeout(hoverTimer.current)
                    hoverTimer.current = window.setTimeout(
                      () => select(index),
                      HOVER_SELECT_MS,
                    )
                  }}
                  onFocus={() => select(index)}
                  onClick={(event) => {
                    // First click selects; clicking the active skill opens it.
                    if (index !== active) {
                      event.preventDefault()
                      select(index)
                    }
                  }}
                >
                  <span className="ss-dot" aria-hidden="true">
                    {stateGlyph[state]}
                  </span>
                  <span className="ss-item-text">
                    <strong>{skill.name}</strong>
                    <small>{stateLabel[state]}</small>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <section className="ss-main" aria-label={`${session.skill.name} session`}>
        <div className="ss-tabs">
          <span className="ss-tab is-active">1 claude</span>
          <span className="ss-tab">2 shell</span>
          <a className="ss-open" href={session.skill.href}>
            open {session.skill.name}
            <span aria-hidden="true"> ↗</span>
          </a>
        </div>

        <div className="ss-pane">
          <div className="ss-header">
            <pre className="ss-logo" aria-hidden="true">
              {" ▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝"}
            </pre>
            <div className="ss-header-text">
              <div>
                <b>Claude Code</b> <span className="ss-tone-dim">v2.1</span>
              </div>
              <div className="ss-tone-dim">Opus with high effort</div>
              <div className="ss-tone-dim">{script.cwd}</div>
            </div>
          </div>

          <div className="ss-transcript" key={script.name} ref={transcriptRef}>
            {timeline.lines.map((line, i) => {
              const count = visible[i]
              if (line.kind === "prompt" ? !promptSent : count === 0)
                return null
              const spans = Number.isFinite(elapsed)
                ? sliceSpans(line.spans, count)
                : line.spans
              const cursor = i === typingLine && line.kind !== "prompt"
              return (
                <div className={`ss-line ss-${line.kind}`} key={i}>
                  <span className="ss-gutter" aria-hidden="true">
                    {line.kind === "prompt"
                      ? "❯"
                      : line.kind === "agent"
                        ? "●"
                        : ""}
                  </span>
                  <span className="ss-text">
                    <SpanText spans={spans} />
                    {cursor && <span className="ss-cursor" />}
                  </span>
                </div>
              )
            })}

            {(working || done) && (
              <div className={`ss-line ss-spinner${done ? " is-done" : ""}`}>
                <span className="ss-gutter" aria-hidden="true">
                  {done ? "✻" : spinnerFrame}
                </span>
                <span className="ss-text">
                  {done ? (
                    <span className="ss-tone-dim">
                      {script.finalState === "blocked"
                        ? "Waiting for your answers"
                        : "Worked"}{" "}
                      for {formatElapsed(agentSeconds * TIMER_SPEED)}
                    </span>
                  ) : (
                    <>
                      <span className="ss-verb">{script.verb}…</span>{" "}
                      <span className="ss-tone-dim">
                        ({formatElapsed(agentSeconds * TIMER_SPEED)} · esc to
                        interrupt)
                      </span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="ss-bottom">
            <div className="ss-rule" />
            <div className="ss-input">
              <span className="ss-gutter">❯</span>
              <span className="ss-text">
                <SpanText spans={draft} />
                <span className={`ss-cursor${promptSent ? " is-idle" : ""}`} />
              </span>
            </div>
            <div className="ss-rule" />
            <div className="ss-status">
              <span className="ss-tone-url">{script.cwd}</span>
              <span className="ss-tone-dim"> &gt; </span>
              <span className="ss-tone-warn">{script.branch} *</span>
              <span className="ss-tone-dim"> &gt; ctx </span>
              <span className="ss-ctx" aria-hidden="true">
                <span style={{ width: `${Math.min(100, contextPct * 4)}%` }} />
              </span>
              <span className="ss-tone-good"> {contextPct}%</span>
              <span className="ss-tone-dim"> {contextK}k/1M</span>
            </div>
            <div className="ss-status">
              <span className="ss-tone-coral">▸▸ bypass permissions on</span>
              <span className="ss-tone-dim"> (shift+tab to cycle)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
