import { defineConfig4CustomTheme } from "vuepress/config";
// import * as markdownItKatex from "markdown-it-katex"
const socialLinks = {
    github: "https://github.com/Unique-Divine",
    twitter: "https://twitter.com/DeusExUnicus",
    linkedin: "https://www.linkedin.com/in/unique-divine/",
    discord: "https://discord.gg/HFvbn7Wtud",
};
// Used with themeConfig.nav
const navCategory = (path) => `/category/${path}`;
const navPage = (path) => `/page/${path}`;
const navTag = (path) => `/tags/${path}`;
const metaHead = {
    descr: "Creator, meme connoisseur, programmer that makes music, Rust propagandist, Co-Founder of Nibiru Chain",
    url: "https://uniquedivine.blog",
    twitter: "@DeusExUnicus",
};
/** ------------------------ home-site/blog ------------------------
 * Please leave the zombie comments. They serve as useful documentation for
 * how to edit the vuepress theme.
 *
 * TODO Add some of this information to the README, or a HACKING.md file.
 * @see Vuepress Config Reference: https://vuepress.vuejs.org/config/
 * */
export default defineConfig4CustomTheme({
    title: "Unique Divine",
    base: "/",
    /** The "theme" field of the vuepress config determines which theme to import.
     * We have this commented out because this site uses a local theme, where we
     * can fully customize the underlying components and CSS.
     * Q: Maybe we should publish our version of the theme since the original
     * vuepress casper is no longer maintained. It's repo has had no changes for
     * +3 years.
     */
    // theme: "casper",
    patterns: ["**/*.md", ".vuepress/**/*.vue"],
    /** head: Extra tags to inject into the page HTML `<head>` element. You can
     * specify each tag in the form of
     * `[tagName, { attrName: attrValue }, innerHTML?]`
     * */
    head: [
        ["meta", { property: "og:title", content: "Unique Divine" }],
        ["meta", { property: "og:site_name", content: "Unique Divine" }],
        ["meta", { property: "twitter:title", content: "Unique Divine" }],
        ["meta", { property: "description", content: metaHead.descr }],
        ["meta", { property: "twitter:description", content: metaHead.descr }],
        ["meta", { property: "og:description", content: metaHead.descr }],
        ["link", { rel: "canonical", content: metaHead.url }],
        ["meta", { property: "twitter:site", content: metaHead.twitter }],
        ["meta", { property: "twitter:card", content: "summary_large_image" }],
        ["link", { rel: "icon", href: "/favicon/favicon-256x256.png" }],
        [
            "link",
            {
                rel: "icon",
                type: "image/png",
                sizes: "32x32",
                href: "/favicon/favicon-32x32.png",
            },
        ],
        [
            "link",
            {
                rel: "icon",
                type: "image/png",
                sizes: "16x16",
                href: "/favicon/favicon-16x16.png",
            },
        ],
        ["link", { rel: "manifest", href: "/site.webmanifest" }],
        ["meta", { name: "msapplication-TileColor", content: "#2e3148" }],
        /** See [google-site-verification](https://support.google.com/webmasters/answer/9008080#domain_name_verification&zippy=%2Cdomain-name-provider)
         * in the "where should I put my verification tags?" section. */
        [
            "meta",
            {
                name: "google-site-verification",
                content: "yGhWx5cwJ01ox4HbLFHPAyfopSjwYtUFtJOkeqB_er0",
            },
        ],
        ["meta", { name: "theme-color", content: "#f0f0f0" }],
        // ICO format: for type "image/x-icon". Can contain multiple sizes of the
        // icon in a single file, which the browser can then choose from.
        // Less common in modern HTML as you can declare multiple PNG icon blocks.
        ["link", { rel: "icon", type: "image/x-icon", href: "/favicon/favicon.ico" }],
        [
            "link",
            {
                rel: "apple-touch-icon-precomposed",
                href: "/favicon/apple-touch-icon-precomposed.png",
            },
        ],
    ],
    /** themeConfig.description: Makes a visible description on the front page and
     * changes the `<meta property=description" ...>` element. */
    // description: "",
    markdown: {
        /** Config for `markdown-it-anchor` plugin. */
        anchor: {
            permalink: false,
            permalinkBefore: false,
        },
        extendMarkdown: (md) => {
            // md.use(markdownItKatex) // TODO
        },
    },
    themeConfig: {
        cover: "/images/cover.jpg",
        logo: "",
        // logo: "/some-logo.svg",
        /**
         * themeConfig.nav: Defines the routes the top-level page navigation.
         * Note that local relative paths work here, e.g. "/posts". If the link
         * includes "https", it will be treated as an external link.
         * */
        nav: [
            {
                text: "Home",
                link: "/",
            },
            {
                text: "About",
                link: navPage("about"),
            },
            {
                text: "Code",
                // link: "/tags/code",
                link: navTag("code"),
            },
            // {
            //   text: "Tags",
            //   link: "/tags", // A "posts" page with everything tagged.
            // },
            // {
            //   text: "Commonplace",
            //   link: "/category/commonplace",
            // },
            /** For posts.
             * Uncomment this section to add an unfiltered category-like page that
             * includes all of the blog posts.
             */
            // {
            //   text: "Posts",
            //   link: "/posts"
            // },
            /** Category page example
             * To add a tag or category to a post, include a "tags" or "categories"
             * section in the YAML header of the post.
             *
             * ```yaml
             * tags:
             *   - Shut up and take my money
             *   - newsletter
             * categories:
             *   - futurama
             * ```
             *
             */
            // {
            //   text: "Futurama",
            //   link: navCategory("Futurama")
            // },
        ],
        footer: [
            {
                text: "Latest Posts",
                link: "/",
            },
            {
                text: "Commonplace",
                link: "https://unique-divine.gitbook.io/commonplace-book",
            },
            {
                text: "Twitter",
                link: socialLinks.twitter,
            },
            {
                text: "Github",
                link: socialLinks.github,
            },
        ],
        social: {
            github: socialLinks.github,
            twitter: socialLinks.twitter,
            linkedin: socialLinks.linkedin,
        },
        // TODO: Potentially revive author functionality?
        //
        // defaultAuthor: {
        //   link: "https://alexander.heimbu.ch",
        //   name: "Default Author",
        //   gravatar: "2bfa103a13c88b5ffd26da6f982f11df"
        // },
        search: true, // TODO: fix(css): Search bar overlaps with header nav
    },
});
