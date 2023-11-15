import Vuex from "vuex"

import { ACTIONS } from "./actions"
import { MUTATIONS } from "./mutations"
import { getters } from "./getters"

import { defaultState, RootState } from "./types"

const createStore = () =>
  new Vuex.Store<RootState>({
    state: defaultState as RootState,
    actions: ACTIONS,
    mutations: MUTATIONS,
    getters,
  })

export { createStore }
