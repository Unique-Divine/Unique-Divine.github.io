import { expect, test } from "bun:test"
import check from "./tsconfig.check.json"
import root from "./tsconfig.json"

// tsconfig.check.json exists because the root config keeps baseUrl for
// Astro 4 tooling, and Bun's checker rejects baseUrl. Both must resolve the
// same aliases, or `just typecheck` checks imports differently from the
// build. Delete this with tsconfig.check.json once Astro no longer needs
// baseUrl.
const stripDot = (target: string): string => target.replace(/^\.\//, "")

test("tsconfig.check.json resolves the same aliases as tsconfig.json", () => {
  const checkPaths = Object.fromEntries(
    Object.entries(check.compilerOptions.paths).map(([alias, targets]) => [
      alias,
      targets.map(stripDot),
    ]),
  )
  const rootPaths = Object.fromEntries(
    Object.entries(root.compilerOptions.paths).map(([alias, targets]) => [
      alias,
      targets.map(stripDot),
    ]),
  )
  expect(checkPaths).toEqual(rootPaths)
})
