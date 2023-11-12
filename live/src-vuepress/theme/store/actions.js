/** actions.js: Defined the Vuex actions. */
import { MUTATION_TYPE } from "./types";
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
export const ACTIONS = {
    updateSite: ({ commit }, site) => commit(MUTATION_TYPE.SITE_UPDATE, site),
    updatePage: ({ commit }, page) => {
        commit(MUTATION_TYPE.PAGE_UPDATE, page);
    },
    updateParams: ({ commit }, params) => {
        commit(MUTATION_TYPE.ROUTER_PARAMS, params);
    },
    searchInput: ({ commit }, { target }) => {
        commit(MUTATION_TYPE.SEARCH, target.value);
    },
};
export const actionTypes = () => {
    const set = new Set();
    Object.keys(ACTIONS).forEach((actionType) => set.add(actionType));
    return set;
};
export default ACTIONS;
