import slugify from "limax"

/** Shared by route generation and the tag inventory. */
export const cleanSlug = (text = "") =>
  text
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((slug) => slugify(slug))
    .join("/")
