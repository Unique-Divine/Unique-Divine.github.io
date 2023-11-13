import Vuex from "vuex"

import state from "./state"
import actions from "./actions"
import mutations from "./mutations"
import getters from "./getters"

const createStore = () => new Vuex.Store({ state, actions, mutations, getters })
export { createStore }
