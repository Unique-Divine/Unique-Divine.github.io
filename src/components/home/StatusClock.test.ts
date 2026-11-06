import { describe, expect, test } from "bun:test"

import { driftCpu } from "~/components/home/StatusClock"

describe("driftCpu", () => {
  test("moves at most 0.6 points per tick", () => {
    expect(driftCpu(5, () => 1)).toBeCloseTo(5.6)
    expect(driftCpu(5, () => 0)).toBeCloseTo(4.4)
    expect(driftCpu(5, () => 0.5)).toBeCloseTo(5)
  })

  test("reflects off the range edges", () => {
    expect(driftCpu(0.3, () => 0)).toBeCloseTo(0.7)
    expect(driftCpu(9.8, () => 1)).toBeCloseTo(9.6)
  })

  test("stays within 0.2 to 10 over many ticks", () => {
    let cpu = 3.4
    for (let i = 0; i < 10_000; i++) {
      cpu = driftCpu(cpu)
      expect(cpu).toBeGreaterThanOrEqual(0.2)
      expect(cpu).toBeLessThanOrEqual(10)
    }
  })
})
