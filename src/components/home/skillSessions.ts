/** Text colors inside the mock terminal, named for their role. */
export type Tone =
  | "plain"
  | "bold"
  | "dim"
  | "cmd"
  | "file"
  | "url"
  | "good"
  | "bad"
  | "warn"

export interface Span {
  text: string
  tone?: Tone
}

/**
 * One transcript line. `prompt` is the user's `❯` line, `agent` starts a new
 * `●` bullet, and `detail` continues the previous bullet, indented.
 */
export interface SessionLine {
  kind: "prompt" | "agent" | "detail"
  spans: Span[]
}

/** Sidebar state shown after a session finishes, in the Herdr vocabulary. */
export type FinalState = "done" | "blocked"

export interface SkillSessionScript {
  /** Skill `name`, matching the skill collection. */
  name: string
  cwd: string
  branch: string
  /** Gerund in the spinner line, as in "Reviewing… (12s · esc to interrupt)". */
  verb: string
  finalState: FinalState
  /** Context tokens already used when the session starts, in thousands. */
  contextK: number
  lines: SessionLine[]
}

const s = (text: string, tone?: Tone): Span => ({ text, tone })
const prompt = (text: string): SessionLine => ({
  kind: "prompt",
  spans: [s(text)],
})
const agent = (...spans: Span[]): SessionLine => ({ kind: "agent", spans })
const detail = (...spans: Span[]): SessionLine => ({ kind: "detail", spans })

/**
 * Short transcripts written from each skill's SKILL.md. Repositories, hashes,
 * hosts, and figures are illustrative.
 */
export const SKILL_SESSION_SCRIPTS: SkillSessionScript[] = [
  {
    name: "gh-rev",
    cwd: "~/ki/sai-web",
    branch: "ud/vault-cap",
    verb: "Reviewing",
    finalState: "done",
    contextK: 31,
    lines: [
      prompt("/gh-rev review PR #1153 and save it to the ledger"),
      agent(s("gh-rev open", "cmd"), s(" sai-web --pr 1153", "dim")),
      detail(
        s("2 prior revisions read · head "),
        s("a3f9c21", "file"),
        s(" matches the PR"),
      ),
      agent(
        s("gh-rev next", "cmd"),
        s(" sai-web --pr 1153 --label independent", "dim"),
      ),
      detail(s("rev 3 · 2 findings written to the ledger")),
      detail(
        s("- [ ] rev:", "warn"),
        s(" withdraw modal skips the vault cap check"),
      ),
      detail(
        s("- [ ] rev:", "warn"),
        s(" no test for a zero-share redemption"),
      ),
    ],
  },
  {
    name: "drill-spec",
    cwd: "~/ki/boku/epics",
    branch: "main",
    verb: "Drilling",
    finalState: "blocked",
    contextK: 18,
    lines: [
      prompt("/drill-spec the referral credits plan"),
      agent(
        s("Read "),
        s("credits.md", "file"),
        s(" and the payout code. Two answers unblock the rest."),
      ),
      agent(
        s("Q1.", "bold"),
        s(" Do unused credits expire, or roll over every month?"),
      ),
      detail(
        s("Recommended:", "good"),
        s(" expire after 90 days. Open balances are a liability."),
      ),
      agent(
        s("Q2.", "bold"),
        s(" Who can issue credits: ops only, or any admin?"),
      ),
      detail(
        s("Recommended:", "good"),
        s(" ops only, so every grant has one owner."),
      ),
    ],
  },
  {
    name: "unslop",
    cwd: "~/ki/gh-io-ud",
    branch: "ud/about-rewrite",
    verb: "Unslopping",
    finalState: "done",
    contextK: 12,
    lines: [
      prompt("/unslop the intro on the about page"),
      agent(
        s("3 tells: "),
        s("“a testament to”", "warn"),
        s(", a forced triple, and "),
        s("“not just X, but Y”", "warn"),
      ),
      detail(
        s(
          "- This site stands as a testament to growth, craft, and curiosity.",
          "bad",
        ),
      ),
      detail(s("+ I rebuilt this site four times before it stuck.", "good")),
      agent(s("Kept your meaning; cut 11 words.")),
    ],
  },
  {
    name: "herdr",
    cwd: "~/ki/sai-web",
    branch: "ud/vault-cap",
    verb: "Herding",
    finalState: "done",
    contextK: 44,
    lines: [
      prompt("/herdr split a pane and have codex review my diff"),
      agent(
        s("herdr pane split", "cmd"),
        s(" --current --direction right --no-focus", "dim"),
      ),
      agent(
        s("herdr agent start", "cmd"),
        s(" reviewer --kind codex --pane 2", "dim"),
      ),
      agent(
        s("herdr agent prompt", "cmd"),
        s(' reviewer "Review the diff" --wait', "dim"),
      ),
      detail(
        s("reviewer:"),
        s(" 1 finding in ", "dim"),
        s("src/vault/withdraw.ts:88", "file"),
      ),
    ],
  },
  {
    name: "tailscale-serve",
    cwd: "~/ki/gh-io-ud",
    branch: "ud/agent-logo-strip",
    verb: "Serving",
    finalState: "done",
    contextK: 9,
    lines: [
      prompt("/tailscale-serve open my dev server on my phone"),
      agent(
        s("tailscale serve", "cmd"),
        s(" --bg --https=443 http://127.0.0.1:4331", "dim"),
      ),
      agent(s("Live on your tailnet only:")),
      detail(s("https://devbox.tail0c1d.ts.net/", "url")),
      detail(
        s(
          "Open that exact URL on the phone. Funnel would make it public.",
          "dim",
        ),
      ),
    ],
  },
  {
    name: "sai-perps",
    cwd: "~/ki/sai-perps",
    branch: "main",
    verb: "Querying",
    finalState: "done",
    contextK: 27,
    lines: [
      prompt("/sai-perps what's the open interest on BTC right now?"),
      agent(
        s("Reading the live contract, then Sai Keeper GraphQL to check it."),
      ),
      detail(
        s("BTC-USD", "bold"),
        s("  long "),
        s("$1.82M", "good"),
        s("  short "),
        s("$1.41M", "bad"),
        s("  cap $5.00M", "dim"),
      ),
      agent(s("Chain and GraphQL agree as of the same block.")),
    ],
  },
]

