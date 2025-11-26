declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}


// TODO: failed experiment
//
// import { ComponentCustomProperties as VueCCP } from "vue"
// import { Store } from "vuex"
// import { Page } from "./.vuepress/theme/store/types"
// declare module "@vue/runtime-core" {
//
//   interface State {
//     current: Page
//   }
//   
//   interface ComponentCustomProperties extends VueCCP {
//     $store: Store<State>
//     $withBase: (path: string) => string
//   }
// }
