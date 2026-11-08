import type { APIRoute, GetStaticPaths } from "astro"

import {
  buildMarkdownCopy,
  getMarkdownSources,
  type MarkdownSource,
} from "~/utils/markdown-copies"
import { markdownCopyParam, renderMarkdownCopy } from "~/utils/markdown-copy"

/**
 * `<page>.md`: a clean Markdown copy of each post and project that llms.txt
 * lists, such as `/blog/26-10-19-block-latency.md`. The `.md` suffix keeps
 * these paths apart from the HTML routes under `[...blog]` and
 * `code/projects/[...slug]`.
 */
export const getStaticPaths = (async () =>
  (await getMarkdownSources()).map((source) => ({
    params: { path: markdownCopyParam(source.page) },
    props: { source },
  }))) satisfies GetStaticPaths

export const GET: APIRoute<{ source: MarkdownSource }> = async ({ props }) =>
  // No Content-Type: the static build writes a .md file, which Firebase
  // serves by extension as text/markdown; charset=utf-8.
  new Response(renderMarkdownCopy(await buildMarkdownCopy(props.source)))
