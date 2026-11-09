/**
 * Clean Markdown copies of posts and projects, served at each page's
 * canonical path plus `.md` (https://llmstxt.org). These functions are pure
 * apart from the image resolver the caller passes in;
 * `src/utils/markdown-copies.ts` loads the entries.
 *
 * The body is edited in place by source offsets instead of re-serialized, so
 * the copy keeps the author's Markdown exactly except where it must change:
 * MDX imports, exports, expressions, and JSX are removed or reduced to text,
 * HTML comments are dropped, and site-relative URLs become absolute.
 */
import type { Definition, Html, Image, Link, Nodes, Parent, Root } from "mdast"
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx"
import remarkGfm from "remark-gfm"
import remarkMdx from "remark-mdx"
import remarkParse from "remark-parse"
import { unified } from "unified"

/** Markdown copy path for a page: `/blog/x` becomes `/blog/x.md`. */
export function markdownCopyHref(page: string): string {
  const path = page.replace(/\/+$/, "")
  if (!path.startsWith("/") || path === "")
    throw new Error(`Markdown copies need a non-root page path: ${page}`)
  return `${path}.md`
}

/** Static-path parameter for `src/pages/[...path].md.ts`: `blog/x`. */
export function markdownCopyParam(page: string): string {
  return markdownCopyHref(page).replace(/^\//, "").replace(/\.md$/, "")
}

/** Attributes of a JSX element with literal string values. */
export type JsxAttributes = Record<string, string | true>

/**
 * Replacement for a JSX component, keyed by the module it is imported from.
 * A childless component returns its text; return `undefined` to fall back to
 * the default note. A component with children returns a `ComponentWrap` to
 * keep text from its own markup around the unwrapped content.
 */
export type ComponentText = (
  attributes: JsxAttributes,
  context: { page: string },
) => string | ComponentWrap | undefined

/** Markdown placed before and after a wrapper component's content. */
export interface ComponentWrap {
  before?: string
  after?: string
}

/** Markdown table with escaped cells; numbers are written as given. */
export function markdownTable(
  headers: string[],
  rows: (string | number)[][],
): string {
  const cell = (value: string | number) =>
    String(value)
      .replace(/\s+/g, " ")
      .replace(/([\\|])/g, "\\$1")
  return [
    `| ${headers.map(cell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n")
}

export interface ReduceOptions {
  /** Parse as MDX. Plain Markdown keeps raw HTML; MDX turns it into JSX. */
  mdx: boolean
  /** Absolute canonical URL of the HTML page. */
  page: string
  /** Site origin, such as `https://uniquedivine.com`. */
  site: string
  /**
   * Absolute URL for an image path the copy can't resolve by itself, such as
   * `../../assets/images/x.png`. Return `undefined` when it can't be found;
   * the image is then reduced to its alt text.
   */
  resolveImage?: (url: string) => Promise<string | undefined>
  components?: Record<string, ComponentText>
}

/** Note that stands in for a component that renders no Markdown text. */
export const interactiveNote = (page: string) =>
  `_Interactive content omitted; see [the web page](${page})._`

const markdownParser = unified().use(remarkParse).use(remarkGfm)
const mdxParser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm)

/** Parses Markdown or MDX with source positions. */
export function parseMarkdown(source: string, mdx: boolean): Root {
  return (mdx ? mdxParser : markdownParser).parse(source)
}

/**
 * Absolute URL for a link target. Fragments resolve against the HTML page and
 * root-relative paths against the site; anything else is left as written.
 */
export function absoluteLink(url: string, page: string, site: string): string {
  if (url.startsWith("#")) return `${page}${url}`
  if (url.startsWith("/") && !url.startsWith("//"))
    return new URL(url, site).href
  return url
}

/**
 * Local names bound by `import Name from "module"` and
 * `import { Name } from "module"`, mapped to their module.
 */
export function importedModules(esm: string): Map<string, string> {
  const modules = new Map<string, string>()
  for (const [, clause, module] of esm.matchAll(
    /import\s+([\s\S]+?)\s+from\s+["']([^"']+)["']/g,
  ))
    for (const part of clause.replace(/[{}]/g, ",").split(",")) {
      // `A`, `* as A`, and `B as A` all bind the local name A.
      const local = part
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
      if (local && /^[A-Za-z_$][\w$]*$/.test(local)) modules.set(local, module)
    }
  return modules
}

function jsxAttributes(
  node: MdxJsxFlowElement | MdxJsxTextElement,
): JsxAttributes {
  const attributes: JsxAttributes = {}
  for (const attribute of node.attributes) {
    if (attribute.type !== "mdxJsxAttribute") continue
    if (attribute.value === null || attribute.value === undefined)
      attributes[attribute.name] = true
    else if (typeof attribute.value === "string")
      attributes[attribute.name] = attribute.value
  }
  return attributes
}

/** Removes HTML comments, then makes `src="/x"` and `href="/x"` absolute. */
export function cleanHtml(html: string, site: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /\b(src|href)=(["'])(\/(?!\/)[^"']*)\2/g,
      (_, attribute: string, quote: string, path: string) =>
        `${attribute}=${quote}${new URL(path, site).href}${quote}`,
    )
}

const escapeAlt = (alt: string) => alt.replace(/([\\[\]])/g, "\\$1")
export const imageMarkdown = (
  alt: string,
  url: string,
  title?: string | null,
) =>
  `![${escapeAlt(alt)}](${url}${
    title ? ` "${title.replace(/"/g, '\\"')}"` : ""
  })`

interface Edit {
  start: number
  end: number
  text: string
}

const start = (node: Nodes) => node.position?.start.offset ?? 0
const end = (node: Nodes) => node.position?.end.offset ?? 0

/**
 * Reduces a Markdown or MDX body to plain Markdown. See the module comment
 * for what changes.
 */
export async function reduceMarkdown(
  source: string,
  options: ReduceOptions,
): Promise<string> {
  const { page, site } = options
  const tree = parseMarkdown(source, options.mdx)
  const modules = new Map<string, string>()
  const edits: Edit[] = []

  /** Index just past the end of the line that holds `index`. */
  const lineEnd = (index: number) => {
    const newline = source.indexOf("\n", index)
    return newline < 0 ? source.length : newline + 1
  }
  /** A line with only container markup: list indentation or `>` markers. */
  const isPrefix = (text: string) => /^[ \t>]*$/.test(text)

  /**
   * The list indentation or `>` markers before a block on its first line, or
   * `undefined` when the line holds other text before it.
   */
  const containerPrefix = (node: Nodes): string | undefined => {
    const from = start(node)
    const prefix = source.slice(source.lastIndexOf("\n", from - 1) + 1, from)
    return isPrefix(prefix) ? prefix : undefined
  }
  /** Puts `prefix` before each line of `text` after the first. */
  const withPrefix = (text: string, prefix = "") =>
    text
      .split("\n")
      .map((line, i) =>
        i === 0 ? line : line ? prefix + line : prefix.trimEnd(),
      )
      .join("\n")

  /**
   * Replaces a block with `text`, or removes it. Inside a list item or
   * blockquote, replacement lines get the block's own prefix, and a removal
   * takes the block's whole lines plus the blank lines after it, so the
   * following line keeps its indentation and the container stays intact.
   */
  const removeFlow = (node: Nodes, text = "") => {
    const from = start(node)
    const to = end(node)
    const lineStart = source.lastIndexOf("\n", from - 1) + 1
    const prefix = containerPrefix(node)
    if (text) {
      edits.push({ start: from, end: to, text: withPrefix(text, prefix) })
      return
    }
    const rest = lineEnd(to)
    if (prefix === undefined || !/^[ \t]*\r?\n?$/.test(source.slice(to, rest))) {
      edits.push({ start: from, end: to, text: "" })
      return
    }
    let stop = rest
    while (stop < source.length) {
      const next = lineEnd(stop)
      if (!isPrefix(source.slice(stop, next).replace(/\r?\n$/, ""))) break
      stop = next
    }
    edits.push({ start: lineStart, end: stop, text: "" })
  }

  const resolveImage = async (url: string): Promise<string | undefined> => {
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith("/") && !url.startsWith("//"))
      return new URL(url, site).href
    return options.resolveImage?.(url)
  }

  const image = async (alt: string, url: string, title?: string | null) => {
    const resolved = url ? await resolveImage(url) : undefined
    return resolved ? imageMarkdown(alt, resolved, title) : alt
  }

  const jsx = async (node: MdxJsxFlowElement | MdxJsxTextElement) => {
    const flow = node.type === "mdxJsxFlowElement"
    const children = node.children as Nodes[]
    const attributes = jsxAttributes(node)
    const name = node.name ?? ""
    const module = modules.get(name.split(".")[0])
    const mapped = module
      ? options.components?.[module]?.(attributes, { page })
      : undefined
    if (children.length) {
      // Unwrap: replace the opening and closing tags, keep the content.
      // In a flow wrapper inside a list item or blockquote, the added lines
      // and the blank line between them and the content keep its prefix.
      const wrap = typeof mapped === "object" ? mapped : {}
      const prefix = flow ? containerPrefix(node) : undefined
      const gap = flow ? `\n${(prefix ?? "").trimEnd()}\n${prefix ?? ""}` : ""
      edits.push({
        start: start(node),
        end: start(children[0]),
        text: wrap.before ? withPrefix(wrap.before, prefix) + gap : "",
      })
      edits.push({
        start: end(children.at(-1)!),
        end: end(node),
        text: wrap.after ? gap + withPrefix(wrap.after, prefix) : "",
      })
      for (const child of children) await visit(child, node as Parent)
      return
    }
    let text = typeof mapped === "string" ? mapped : undefined
    if (text === undefined) {
      const { alt, src } = attributes
      if (typeof alt === "string")
        text = await image(alt, typeof src === "string" ? src : "")
      else if (flow && /^[A-Z]/.test(name)) text = interactiveNote(page)
      else text = ""
    }
    if (flow) removeFlow(node, text)
    else edits.push({ start: start(node), end: end(node), text })
  }

  const visit = async (node: Nodes, parent?: Parent): Promise<void> => {
    switch (node.type) {
      case "code":
      case "inlineCode":
        return
      case "mdxjsEsm":
      case "mdxFlowExpression":
        return removeFlow(node)
      case "mdxTextExpression":
        edits.push({ start: start(node), end: end(node), text: "" })
        return
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement":
        return jsx(node)
      case "html": {
        const html = node as Html
        const cleaned = cleanHtml(html.value, site)
        if (cleaned === html.value) return
        const inline = parent?.type === "paragraph"
        if (!cleaned.trim() && !inline) return removeFlow(node)
        edits.push({ start: start(node), end: end(node), text: cleaned })
        return
      }
      case "image": {
        const { alt, url, title } = node as Image
        edits.push({
          start: start(node),
          end: end(node),
          text: await image(alt ?? "", url, title),
        })
        return
      }
      case "definition": {
        const { label, identifier, url, title } = node as Definition
        const absolute = absoluteLink(url, page, site)
        if (absolute === url) return
        edits.push({
          start: start(node),
          end: end(node),
          text:
            `[${label ?? identifier}]: ${absolute}` +
            (title ? ` "${title.replace(/"/g, '\\"')}"` : ""),
        })
        return
      }
      case "link": {
        const link = node as Link
        const absolute = absoluteLink(link.url, page, site)
        const text = source.slice(start(node), end(node))
        const at = text.lastIndexOf("](")
        if (absolute !== link.url && at >= 0) {
          const offset = text.startsWith(`<${link.url}`, at + 2)
            ? at + 3
            : at + 2
          if (text.startsWith(link.url, offset))
            edits.push({
              start: start(node) + offset,
              end: start(node) + offset + link.url.length,
              text: absolute,
            })
        }
        break
      }
    }
    if ("children" in node)
      for (const child of (node as Parent).children as Nodes[])
        await visit(child, node as Parent)
  }

  // Imports come first in MDX, but collect them all before visiting.
  for (const node of tree.children)
    if (node.type === "mdxjsEsm")
      for (const [name, module] of importedModules(node.value))
        modules.set(name, module)
  for (const node of tree.children) await visit(node)

  // Apply from the end. A block removal may extend over blank lines that a
  // later edit, such as a closing tag, also removes; clamp it to that edit.
  let out = source
  let limit = source.length
  for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end)) {
    const stop = Math.min(edit.end, limit)
    out = out.slice(0, edit.start) + edit.text + out.slice(stop)
    limit = edit.start
  }
  return out.trim() + "\n"
}

