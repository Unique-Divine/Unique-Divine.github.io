(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{341:function(t,e,a){"use strict";a.r(e);var n=a(0),s=Object(n.a)({},(function(){var t=this,e=t._self._c;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"ud-site-gen"}},[t._v("ud-site-gen")]),t._v(" "),e("p",[t._v("Source code for https://uniquedivine.blog")]),t._v(" "),e("h2",{attrs:{id:"static-assets"}},[t._v("Static Assets")]),t._v(" "),e("p",[t._v("Static assets used in cover images must be in the "),e("code",[t._v(".vuepress/public")]),t._v(" directory.\nBy convention, static assets are kept in "),e("code",[t._v(".vuepress/public/stat")]),t._v(" for clarity.")]),t._v(" "),e("p",[t._v("Static assets used in articles should be somewhere easy to access with relative\npaths. By convention, most in-article static assets are kept in "),e("code",[t._v("[repo]/stat")]),t._v(".")]),t._v(" "),e("h2",{attrs:{id:"post-front-matter"}},[t._v("Post Front Matter")]),t._v(" "),e("div",{staticClass:"language-yaml extra-class"},[e("pre",{pre:!0,attrs:{class:"language-yaml"}},[e("code",[e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("title")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"TITLE HERE"')]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("image")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"/path/to/image-from/public-dir.png"')]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("publish")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token datetime number"}},[t._v("2022-10-02")]),t._v("\n"),e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("type")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v(" post\n"),e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("tags")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v("\n  "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("-")]),t._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[t._v('"For Devs"')]),t._v("\n  "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("-")]),t._v(" newsletter\n"),e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("categories")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v("\n  "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("-")]),t._v(" commonplace\n"),e("span",{pre:!0,attrs:{class:"token key atrule"}},[t._v("readingTime")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(":")]),t._v(" 4 Min read\n")])])]),e("h3",{attrs:{id:"type"}},[t._v("type")]),t._v(" "),e("p",[t._v("The "),e("code",[t._v("type")]),t._v(" field can be set to the follwoing options.")]),t._v(" "),e("ul",[e("li",[t._v("'home': The landing page template.")]),t._v(" "),e("li",[t._v("'post': A blog post (article).")]),t._v(" "),e("li",[t._v("'page': A stand-alone page based on markdown.")]),t._v(" "),e("li",[t._v("'posts' A collection of articles.\n"),e("ul",[e("li",[t._v("'tags': collection of articles based on tag")]),t._v(" "),e("li",[t._v("'category': collection of articles based on category")])])])]),t._v(" "),e("p",[t._v("These are specified by the "),e("code",[t._v("computed.content")]),t._v(" field inside of the theme's "),e("code",[t._v("Layout.vue")]),t._v(".")]),t._v(" "),e("h2",{attrs:{id:"contribution-guidelines"}},[t._v("Contribution guidelines")]),t._v(" "),e("p",[t._v("You can contribute to improve this documentation by opening a\n"),e("a",{attrs:{href:"https://github.com/Unique-Divine/Unique-Divine.github.io",target:"_blank",rel:"noopener noreferrer"}},[t._v("GitHub"),e("OutboundLink")],1),t._v(" issue or pull request.")]),t._v(" "),e("h2",{attrs:{id:"state-management"}},[t._v("State Management")]),t._v(" "),e("p",[t._v("The vuepress theme uses "),e("code",[t._v("vuex")]),t._v(" for state management. Inspired by Flux and\nRedux, Vuex is state management library for Vue applications that provides a\ncentralized state management solution.")]),t._v(" "),e("p",[t._v("The main concepts in Vuex are:")]),t._v(" "),e("ol",[e("li",[e("p",[e("strong",[t._v("State")]),t._v(": State in Vuex is the single source of truth for all shared data\nwithin a Vue.js application. This means that any component within your\napplication can access or mutate the state.")])]),t._v(" "),e("li",[e("p",[e("strong",[t._v("Getters")]),t._v(": Getters are similar to computed properties in Vue. They are\nused to compute derived state based on the store state. They can help to\nreduce code duplication, as you can use a getter once and reference it in\nmultiple places.")])]),t._v(" "),e("li",[e("p",[e("strong",[t._v("Mutations")]),t._v(": Mutations are synchronous transactions that are the only way\nto change state in a Vuex store. Each mutation has a string type and a\nhandler. The handler function is where you perform actual state\nmodifications, and it will receive the state as the first argument.")])]),t._v(" "),e("li",[e("p",[e("strong",[t._v("Actions")]),t._v(": Actions are similar to mutations, with the difference being\nthat actions can contain asynchronous operations. Actions commit mutations\nand can contain arbitrary asynchronous operations.")])]),t._v(" "),e("li",[e("p",[e("strong",[t._v("Modules")]),t._v(": Vuex allows us to divide our store into modules. Each module\ncan contain its own state, mutations, actions, and even nested modules. This\nhelps to keep the store organized as your application grows in complexity.")])]),t._v(" "),e("li",[e("p",[e("strong",[t._v("Plugins")]),t._v(": Vuex supports plugins which allows developers to extend its\nfunctionality. They can be used for logging, persistence, handling async\nprocesses, etc.")])])]),t._v(" "),e("p",[t._v("Vuex is used to handle shared state among component. Not all state needs to be\nplaced in Vuex. If a state is only relevant for a single component, it might be\nbetter to keep it local to that component.")]),t._v(" "),e("p",[t._v("It's important to note that Vuex, like Redux in the React ecosystem, adopts a\nunidirectional data flow. This means that data in the application follows the\nsame lifecycle pattern, making the logic of state changes more predictable and\nunderstandable.")])])}),[],!1,null,null,null);e.default=s.exports}}]);