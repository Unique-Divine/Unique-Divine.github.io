import { UserConfig } from "@vuepress/types"
import { ThemeConfigGhost } from "../../config"

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
  publish: number | null
  type: string
  tags: string[]
  categories: string[]
  readingTime: string
  author: Author
}

export type Post = Page

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
  link?: string
  name?: string
  gravatar?: string
}

export interface Site {
  title?: string
  description?: string
  base?: string
  defaultAuthor?: string // The type depends on how defaultAuthor is structured
  themeConfig?: UserConfig<ThemeConfigGhost>
  pages?: Page[] // Assuming 'pages' is an array of 'Page' objects
  // Add any other properties used in the site object but not listed here
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

import { Store as VuexStore } from "vuex"

/** Initial state of the Vuex store.
 */
export const defaultState: Partial<RootState> = {
  blog: {
    title: null,
    description: null,
    base: null,
  },
  header: {
    showCover: false,
    coverImage: null,
    title: null,
    description: null,
  },
  nav: [],
  params: {},
  current: {},
  route: {},
  index: [],
  loading: true,
  search: "",
  sidebarOpen: false,
  type: null,
  posts: [],
  footer: [],
  social: [],
  author: null,
  allTags: new Set<string>(),
  allCategories: new Set<string>(),
}

export interface NavItem {
  /** link: route string*/
  link: string
  /** text: display text */
  text: string
}

import { SocialIcons } from "../../config"
export { SocialIcons }

export interface BlogState {
  title?: string | null
  description?: string | null
  base?: string | null
  cover?: string
  footer?: NavItem[] // TODO: type
  logo?: string
  nav?: NavItem[] // TODO: type
  search?: boolean
  social?: SocialIcons
}

export interface HeaderState {
  showCover: boolean
  coverImage?: string | null
  title?: string | null
  description?: string | null
}

/** RootState: Defines the state field for the global Vuex `store`. */
export interface RootState {
  blog: BlogState
  header: HeaderState
  nav: NavItem[] // Specify the type if known, e.g., NavItem[]
  params: Record<string, any> // Use a more specific type if possible
  current: Page | {} // Assuming 'current' is a Page or empty object
  route: Record<string, any> // Use a more specific type if possible
  index: Page[]
  loading: boolean
  search: string
  sidebarOpen: boolean
  type: string | null // Use a more specific type if known
  posts: Page[] // Assuming 'posts' is an array of Page
  footer: any[] // Specify the type if known
  social: any[] // Specify the type if known, e.g., SocialLink[]
  author: Author | null

  allTags: Set<string>
  allCategories: Set<string>

  $withBase: (path: string) => string
}

export type AppStore = VuexStore<RootState>
