# Automatic article contents

Enable the contents sidebar and sticky mobile menu in a blog post's frontmatter:

```yaml
---
title: My research note
stickyToc: true
---
```

Then write ordinary Markdown headings:

```md
## Measured phase budget

### Sampling window

## What could change?
```

Astro generates each heading's ID and passes the same IDs to the contents menu.
Repeated headings receive distinct IDs. Inline formatting becomes readable link
text; Unicode headings work too. You do not need to import a component, supply
IDs, or maintain a separate list.

The list includes level-two and level-three Markdown headings, preceded by an
Overview link to the article body. Overview's target avoids collisions with
compiled heading IDs. The page title and deeper headings are omitted. Headings
inside embedded components or raw HTML are not part of this Markdown list.

The default is off. A page with no eligible headings renders no contents menu,
even when enabled. Enabled posts use the normal reading width so the desktop
sidebar has room beside the article.

Standalone `.md` and `.mdx` pages use the same setting with the shared layout:

```yaml
---
layout: ../layouts/MarkdownLayout.astro
title: A long reference page
stickyToc: true
---
```

Adjust the layout path relative to the page's source file. Blog collection posts
already receive their layout and do not need the `layout` field.

Below 1280px, the expandable menu sticks below the site header after you scroll
past it. Above that width, the list stays beside the reading column. JavaScript
adds active-section tracking, measured anchor offsets, and menu dismissal. The
links and expandable menu also work without JavaScript. Printing hides the menu.

Changing a heading can change its URL fragment. Update incoming links when
renaming headings; the component does not create aliases for previous names.
Existing explicit IDs elsewhere remain unchanged. If a Markdown plugin provides
a custom compiled heading ID, the menu uses that ID without regenerating it.

The shared `ArticleBody.astro` wrapper owns the full article height, and
`PageLayout.astro` loads the navigation controller when contents are present.
Keep the contents inside that full-height wrapper when extending the layouts.

Run `just contents-test` to check generated IDs, duplicate headings, Unicode,
opt-in behavior, and Overview collisions against Astro's Markdown processor.
