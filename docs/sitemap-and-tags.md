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
