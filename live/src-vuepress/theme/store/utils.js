import { get, capitalize, map as lodashMap } from "lodash";
import { toLower, getOr, curry } from "lodash/fp";
/** pluckData (fn): Used to extract page data and transform it, including
 * normalizing tags and categories to proper case and extracting author
 * information.
 * @param blog
 * @param page
 * @returns Page
 * */
const pluckData = curry((blog, page) => ({
    ...page,
    ...page.frontmatter,
    publish: page.frontmatter.publish
        ? new Date(page.frontmatter.publish).getTime()
        : null,
    tags: get(page.frontmatter, "tags", []).map(toLower),
    categories: get(page.frontmatter, "categories", []).map(toLower),
    author: {
        link: get(page.frontmatter, "author.link") || get(blog, "defaultAuthor.link"),
        name: get(page.frontmatter, "author.name") || get(blog, "defaultAuthor.name"),
        gravatar: get(page.frontmatter, "author.gravatar") || get(blog, "defaultAuthor.gravatar"),
    },
}));
const isExternal = (url) => /^https?:\/\//i.test(url);
export const formatPages = (blog, data = []) => data.map(pluckData(blog));
export const formatPage = pluckData;
export const relativePath = (state) => {
    const route = get(state, "route.path", "/");
    const base = get(state, "blog.path", "");
    return route.replace(base, "");
};
export const type = (state) => {
    const path = relativePath(state);
    const type = get(state, "current.type");
    const [group] = path.split("/").filter((tag) => !!tag);
    if (type) {
        return type;
    }
    switch (group) {
        case "tags":
            return "tags";
        case "category":
            return "category";
        case "posts":
            return "posts";
        default:
            return "home";
    }
};
export const category = getOr(null, "route.params.category");
export const tag = getOr(null, "route.params.tag");
export const footer = (state) => 
// TODO: add type for nav
get(state, "blog.footer", []).map((nav) => ({
    ...nav,
    external: isExternal(nav.link),
}));
export const navigation = (state) => 
// TODO: add type for nav
get(state, "blog.nav", []).map((nav) => ({
    ...nav,
    active: state.route.path.split("/").join("") === nav.link.split("/").join(""),
    external: isExternal(nav.link),
}));
/** social:
 * */
export const social = (site) => {
    const channels = get(site, "themeConfig.social", {});
    return (Object.entries(channels).map(([k, v]) => {
        return { type: k, url: v };
    }) ?? []);
};
/** posts:
 * @returns {Array<Page>}
 * */
export const filterPosts = (state) => {
    const pageIdxs = Object.keys(state.index);
    const categoryFn = category;
    const tagFn = tag;
    return pageIdxs
        .map((pageIdx) => state.index[Number(pageIdx)])
        .filter((item) => !!item)
        .filter((item) => item.type === "post")
        .filter((item) => !categoryFn(state) ||
        ~item.categories.map(toLower).indexOf(toLower(categoryFn(state))))
        .filter((item) => !tagFn(state) || ~item.tags.map(toLower).indexOf(toLower(tagFn(state))))
        .sort((a, b) => (a.publish ?? 0) - (b.publish ?? 0))
        .slice(0, state.type === "home" ? 10 : 50);
};
const titleCase = (str) => lodashMap(str.split(" "), capitalize).join(" ");
export const header = (state) => {
    console.debug("DEBUG state: %o", state);
    console.debug("DEBUG state.route.fullPath: %o", state.route.fullPath);
    // console.debug("DEBUG state.posts: %o", state.posts)
    switch (state.type) {
        case "category":
            return {
                showCover: true,
                coverImage: null,
                title: category(state) ? titleCase(category(state)) : `Categories`,
                description: `${state.posts.length} ${state.posts.length === 1 ? "article" : "articles"}`,
            };
        case "tags":
            return {
                showCover: true,
                coverImage: null,
                title: tag(state) ? titleCase(tag(state)) : `Tags`,
                description: `${state.posts.length} ${state.posts.length === 1 ? "article" : "articles"}`,
            };
        case "posts":
            return {
                showCover: false,
                coverImage: null,
                title: `Posts`,
                description: `${state.posts.length} ${state.posts.length === 1 ? "article" : "articles"}`,
            };
        case "home":
            return {
                logo: state.blog.logo,
                showCover: true,
                coverImage: state.blog.cover,
                title: state.blog.title,
                description: state.blog.description,
            };
        default:
            return {
                showCover: false,
                coverImage: null,
                title: null,
                description: null,
            };
    }
};
export const authorImage = (hash) => "//www.gravatar.com/avatar/" + hash + "?s=250&d=mm&r=x";
