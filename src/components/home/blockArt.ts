/**
 * Converts Unicode block-element art into rectangles, so terminal logos render
 * the same in any font. Each character cell is a 2×2 grid of quadrants; a
 * quadrant rect is one unit square, and a cell is 2 units wide and 2 tall.
 */

/** Filled quadrants per glyph, in order: upper left, upper right, lower left, lower right. */
const QUADRANTS: Record<string, [boolean, boolean, boolean, boolean]> = {
  "█": [true, true, true, true],
  "▀": [true, true, false, false],
  "▄": [false, false, true, true],
  "▌": [true, false, true, false],
  "▐": [false, true, false, true],
  "▘": [true, false, false, false],
  "▝": [false, true, false, false],
  "▖": [false, false, true, false],
  "▗": [false, false, false, true],
  "▚": [true, false, false, true],
  "▞": [false, true, true, false],
  "▛": [true, true, true, false],
  "▜": [true, true, false, true],
  "▙": [true, false, true, true],
  "▟": [false, true, true, true],
}

export interface BlockRect {
  x: number
  y: number
}

export interface BlockArt {
  /** Widest line, in character cells. */
  cols: number
  rows: number
  /** One unit square per filled quadrant. */
  rects: BlockRect[]
}

/** Parses block-element art; spaces and unknown characters are empty cells. */
export function blockArtToRects(art: string): BlockArt {
  const lines = art.split("\n")
  const rects: BlockRect[] = []
  lines.forEach((line, row) => {
    Array.from(line).forEach((char, col) => {
      const quadrants = QUADRANTS[char]
      if (!quadrants) return
      quadrants.forEach((filled, q) => {
        if (filled) rects.push({ x: col * 2 + (q % 2), y: row * 2 + (q >> 1) })
      })
    })
  })
  const cols = Math.max(0, ...lines.map((line) => Array.from(line).length))
  return { cols, rows: lines.length, rects }
}

/** The Claude Code mark as it appears in the terminal header. */
export const CLAUDE_CODE_MARK = " ▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝"
