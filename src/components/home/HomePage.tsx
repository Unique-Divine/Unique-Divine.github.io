import type { ReactNode } from 'react';

const terminalSections = [
  {
    label: 'About Me',
    href: '/about-unique-divine',
    items: [
      { label: "What I'm doing right now", href: '/about-unique-divine#what-i-do-for-work' },
      { label: 'Nibi Inc. and Nibiru', href: '/web3/nibiru/nibi-inc' },
      { label: 'In the Media', href: '/media' },
      { label: 'Contact Me', href: '/about-unique-divine#contact' },
    ],
  },
  {
    label: 'Code',
    href: '/code',
    description: 'Tools, notes, and larger software engineering projects.',
    items: [
      { label: 'Golang Coding Guides', href: '/code/golang' },
      { label: 'Unique-Divine/Dotfiles', href: 'https://github.com/Unique-Divine/dotfiles' },
      { label: 'Unique-Divine/jiyuu', href: 'https://github.com/Unique-Divine/jiyuu' },
      { label: 'NibiruChain/Nibiru', href: 'https://github.com/NibiruChain/nibiru/' },
      { label: 'GitHub and Git', href: '/code/github-git-gh' },
    ],
  },
  {
    label: 'Popular Articles',
    href: '/blog',
    actionLabel: '[See All]',
    items: [
      { label: 'Advice on How to Take Advice Including Mine', href: '/japanese/02-advice-how-to-take-advice' },
      { label: 'Why I Learned Japanese', href: '/japanese/01-why-learn-japanese' },
    ],
  },
];

const focusAreas = ['software', 'crypto', 'language', 'music', 'writing'];

function TerminalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="text-cyan-300 decoration-cyan-300/40 underline-offset-4 transition hover:text-white hover:underline"
      href={href}
    >
      {children}
    </a>
  );
}

export default function HomePage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(20,184,166,0.12),transparent_28%),linear-gradient(to_bottom,#ffffff,#f8fafc)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(20,184,166,0.08),transparent_28%),linear-gradient(to_bottom,#101720,#0f172a)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(226,232,240,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.035)_1px,transparent_1px)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-4 font-mono text-sm font-medium uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">
            /home/unique
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Unique Divine
          </h1>
          <p className="mt-5 text-xl leading-8 text-slate-700 dark:text-slate-300">
            Software engineer, founder, writer, and creative. I build systems, write notes, and publish what I learn
            along the way.
          </p>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400">
            This site is my public notebook: part archive, part workshop, part map for software, crypto, language, and
            creative discipline.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
              href="/blog"
            >
              Read essays
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-900 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-cyan-300 dark:hover:text-cyan-200"
              href="/code"
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

        <div className="rounded-2xl border border-cyan-300/20 bg-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.22),0_0_0_1px_rgba(56,216,255,0.12)] dark:bg-[#17202d]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-300/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </div>
            <p className="font-mono text-xs text-slate-400">~/unique-divine</p>
          </div>

          <div className="space-y-6 overflow-x-auto p-5 font-mono text-sm leading-6 text-slate-200 sm:p-6">
            <p>
              <span className="text-cyan-300">$</span> tree ~/unique
            </p>

            {terminalSections.map((section) => (
              <div className="min-w-[34rem]" key={section.label}>
                <p>
                  <TerminalLink href={section.href}>{section.label}</TerminalLink>
                  {section.actionLabel && (
                    <span className="ml-6">
                      <TerminalLink href={section.href}>{section.actionLabel}</TerminalLink>
                    </span>
                  )}
                  {section.description && <span className="text-slate-400"> - {section.description}</span>}
                </p>
                <div className="mt-1 text-slate-400">
                  {section.items.map((item, index) => (
                    <p key={item.href}>
                      {index === section.items.length - 1 ? '`-- ' : '|-- '}
                      <TerminalLink href={item.href}>{item.label}</TerminalLink>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
