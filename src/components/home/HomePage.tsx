import type { ReactNode } from "react"

type TerminalSection = {
  label: string
  href?: string
  description?: string
  actionLabel?: string
  items: Array<{
    label: string
    href?: string
    /** Inline supporting text after the label (`: …`), outside the link. */
    description?: string
    /** Extra body lines under the item, outside the link. */
    notes?: string[]
  }>
}

const terminalSections: TerminalSection[] = [
  {
    label: "About Me",
    href: "/about-unique-divine",
    items: [
      {
        label: "What I'm doing right now",
        href: "/about-unique-divine#what-i-do-for-work",
      },
      { label: "Nibi Inc. and Nibiru", href: "/web3/nibiru/nibi-inc" },
      { label: "In the Media", href: "/media" },
      { label: "Contact Me", href: "/about-unique-divine#contact" },
    ],
  },
  {
    label: "Code",
    href: "/code",
    description: "Tools, notes, and larger software engineering projects.",
    items: [
      { label: "Golang Coding Guides", href: "/code/golang" },
      {
        label: "Unique-Divine/Dotfiles",
        href: "https://github.com/Unique-Divine/dotfiles",
      },
      {
        label: "Unique-Divine/jiyuu",
        href: "https://github.com/Unique-Divine/jiyuu",
        notes: [
          "Jiyuu contains my devlogs and implementations for core algorithms.",
          "It's also a monorepo of tools I built and use regularly.",
        ],
      },
      {
        label: "Nibiru",
        href: "https://github.com/NibiruChain/nibiru/",
        description: "Go source code for the Nibiru blockchain.",
      },
      {
        label: "GitHub and Git",
        href: "/code/github-git-gh",
        description: "Awesome reference.",
      },
    ],
  },
  {
    label: "Popular Articles",
    href: "/blog",
    actionLabel: "[See All]",
    items: [
      {
        label: "Advice on How to Take Advice (Including Mine)",
        href: "/japanese/02-advice-how-to-take-advice",
      },
      {
        label: "Why I Learned Japanese and What It Taught Me About Myself",
        href: "/japanese/01-why-learn-japanese",
      },
    ],
  },
]

const focusAreas = ["software", "productivity", "language", "music", "fitness"]

function TerminalLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      className="text-cyan-300 decoration-cyan-300/40 underline-offset-4 transition hover:text-white hover:underline"
      href={href}
    >
      {children}
    </a>
  )
}

function StatusLeftSegment({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`relative -mr-2 px-3 py-0.5 pr-5 [clip-path:polygon(0_0,calc(100%-8px)_0,100%_50%,calc(100%-8px)_100%,0_100%)] ${className}`}
    >
      {children}
    </span>
  )
}

function StatusRightSegment({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`-ml-2 px-3 py-0.5 pl-5 [clip-path:polygon(8px_0,100%_0,100%_100%,8px_100%,0_50%)] ${className}`}
    >
      {children}
    </span>
  )
}

export default function HomePage({ children }: { children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(20,184,166,0.12),transparent_28%),linear-gradient(to_bottom,#ffffff,#f8fafc)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(20,184,166,0.08),transparent_28%),linear-gradient(to_bottom,#101720,#0f172a)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(226,232,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.035)_1px,transparent_1px)]" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-sm font-medium uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">
            /home/unique
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Unique Divine
          </h1>
          <p className="mt-5 text-xl leading-8 text-slate-700 dark:text-slate-300">
            Software engineer, creative, and lifelong autodidact.
          </p>
          {/* <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400"> */}
          {/*   This site is my public notebook. A place for essays, guides, and reflections from the work of deliberate */}
          {/*   practice and solving complex problems. */}
          {/* </p> */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
              href="/blog"
            >
              Read essays
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-cyan-300 dark:hover:text-cyan-200"
              href="https://github.com/Unique-Divine"
              // href="/code"
            >
              Explore code
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2" aria-label="Focus areas">
            {focusAreas.map((area) => (
              <span
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-mono text-xs text-slate-600 backdrop-blur dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
                key={area}
              >
                /{area}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.22),0_0_0_1px_rgba(56,216,255,0.12)] dark:bg-[#17202d]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </div>
            <p className="font-mono text-xs text-slate-400">~/unique-divine</p>
          </div>

          <div className="space-y-5 p-4 font-mono text-sm leading-6 text-slate-200 sm:p-5">
            {terminalSections.map((section: TerminalSection) => (
              <div key={section.label}>
                <p>
                  <TerminalLink href={section.href}>
                    {section.label}
                  </TerminalLink>
                  {section.actionLabel && (
                    <span className="ml-6">
                      <TerminalLink href={section.href}>
                        {section.actionLabel}
                      </TerminalLink>
                    </span>
                  )}
                  {section.description && (
                    <span className="text-slate-400">
                      {" "}
                      - {section.description}
                    </span>
                  )}
                </p>
                <div className="mt-1 whitespace-pre-wrap text-slate-400">
                  {section.items.map((item, index) => {
                    const isLast = index === section.items.length - 1
                    const branch = isLast ? "└── " : "├── "
                    const notePrefix = isLast ? "    - " : "│   - "

                    return (
                      <div key={item.href ?? item.label}>
                        <p>
                          {branch}
                          {item.href ? (
                            <TerminalLink href={item.href}>
                              {item.label}
                            </TerminalLink>
                          ) : (
                            item.label
                          )}
                          {item.description && (
                            <span>: {item.description}</span>
                          )}
                        </p>
                        {item.notes?.map((note) => (
                          <p key={note}>
                            {notePrefix}
                            {note}
                          </p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex min-w-0 items-center justify-between border-t border-white/10 bg-slate-900 font-mono text-[11px] leading-none text-slate-300 dark:bg-[#17202d]"
            aria-label="Terminal status line"
          >
            <div className="flex min-w-0 items-center">
              <StatusLeftSegment className="z-40 bg-emerald-400 font-semibold text-slate-950">
                0
              </StatusLeftSegment>
              <StatusLeftSegment className="z-30 bg-slate-800 pl-5 text-slate-200">
                zsh
              </StatusLeftSegment>
              <StatusLeftSegment className="z-20 bg-cyan-300 pl-5 font-semibold text-slate-950">
                1 nvim
              </StatusLeftSegment>
            </div>

            <div className="flex min-w-0 items-center">
              {children}
              <StatusRightSegment className="truncate bg-slate-800 text-cyan-100">
                ud/hero-revamp
              </StatusRightSegment>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
