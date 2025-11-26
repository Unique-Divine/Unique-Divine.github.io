/* mutations.js
 *
 * This mutations.js file defines Vuex mutations. Mutations are responsible for
 * updating the state in a deterministic, synchronous manner. Each of the fields
 * exported defines a mutation (fn). For example, the functions mapped by
 * "types.SITE_UPDATE" and "types.PAGE_UPDATE" are mutations.
 */
import { pick, get } from "lodash"
import { RootState } from "./types"

import { MUTATION_TYPE, Page, Post, Site } from "./types"

import {
  formatPages,
  formatPage,
  type,
  header,
  filterPosts,
  footer,
  social,
  navigation,
} from "./utils" // @ts-ignore

import { MutationTree } from "vuex"

/** MUTATIONS: Vuex mutations. Responsible for updating the state in a deterministic,
 * synchronous manner. Each of object field values defines a mutation (fn)
 * */
export const MUTATIONS: MutationTree<RootState> = {
  [MUTATION_TYPE.SITE_UPDATE]: (state: RootState, site: Site) => {
    const themeConfig = get(site, "themeConfig", {})
    const siteConfig = pick(site, ["title", "description", "base", "defaultAuthor"])

    state.blog = Object.assign({}, siteConfig, themeConfig)
    state.index = formatPages(state.blog, get(site, "pages", []))
    state.footer = footer(state)
    state.social = social(site)
  },

  [MUTATION_TYPE.PAGE_UPDATE]: (state: RootState, page: Page) => {
    state.current = (formatPage as any)(state.blog, page)
  },

  [MUTATION_TYPE.ROUTER_PARAMS]: (state: RootState, params: Record<string, any>) => {
    const postTime = (post: Post) => new Date(post.publish!).getTime()

    state.params = params
    const posts: Page[] = filterPosts(state)
    state.posts = posts.sort((a, b) => postTime(b) - postTime(a))
    state.posts.forEach((post) => {
      post.tags.forEach((tag) => state.allTags.add(tag))
      post.categories.forEach((category) => state.allCategories.add(category))
    })
    state.nav = navigation(state)
    state.type = type(state)
    state.header = header(state)
  },

  [MUTATION_TYPE.TOGGLE_SIDEBAR]: (state: RootState, sidebarState: boolean) => {
    state.sidebarOpen = sidebarState
  },

  [MUTATION_TYPE.LOAD_START]: (state: RootState) => {
    state.loading = true
  },

  [MUTATION_TYPE.LOAD_END]: (state: RootState) => {
    state.loading = false
  },

  [MUTATION_TYPE.SEARCH]: (state: RootState, query: string) => {
    state.search = query
  },
}
