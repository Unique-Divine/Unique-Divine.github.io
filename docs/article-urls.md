# Article URLs and standing pages

Articles use `/blog/YY-MM-DD-short-title`. Their flat filenames include the
same date prefix, such as `26-10-19-block-latency.mdx`. The required
`publishDate` field determines the date in UTC. Keep it fixed when editing an
article; record later revisions with `updateDate`. Builds reject mismatched
date prefixes, nested article slugs, and duplicate content permalinks.

Categories and tags determine archive membership independently of filenames.
Keep established tag slugs when changing display names. Add categories
explicitly in frontmatter; the loader does not infer them from directories.
It normalizes and deduplicates tags before building archives.

## Standing pages

Entries with `kind: page` require an explicit `permalink`. They use the shared
content renderer but stay out of blog listings, topic archives, related posts,
and RSS. Navigation and the HTML/XML sitemaps link to them.

| Page | Permalink |
| --- | --- |
| About Me | `/about` |
| Media | `/about/media` |
| Nibiru, Sai, & Nibi, Inc. | `/about/nibiru` |
| Code | `/code` |

Resume links to `/about` until its content is available. Project showcase
pages retain `/code/projects`, and skills retain `/ai-skills`.

## Moving a published page

Add explicit HTTP 301 rules to `hosting.redirects` in `firebase.json`, covering
both the old path and its trailing-slash form. Point directly to the final
URL. Astro reads those same rules to generate static redirect pages for
local previews. Firebase provides the HTTP redirects after deployment.

Update maintained internal links and preserve fragments. Canonical tags,
RSS, and sitemaps must use the destination. Redirect pages remain outside the
sitemaps. The retired `/tag/about` and `/tag/nibiru` archives redirect to their
corresponding About pages because standing pages no longer populate archives.

Run `just build`, `bun test tests`, and `just lint` before publishing. The build
checks HTML/XML inventory agreement and canonical metadata. Migration tests
also verify redirect destinations, standing-page exclusions, and skill social
images. Use `just deploy` from merged main to publish through Firebase Hosting.
