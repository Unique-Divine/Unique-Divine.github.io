import Vuex from "vuex";
import { sync } from "vuex-router-sync";
import { createStore } from "./store";
import types from "./store/types";
// @ts-ignore
import Layout from "./Layout";
// @ts-ignore
import NotFound from "./NotFound.vue";
import MarkdownIt from "markdown-it";
export default ({ Vue, options, router, }) => {
    Vue.use(Vuex);
    const store = createStore();
    sync(store, router);
    router.addRoutes([
        { path: "/category/:category?", component: Layout },
        { path: "/posts/", component: Layout },
        { path: "/tags/:tag?", component: Layout },
        { path: "*", component: NotFound },
    ]);
    router.beforeResolve((to, _from, next) => {
        // If this isn't an initial page load.
        if (to.name) {
            // Start the route progress bar.
            store.commit(types.LOAD_START);
        }
        next();
    });
    router.afterEach(() => {
        // Complete the animation of the route progress bar.
        store.commit(types.LOAD_END);
    });
    options.store = store;
    /** Apply a mixin globally, which affects every Vue instance created
     * afterwards. This can be used by plugin authors to inject custom behavior
     * into components.  */
    Vue.mixin({
        methods: {
            md: (str) => {
                const md = new MarkdownIt({ html: true, linkify: true });
                return `<div>${md.renderInline(str)}</div>`;
            },
        },
    });
};
