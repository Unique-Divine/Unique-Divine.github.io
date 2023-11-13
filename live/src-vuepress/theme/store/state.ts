// state.ts: defines the state field for the global Vuex `store`.

import { Author, Page } from "./types"

/** Initial state of the Vuex store.
 */
export const defaultState = {
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
}

export interface BlogState {
  title: string | null
  description: string | null
  base: string | null
}

export interface HeaderState {
  showCover: boolean
  coverImage: string | null
  title: string | null
  description: string | null
}

export interface RootState {
  blog: BlogState
  header: HeaderState
  nav: any[] // Specify the type if known, e.g., NavItem[]
  params: Record<string, any> // Use a more specific type if possible
  current: Page | {} // Assuming 'current' is a Page or empty object
  route: Record<string, any> // Use a more specific type if possible
  index: any[] // Specify the type if known
  loading: boolean
  search: string
  sidebarOpen: boolean
  type: string | null // Use a more specific type if known
  posts: Page[] // Assuming 'posts' is an array of Page
  footer: any[] // Specify the type if known
  social: any[] // Specify the type if known, e.g., SocialLink[]
  author: Author | null
}

export default defaultState