export interface MarkdownCopy {
  title: string
  /** Absolute canonical URL of the HTML page. */
  url: string
  publishDate?: Date
  updateDate?: Date
  /** Body already reduced by `reduceMarkdown`. */
  body: string
}

const day = (date: Date) => date.toISOString().slice(0, 10)

/**
 * The copy's file contents: an H1 title, a line with the HTML page's URL and
 * dates, a blank line, then the body.
 */
export function renderMarkdownCopy(copy: MarkdownCopy): string {
  const facts = [
    `Web page: ${copy.url}`,
    ...(copy.publishDate ? [`Published ${day(copy.publishDate)}`] : []),
    ...(copy.updateDate ? [`Updated ${day(copy.updateDate)}`] : []),
  ]
  return [
    `# ${copy.title.replace(/\s+/g, " ").trim()}`,
    "",
    facts.join(" · "),
    "",
    copy.body.trim(),
    "",
  ].join("\n")
}

/**
 * Lines of Markdown outside fenced code blocks, for checks that must ignore
 * code samples.
 */
export function proseLines(markdown: string): string[] {
  const lines: string[] = []
  let fence: string | undefined
  for (const line of markdown.split("\n")) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)?.[1]
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length)
        fence = undefined
      continue
    }
    if (marker) {
      fence = marker
      continue
    }
    lines.push(line)
  }
  return lines
}

/** Prose lines that still hold MDX syntax: ESM statements or JSX tags. */
export function mdxLeftovers(markdown: string): string[] {
  return proseLines(markdown).filter(
    (line) =>
      /^(import|export)\s/.test(line) ||
      /<\/?[A-Z][A-Za-z.]*[\s/>]/.test(line.replace(/`[^`]*`/g, "")),
  )
}
