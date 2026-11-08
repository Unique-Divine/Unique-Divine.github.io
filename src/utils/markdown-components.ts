import { blockLatencyComponents } from "~/components/research/block-latency/markdown"

import type { ComponentText } from "./markdown-copy"

/**
 * Components whose output Markdown copies keep, keyed by the module an MDX
 * file imports them from. Other childless components become a note, and
 * other wrappers unwrap to their content.
 */
export function markdownComponents(
  site: string,
): Record<string, ComponentText> {
  return { ...blockLatencyComponents(site) }
}
