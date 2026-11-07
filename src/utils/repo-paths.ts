import { test } from "bun:test"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"

/** Repository root, for tests and scripts that read files outside `src/`. */
export const repoRoot = new URL("../../", import.meta.url)

/** URL of a repository-relative path such as `dist/`. */
export const repoUrl = (path: string): URL => new URL(path, repoRoot)

/** Filesystem path of a repository-relative path such as `public/`. */
export const repoPath = (path: string): string => fileURLToPath(repoUrl(path))

/** Whether `just b` has produced a site build. */
export const hasBuild = existsSync(repoPath("dist/index.html"))

/**
 * `test` for checks that read `dist/`. Locally they skip until `just b` has
 * run, so a fresh clone passes `bun test`. CI builds first, so there they
 * always run and fail on a missing build instead of skipping.
 */
export const buildTest = process.env.CI ? test : test.skipIf(!hasBuild)
