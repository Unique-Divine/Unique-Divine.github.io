// import { pluginGH as ghmd } from "./markdown-it-gh"
// import { pluginFcb as fcb } from "./markdown-it-fcb"
// import MarkdownIt from "markdown-it"

module.exports = () => {
  return {
    plugins: ["@vuepress/search"],
    // extendMardown: (md: MarkdownIt) => {
    //   md.use(ghmd)
    //   md.use(fcb)
    // },
  }
}