/** Fallback for a featured skill that has no written transcript. */
export function fallbackScript(
  name: string,
  summary: string,
): SkillSessionScript {
  return {
    name,
    cwd: "~",
    branch: "main",
    verb: "Working",
    finalState: "done",
    contextK: 10,
    lines: [prompt(`/${name}`), agent(s(summary))],
  }
}

/** Typing pace in milliseconds, with symmetric jitter around each base. */
export interface TypingPace {
  start: number
  promptChar: number
  promptJitter: number
  thinkPause: number
  linePause: number
  agentChar: number
  agentJitter: number
}

export const DEFAULT_PACE: TypingPace = {
  start: 250,
  promptChar: 24,
  promptJitter: 12,
  thinkPause: 520,
  linePause: 240,
  agentChar: 8,
  agentJitter: 5,
}

export interface TimedLine extends SessionLine {
  /** Milliseconds at which each character of the line appears. */
  times: number[]
}

export interface SessionTimeline {
  lines: TimedLine[]
  /** When the prompt finishes and the agent starts working. */
  promptEnd: number
  /** When the last character appears. */
  end: number
  totalChars: number
}

export const lineLength = (line: SessionLine) =>
  line.spans.reduce((sum, span) => sum + span.text.length, 0)

/**
 * Assigns an appearance time to every character: the prompt types at a human
 * pace, the agent pauses to think, then its lines stream in quickly. Pass a
 * seeded `random` for reproducible output.
 */
export function buildTimeline(
  script: SkillSessionScript,
  pace: TypingPace = DEFAULT_PACE,
  random: () => number = Math.random,
): SessionTimeline {
  let t = pace.start
  let promptEnd = t
  let totalChars = 0
  const jitter = (base: number, spread: number) =>
    Math.max(1, base + (random() * 2 - 1) * spread)

  const lines = script.lines.map((line, index) => {
    const isPrompt = line.kind === "prompt"
    if (!isPrompt) {
      const previous = script.lines[index - 1]
      t += previous?.kind === "prompt" ? pace.thinkPause : pace.linePause
    }
    const times: number[] = []
    for (let i = 0; i < lineLength(line); i++) {
      t += isPrompt
        ? jitter(pace.promptChar, pace.promptJitter)
        : jitter(pace.agentChar, pace.agentJitter)
      times.push(Math.round(t))
    }
    totalChars += times.length
    if (isPrompt) promptEnd = t
    return { ...line, times }
  })

  return {
    lines,
    promptEnd: Math.round(promptEnd),
    end: Math.round(t),
    totalChars,
  }
}

/** Number of characters in `times` (ascending) visible at `elapsed` ms. */
export function visibleCount(times: number[], elapsed: number): number {
  let lo = 0
  let hi = times.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (times[mid] <= elapsed) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** The first `count` characters of a span list, keeping each span's tone. */
export function sliceSpans(spans: Span[], count: number): Span[] {
  const out: Span[] = []
  let left = count
  for (const span of spans) {
    if (left <= 0) break
    out.push({ ...span, text: span.text.slice(0, left) })
    left -= span.text.length
  }
  return out
}

/** Seeded PRNG (mulberry32), so a skill types with the same rhythm each time. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Formats a spinner timer like Claude Code: "48s", then "1m 02s". */
export function formatElapsed(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  if (whole < 60) return `${whole}s`
  const m = Math.floor(whole / 60)
  return `${m}m ${String(whole % 60).padStart(2, "0")}s`
}
