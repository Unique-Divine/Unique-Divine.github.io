import Vuex from "vuex"
import { sync } from "vuex-router-sync"

import { createStore } from "./store"
import types from "./store/types"

import Layout from "./Layout"
import MarkdownIt from "markdown-it"

export default ({ Vue, options, router }) => {
  Vue.use(Vuex)

  const store = createStore()
  sync(store, router)

  console.debug("DEBUG obj: %o", router)
  router.addRoutes([
    { path: "/category/:category?", component: Layout },
    { path: "/posts/", component: Layout },
    { path: "/tags/:tag?", component: Layout },
    { path: "/tags/", component: Layout },
    { path: "/category/", component: Layout },
  ])

  router.beforeResolve((to, _from, next) => {
    // If this isn't an initial page load.
    if (to.name) {
      // Start the route progress bar.
      store.commit(types.LOAD_START)
    }

    next()
  })

  router.afterEach(() => {
    // Complete the animation of the route progress bar.
    store.commit(types.LOAD_END)
  })

  options.store = store
  Vue.mixin({
    methods: {
      md: (string) => {
        const md = new MarkdownIt({ html: true, linkify: true })
        return `<div>${md.renderInline(string)}</div>`
      },
    },
  })
}
