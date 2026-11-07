import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

/** Repository root, for tests and scripts that read files outside `src/`. */
export const repoRoot = new URL("../../", import.meta.url)

/** URL of a repository-relative path such as `dist/`. */
export const repoUrl = (path: string): URL => new URL(path, repoRoot)

/** Filesystem path of a repository-relative path such as `public/`. */
export const repoPath = (path: string): string => fileURLToPath(repoUrl(path))

/**
 * Whether `just b` has produced a site build. Tests that read `dist/` skip
 * without one, so a fresh clone passes `bun test`. CI builds first, so a
 * missing build there is an error rather than a silent skip.
 */
export const hasBuild = existsSync(repoPath("dist/index.html"))
if (!hasBuild && process.env.CI)
  throw new Error("CI must run `just b` before tests that read dist/")
