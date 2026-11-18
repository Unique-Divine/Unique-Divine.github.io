// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />

declare namespace App {
  interface Locals {
    /**
     * Set by `PageLayout` when its `copyForLlm` prop is on; read by
     * `PageActions` to render the Copy for LLM button by the page title.
     */
    pageCopy?: import("~/utils/markdown-copy").PageCopy
  }
}
