import Vuex from "vuex";
import { ACTIONS } from "./actions";
import { MUTATIONS } from "./mutations";
import { getters } from "./getters";
import { defaultState } from "./types";
const createStore = () => new Vuex.Store({
    state: defaultState,
    actions: ACTIONS,
    mutations: MUTATIONS,
    getters,
});
export { createStore };
