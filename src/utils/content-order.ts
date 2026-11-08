/**
 * Orders collection entries by source path, the order legacy collections
 * returned. Loader order is not stable, and the archive and RSS sorts keep
 * this order for entries that share a publish date.
 */
export const byFilePath = <T extends { filePath?: string }>(
  a: T,
  b: T,
): number => {
  const [x, y] = [a.filePath ?? "", b.filePath ?? ""]
  return x < y ? -1 : x > y ? 1 : 0
}

/** Newest first; posts that share a publish date keep source-path order. */
export const newestFirst = <T extends { publishDate: Date; filePath?: string }>(
  a: T,
  b: T,
): number =>
  b.publishDate.valueOf() - a.publishDate.valueOf() || byFilePath(a, b)
