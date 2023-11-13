import Vuex from "vuex";
import actions from "./actions";
// TODO: convert mutations to TS
import { MUTATIONS } from "./mutations";
// TODO: convert getters to TS
import getters from "./getters";
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
};
const state = defaultState;
const mutations = MUTATIONS;
const createStore = () => new Vuex.Store({ state, actions, mutations, getters });
export { createStore };
