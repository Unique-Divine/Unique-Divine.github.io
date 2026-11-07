import { describe, expect, test } from "bun:test"

import {
  blockArtToRects,
  CLAUDE_CODE_MARK,
} from "~/components/home/blockArt"

const key = ({ x, y }: { x: number; y: number }) => `${x},${y}`

describe("block art to rects", () => {
  test("maps each glyph to its filled quadrants", () => {
    expect(blockArtToRects("█").rects.map(key)).toEqual([
      "0,0",
      "1,0",
      "0,1",
      "1,1",
    ])
    expect(blockArtToRects("▐").rects.map(key)).toEqual(["1,0", "1,1"])
    expect(blockArtToRects("▌").rects.map(key)).toEqual(["0,0", "0,1"])
    expect(blockArtToRects("▛").rects.map(key)).toEqual(["0,0", "1,0", "0,1"])
    expect(blockArtToRects("▜").rects.map(key)).toEqual(["0,0", "1,0", "1,1"])
    expect(blockArtToRects("▝").rects.map(key)).toEqual(["1,0"])
    expect(blockArtToRects("▘").rects.map(key)).toEqual(["0,0"])
  })

  test("offsets cells by column and row; spaces stay empty", () => {
    const art = blockArtToRects(" ▘\n▝")
    expect(art.cols).toBe(2)
    expect(art.rows).toBe(2)
    expect(art.rects.map(key)).toEqual(["2,0", "1,2"])
  })

  test("the Claude Code mark is 9 cells by 3 rows and symmetric", () => {
    const art = blockArtToRects(CLAUDE_CODE_MARK)
    expect(art.cols).toBe(9)
    expect(art.rows).toBe(3)
    const width = art.cols * 2
    const cells = new Set(art.rects.map(key))
    for (const { x, y } of art.rects) {
      expect(cells.has(key({ x: width - 1 - x, y }))).toBe(true)
    }
  })
})
