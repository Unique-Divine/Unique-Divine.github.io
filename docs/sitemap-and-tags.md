# Sitemap and tags

The footer links to `/sitemap`. Astro generates this page as HTML during every
build, so readers and crawlers can follow its links without JavaScript.
Published articles, projects, categories, and tags enter the sitemap
automatically. The page also links to the XML sitemap index and RSS feed.

Blog links are grouped by category, with uncategorized articles under Other
posts. Category headings link to their archives. Each group lists its articles
newest first. The sticky table of contents lists sections and category groups,
using the same heading data as the page. It appears as a sidebar on desktop
and a dropdown on smaller screens.

Sitemap tag labels use sentence case without a leading "On ". Manual display
names retain their capitalization, including Japanese and Self-Improvement.
Archive page titles keep their existing wording.

## Adding pages

Add standalone public pages to the manifest in `src/data/sitePages.ts`.
Keep article and project titles in their collection frontmatter. The sitemap
uses the same content loaders and permalink helpers as their pages.

Draft content, AstroWind demo pages, redirects, error pages, pages with
`noindex`, and pages canonicalized elsewhere do not belong in either sitemap.
The first blog, category, and tag archive pages are indexable. Later archive
pages remain accessible through pagination and use `noindex, follow`.

The XML generator checks rendered robots and canonical metadata. Every build
then checks that the HTML and XML inventories match all eligible built pages,
that each target exists, and that public pages have a footer sitemap link.
It also verifies resource targets and the robots.txt sitemap declaration.
These checks run for `just build` and direct Astro builds, including CI and
publishing builds.

Run `just sitemap-test` to build and test publication rules, tag inventories,
and failure detection against copies of the generated output.

## llms.txt

`/llms.txt` follows the [llmstxt.org](https://llmstxt.org) layout: one H1,
a blockquote summary, then `##` sections of
`- [Title](absolute-url): description` links. The static endpoint
`src/pages/llms.txt.ts` builds it during every build, so a published post
appears without hand edits. Don't add a `public/llms.txt`.

The endpoint loads posts, standing pages, projects, and skills with the
same helpers as the sitemap and filters them with `isPublicPost` and
`isPublicPage` from `src/utils/sitemap.ts`. Drafts, `noindex` pages, and
pages canonicalized elsewhere stay out of both. Posts are listed newest
first. The pure section builder and renderer live in `src/utils/llms.ts`.
Descriptions come from each entry's excerpt, SEO description, project
tagline, or skill description, collapsed to one line.

Links point to Markdown where the site has it:

- **Posts and projects** link to a generated copy at the canonical path plus
  `.md`, such as `/blog/26-10-19-block-latency.md`.
- **Agent skills** link to `/ai-skills-source/<source>`, the `SKILL.md` that
  `just skills-import` copies into `public/`.
- **Standing pages and indexes**, such as `/about` and `/blog`, keep their
  HTML links.

### Markdown Copies

`src/pages/[...path].md.ts` writes one copy per post and project that
llms.txt lists. `getMarkdownSources` in `src/utils/markdown-copies.ts`
chooses them with the same filters, and llms.txt links to exactly that set.
A new post gets a copy on the next build. The `.md` suffix keeps these
routes apart from the HTML routes under `[...blog]` and `code/projects`.
Firebase's `cleanUrls` only touches `.html`, so it serves each copy as a
file, by extension, as `text/markdown; charset=utf-8`, like `SKILL.md`.

Each copy has an H1 title, a `Web page:` line with the canonical HTML URL
and dates, a blank line, then the entry body. `reduceMarkdown` in
`src/utils/markdown-copy.ts` parses the body with remark, adding
`remark-mdx` for `.mdx`, and edits the source by offset, so the author's
Markdown stays as written except for these changes:

- MDX `import`/`export` lines and `{expressions}` are removed.
- JSX elements with children, such as `<Guide>` or a `<div>`, unwrap to
  their content. An `<a href>` around inline content, one paragraph, or one
  image becomes a Markdown link to its absolute URL.
- A childless lowercase element with a `src` or `href`, such as `<iframe>`
  or `<video>`, becomes a link to it, labeled by its `title` when it has one.
  An `<img>` without `alt` becomes an image with empty alt text. Other
  childless lowercase elements become the web-page note, except `<br>`,
  `<hr>`, `<wbr>`, and `<a>` without a `title`, which are dropped. An
  element whose children are all childless, such as an `<svg>` of shapes or
  a `<video>` of `<source>`s, counts as one childless element and takes the
  first child's `src`.
- `markdownComponents` in `src/utils/markdown-components.ts`, keyed by
  import path, maps components to Markdown. The block-latency entries in
  `src/components/research/block-latency/markdown.ts` render each widget's
  default view, the voting validator, from the same model as the web page:
  its figure, its phase, scenario, or upgrade table, and its summary text.
  `Guide` keeps its stat line and a `Data:` line of absolute links to the
  measurement files, and `Legend`, a color key, is dropped. Other childless
  components become a note that links to the web page. Text a wrapper adds
  before or after its content keeps the list indentation or `>` prefix of
  the line it sits on, with a list marker on that line turned into spaces.
- Images under `src/assets/images` resolve through `getImage` to the
  optimized `/_astro/` file the HTML page uses. Root-relative images and
  links, `#fragment` links, and raw HTML `src`/`href` become absolute. An
  image that can't be resolved is reduced to its alt text.
- HTML comments are dropped.

Code blocks and inline code are never changed.

### Tests

`src/utils/llms.test.ts` covers the format with test data, and
`src/utils/markdown-copy.test.ts` covers the MDX reduction and path
mapping. `src/utils/llms.build.test.ts` checks the built `dist/llms.txt`:
one H1, a summary, no duplicate links, every link built, and every page
link (or a copy's HTML page) in the XML sitemap. It also checks that each
copy holds no MDX imports, exports, or JSX tags outside code, and that
the built copies match the listed set. Like the other dist tests, it skips
until `just b` has run.

## Choosing tags

Categories organize the broad sections of the blog. Tags connect articles
across those sections through reusable topics. Prefer an existing tag when it
fits. A specific tag with one article is allowed, and its landing page is
indexable. Draft-only tags do not produce public archives.

Treat tag slugs as public URLs. Change a display label without renaming its slug
when possible. Use the existing section-title overrides and tag display-name
mapping for these labels. An intentional slug rename requires updating article
references and adding redirects for the old archive URLs, including old
pagination routes where applicable.

Run `just tags` before introducing or reorganizing tags. The read-only report
lists raw spellings, normalized slugs, resolved archive titles, article counts,
and article filenames. It lists draft-only tags separately and flags distinct
spellings that normalize to the same slug. These flags support editorial
review; they do not change articles or fail builds.

Use the inventory to decide which topics deserve clearer names, consolidation,
or more writing. No central registry or minimum article count is required.
