import { expect, test } from "bun:test"

import {
  coverEntries,
  validateSkillCovers,
} from "../../scripts/skill-covers.mjs"

test("every public skill and the catalogue has a current 1200 by 630 cover", async () => {
  expect(await validateSkillCovers()).toBe((await coverEntries()).length)
})
