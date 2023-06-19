/* actions.js
 *
 * The actions.js file defines the Vuex actions. Actions are functions that can
 * be "dispatched" to trigger mutations to state. Actions can contain 
 * asynchronous operations.
 *
 * The `commit` function is provided by the Vuex store's context to be
 * used in action functions to commit mutations.
 */
import types from './types'


export default ({
  updateSite: ({ commit }, site) => commit(types.SITE_UPDATE, site),
  updatePage: ({ commit }, page) => commit(types.PAGE_UPDATE, page),
  updateParams: ({ commit }, params) => commit(types.ROUTER_PARAMS, params),
  searchInput: ({ commit }, { target }) => {
    commit(types.SEARCH, target.value)
  }
})
