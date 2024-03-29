/* mutations.js
 *
 * This mutations.js file defines Vuex mutations. Mutations are responsible for
 * updating the state in a deterministic, synchronous manner. Each of the fields
 * exported defines a mutation (fn). For example, the functions mapped by
 * "types.SITE_UPDATE" and "types.PAGE_UPDATE" are mutations.
 */
import { pick, get } from "lodash";
import { MUTATION_TYPE } from "./types";
import { formatPages, formatPage, type, header, filterPosts, footer, social, navigation, } from "./utils"; // @ts-ignore
/** MUTATIONS: Vuex mutations. Responsible for updating the state in a deterministic,
 * synchronous manner. Each of object field values defines a mutation (fn)
 * */
export const MUTATIONS = {
    [MUTATION_TYPE.SITE_UPDATE]: (state, site) => {
        const themeConfig = get(site, "themeConfig", {});
        const siteConfig = pick(site, ["title", "description", "base", "defaultAuthor"]);
        state.blog = Object.assign({}, siteConfig, themeConfig);
        state.index = formatPages(state.blog, get(site, "pages", []));
        state.footer = footer(state);
        state.social = social(site);
    },
    [MUTATION_TYPE.PAGE_UPDATE]: (state, page) => {
        state.current = formatPage(state.blog, page);
    },
    [MUTATION_TYPE.ROUTER_PARAMS]: (state, params) => {
        const postTime = (post) => new Date(post.publish).getTime();
        state.params = params;
        const posts = filterPosts(state);
        state.posts = posts.sort((a, b) => postTime(b) - postTime(a));
        state.posts.forEach((post) => {
            post.tags.forEach((tag) => state.allTags.add(tag));
            post.categories.forEach((category) => state.allCategories.add(category));
        });
        state.nav = navigation(state);
        state.type = type(state);
        state.header = header(state);
    },
    [MUTATION_TYPE.TOGGLE_SIDEBAR]: (state, sidebarState) => {
        state.sidebarOpen = sidebarState;
    },
    [MUTATION_TYPE.LOAD_START]: (state) => {
        state.loading = true;
    },
    [MUTATION_TYPE.LOAD_END]: (state) => {
        state.loading = false;
    },
    [MUTATION_TYPE.SEARCH]: (state, query) => {
        state.search = query;
    },
};
