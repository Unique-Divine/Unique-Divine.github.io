/** actions.js: Defined the Vuex actions. */
import { MUTATION_TYPE, Page, Site } from "./types"
import { Commit } from "vuex"

/** This object defines the Vuex actions. Actions are functions that can
 * be "dispatched" to trigger mutations to state. They can contain
 * asynchronous operations.
 *
 * The `commit` function is provided by the Vuex store's context to be
 * used in action functions to commit mutations. When you dispatch an action by
 * calling `this.$store.dispatch("actionName", payload)`, Vuex binds the
 * `commit` func to the store instance automatically, and the `commit` call
 * applies the mutation to the store's state.
 *
 * It's very similar to Redux.
 */
export const ACTIONS: {
  [actionType: string]: Action
} = {
  updateSite: ({ commit }: { commit: Commit }, site: Site) =>
    commit(MUTATION_TYPE.SITE_UPDATE, site),
  updatePage: ({ commit }, page: Page) => {
    commit(MUTATION_TYPE.PAGE_UPDATE, page)
  },
  updateParams: ({ commit }, params) => {
    commit(MUTATION_TYPE.ROUTER_PARAMS, params)
  },
  searchInput: ({ commit }, { target }: { target: { value: string } }) => {
    commit(MUTATION_TYPE.SEARCH, target.value)
  },
}

export const actionTypes = (): Set<string> => {
  const set = new Set<string>()
  Object.keys(ACTIONS).forEach((actionType) => set.add(actionType))
  return set
}

/** Action: Vuex action. Actions are functions that you dispatch from your Vue
 * components. They can contain asynchronous operations and commit one or more
 * mutations. They are dispatched by their name (which could be seen as the
 * action type) and receive a context object that contains methods like
 * `commit` and `state`. */
export type Action = (obj: { commit: Commit }, ...args: any[]) => void

export default ACTIONS
