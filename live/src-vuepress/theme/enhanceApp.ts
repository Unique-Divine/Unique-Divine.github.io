import Vuex, { CustomVue } from "vuex"
import { sync } from "vuex-router-sync"

import { createStore } from "./store"
import types from "./store/types"

// @ts-ignore
import Layout from "./Layout"
// @ts-ignore
import NotFound from "./NotFound.vue"
import MarkdownIt from "markdown-it"
import VueRouter from "vue-router"

export default ({
  Vue,
  options,
  router,
}: {
  Vue: CustomVue
  options: any // Options for the root Vue instance
  router: VueRouter // Router instance for the app
  siteData: any // siteData: Site metadata
  isServer: boolean // isServer: is the enhancement applied in server rendering or client
}) => {
  Vue.use(Vuex)

  const store = createStore()
  sync(store, router)

  router.addRoutes([
    { path: "/category/:category?", component: Layout },
    { path: "/posts/", component: Layout },
    { path: "/tags/:tag?", component: Layout },
    { path: "*", component: NotFound },
  ])
  console.debug("DEBUG router obj: %o", router)

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
  /** Apply a mixin globally, which affects every Vue instance created
   * afterwards. This can be used by plugin authors to inject custom behavior
   * into components.  */
  Vue.mixin({
    methods: {
      md: (str: string) => {
        const md = new MarkdownIt({ html: true, linkify: true })
        return `<div>${md.renderInline(str)}</div>`
      },
    },
  })
}
