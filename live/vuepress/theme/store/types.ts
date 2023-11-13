/** TODO: doc Page: primary state variable used throughout the application. */
export interface Page {
  title: string
  frontmatter: Frontmatter
  regularPath: string
  relativePath: string
  key: string
  path: string
  headers: Header[]
  image?: string
  /** publish is always a timestamp since it's converted using `getTime()` if it
   * exists */
  publish: number
  type: string
  tags: string[]
  categories: string[]
  readingTime: string
  author: Author
}

export interface Frontmatter {
  title: string
  image: string
  publish?: string
  type: string
  tags?: string[]
  categories?: string[]
  readingTime?: string
  author?: Partial<Author> // Partial because not all properties may be present
}

export interface Author {
  link: string
  name: string
  gravatar: string
}

/**
 * @property level: Heading level. Ex: 1 for `<h1>`, 4 for `<h4>`.
 * @property title: Raw text that makes up the heading.
 * @property slug: ID of the element on the DOM.
 *
 * Example:
 * ```js
 * {
 *   "level": 2,
 *   "title": "§ — Noteworthy open-source code",
 *   "slug": "§-noteworthy-open-source-code"
 * }
 * ```
 **/
export interface Header {
  level: number
  title: string
  slug: string
}

const types: MutationType[] = [
  "SITE_UPDATE",
  "PAGE_UPDATE",
  "TOGGLE_SIDEBAR",
  "LOAD_START",
  "LOAD_END",
  "SEARCH",
  "ROUTER_PARAMS",
]

export type MutationType =
  | "SITE_UPDATE"
  | "PAGE_UPDATE"
  | "TOGGLE_SIDEBAR"
  | "LOAD_START"
  | "LOAD_END"
  | "SEARCH"
  | "ROUTER_PARAMS"

/**
 * registeredTypesMap:
 *
 * The `reduce` fn here takes an initial value for `result`, which is the empty
 * object `{}`, then iterates over each element of `types`, creating a new field
 * on the `result` object where the key is the `type` string, and the value is
 * also that `type` string.
 *
 * The `registeredTypesMap` will look like this:
 *
 * ```js
 * {
 *    "SITE_UPDATE": "SITE_UPDATE",
 *    "PAGE_UPDATE": "PAGE_UPDATE",
 *    "TOGGLE_SIDEBAR": "TOGGLE_SIDEBAR",
 *    // ...
 *  }
 * ```
 **/
export const MUTATION_TYPE: { [key: string]: MutationType } = types.reduce(
  (result, type) => ({ ...result, [type]: type }),
  {},
)

export default MUTATION_TYPE
