/* mutations.js
 *
 * This mutations.js file defines Vuex mutations. Mutations are responsible for
 * the state in a deterministic, synchronous manner. Each of the fields
 * exported defines a mutation. For example, the functions mapped by
 * "types.SITE_UPDATE" and "types.PAGE_UPDATE" are mutations.
 */
import { pick, get } from "lodash"

import { MUTATION_TYPE } from "./types"
import {
  formatPages,
  formatPage,
  type,
  header,
  posts,
  footer,
  social,
  navigation,
} from "./utils"

export default {
  [MUTATION_TYPE.SITE_UPDATE]: (state, site) => {
    const themeConfig = get(site, "themeConfig", {})
    const siteConfig = pick(site, ["title", "description", "base", "defaultAuthor"])

    state.blog = Object.assign({}, siteConfig, themeConfig)
    state.index = formatPages(state.blog, get(site, "pages", []))
    state.footer = footer(state)
    state.social = social(site)
  },

  [MUTATION_TYPE.PAGE_UPDATE]: (state, page) => {
    state.current = formatPage(state.blog, page)
  },

  [MUTATION_TYPE.ROUTER_PARAMS]: (state, params) => {
    const postDate = (post) => new Date(post.publish)

    state.params = params
    state.posts = posts(state).sort((a, b) => postDate(b) - postDate(a))
    state.nav = navigation(state)
    state.type = type(state)
    state.header = header(state)
  },

  [MUTATION_TYPE.TOGGLE_SIDEBAR]: (state, sidebarState) => {
    state.sidebarOpen = sidebarState
  },

  [MUTATION_TYPE.LOAD_START]: (state) => {
    state.loading = true
  },

  [MUTATION_TYPE.LOAD_END]: (state) => {
    state.loading = false
  },

  [MUTATION_TYPE.SEARCH]: (state, query) => {
    state.search = query
  },
}
