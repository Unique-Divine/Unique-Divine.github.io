import { getOr } from "lodash/fp";
/** getters: Vuex GetterTree<LocalState, RootState>. The second generic arg
 * represents the root state in the Vuex store. In a Vuex store, you can have
 * multiple "modules", and each module has its own local state. The root state
 * is the combination of all module states,which we sometimes call the global
 * state. */
export const getters = {
    blog: getOr({}, "blog"),
    current: getOr({}, "current"),
    index: getOr({}, "index"),
    loading: getOr(false, "loading"),
    params: getOr({}, "params"),
    type: getOr(null, "type"),
    header: getOr(null, "header"),
    posts: getOr([], "posts"),
    footer: getOr([], "footer"),
    nav: getOr([], "nav"),
    social: getOr([], "social"),
    author: getOr(null, "author"),
    allTags: getOr(new Set(), "allTags"),
    allCategories: getOr(new Set(), "allCategories"),
};
