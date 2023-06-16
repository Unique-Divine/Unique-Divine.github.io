const socialLinks = {
  github: "https://github.com/Unique-Divine",
  twitter: "https://twitter.com/DeusExUnicus",
  linkedin: "https://www.linkedin.com/in/unique-divine/",
  discord: "https://discord.gg/HFvbn7Wtud",
};

/** ------------------------ home-site/blog ------------------------
 * Please leave the zombie comments. They serve as useful documentation for
 * how to edit the vuepress theme.
 *
 * TODO Add some of this information to the README, or a HACKING.md file.
 * */
module.exports = {
  title: "Unique Divine",
  // description: "A DeFi hub ushering in the next era of money",
  base: "/",
  /** The "theme" field of the vuepress config determines which theme to import.
   * We have this commented out because this site uses a local theme, where we
   * can fully customize the underlying components and CSS.
   * Q: Maybe we should publish our version of the theme since the original
   * vuepress casper is no longer maintained. It's repo has had no changes for
   * +3 years.
   */
  // theme: "casper",
  head: [
    ["link", { rel: "icon", href: "/favicon.png" }],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
    ],
    ["link", { rel: "manifest", href: "/site.webmanifest" }],
    ["meta", { name: "msapplication-TileColor", content: "#2e3148" }],
    // TODO: Add google-site-verification for search
    // [
    //   "meta",
    //   {
    //     name: "google-site-verification",
    //     content: "Uj8rxJHITFhFY8jBVBQfiPt9JcLl77JMkR50e9t4qGM",
    //   },
    // ],
    ["meta", { name: "theme-color", content: "#f0f0f0" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon-svg.svg" }],
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.ico" }],
    [
      "link",
      {
        rel: "apple-touch-icon-precomposed",
        href: "/apple-touch-icon-precomposed.png",
      },
    ],
  ],
  markdown: {
    anchor: {
      permalink: false,
      permalinkBefore: false,
    },
  },
  themeConfig: {
    cover: "/images/cover.jpg",
    logo: "",
    // logo: "/some-logo.svg",
    nav: [
      {
        text: "Home",
        link: "/",
      },
      {
        text: "About",
        link: "/page/about",
      },
      {
        text: "Tags",
        link: "/tags",
        // note that local relative paths work here, e.g. "/posts". if the link
        // includes "https", it will be treated as an external link.
      },
      {
        text: "Categories",
        link: "/category/futurama",
        // note that local relative paths work here, e.g. "/posts". if the link
        // includes "https", it will be treated as an external link.
      },
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
      //   link: "/category/Futurama"
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
      // facebook: "https://facebook.com",
      // xing: "https://xing.de",
      // instagram: "https://instagram.com",
      linkedin: socialLinks.linkedin,
    },
    // defaultAuthor: {
    //   link: "https://alexander.heimbu.ch",
    //   name: "Default Author",
    //   gravatar: "2bfa103a13c88b5ffd26da6f982f11df"
    // },
    search: false, // fix(css): Search bar overlaps with header nav
  },
};
