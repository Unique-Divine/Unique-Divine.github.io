const types = [
    "SITE_UPDATE",
    "PAGE_UPDATE",
    "TOGGLE_SIDEBAR",
    "LOAD_START",
    "LOAD_END",
    "SEARCH",
    "ROUTER_PARAMS",
];
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
export const MUTATION_TYPE = types.reduce((result, type) => ({ ...result, [type]: type }), {});
export default MUTATION_TYPE;
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
    allTags: new Set(),
    allCategories: new Set(),
};
