import fs from "fs"
import MarkdownIt from "markdown-it"
import { escapeHtml } from "./md-utils"

export const pluginFcb: MarkdownIt.PluginSimple = (md: MarkdownIt): void => {
  md.renderer.rules.fence = (...args: any[]) => {
    const [tokens, idx, _options] = args

    const token = tokens[idx]

    if (fs.existsSync(token.src)) {
      token.content = fs.readFileSync(token.src, "utf8")
    }

    const base64 = Buffer.from(escapeHtml(token.content)).toString("base64")

    return `
      <tm-code-block class="codeblock" language="${token.info}" base64="${base64}"></tm-code-block>
    `
  }
}

export default pluginFcb
