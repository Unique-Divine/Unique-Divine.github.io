import Vuex from "vuex"

import actions from "./actions"
// TODO: convert mutations to TS
import { MUTATIONS } from "./mutations"
// TODO: convert getters to TS
import getters from "./getters"
import { Author, Page } from "./types"
import { SocialIcons } from "../../config"

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

export interface NavItem {
  /** link: route string*/
  link: string
  /** text: display text */
  text: string
}

export interface HeaderState {
  showCover: boolean
  coverImage?: string | null
  title?: string | null
  description?: string | null
}

export interface RootState {
  blog: BlogState
  header: HeaderState
  nav: any[] // Specify the type if known, e.g., NavItem[]
  params: Record<string, any> // Use a more specific type if possible
  current: Page | {} // Assuming 'current' is a Page or empty object
  route: Record<string, any> // Use a more specific type if possible
  index: Page[] // Specify the type if known
  loading: boolean
  search: string
  sidebarOpen: boolean
  type: string | null // Use a more specific type if known
  posts: Page[] // Assuming 'posts' is an array of Page
  footer: any[] // Specify the type if known
  social: any[] // Specify the type if known, e.g., SocialLink[]
  author: Author | null
}

const state = defaultState as any
const mutations = MUTATIONS as any
const createStore = () => new Vuex.Store({ state, actions, mutations, getters })

export { createStore }
