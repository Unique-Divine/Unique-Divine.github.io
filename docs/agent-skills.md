# Agent skills publishing

The catalogue is `/ai-skills`. A separate Astro `skill` collection holds the
imported Markdown; the site builds from that snapshot without jiyuu or network
access. Main skill pages also appear in the blog archive and RSS feed under
category **Agent Skills**, with tags `agent-skills` and `ai`. Supporting references
stay out of those feeds. The homepage's Latest Posts widget continues to show
writing.

Refresh the snapshot from the website checkout:

```sh
just skills-import ../boku/jiyuu
just skills-test
just build
```

The importer reads the current checkout, including uncommitted files. It leaves
jiyuu unchanged and excludes skills with `metadata.private: true`. It records the
source revision, dirty state, file hashes, and original publication dates in
`src/data/skills-provenance.json`. Reimporting unchanged files produces the same
snapshot. Keep edits in jiyuu, then reimport; generated pages are not the source.
Automatic upstream syncing and machine skill installation are separate work.

Each folder's `SKILL.md` becomes `/ai-skills/<folder>`. The declared skill name
appears on the card; folder names determine URLs even when those names differ.
The literal `references` directory is removed from reference URLs, and reference
filenames become lowercase without `.md`. Other directories remain, so examples
can live at `/ai-skills/sai-perps/examples/sai-perps-prompts`.

The importer rewrites Markdown links, including reference-style links, to those
routes. It leaves code samples unchanged and preserves valid fragments. A small, explicit
correction map repairs stale source fragments in the rendered pages; original
Markdown downloads remain unchanged. Missing local
Markdown references and route collisions stop the import before replacement.
The original Markdown remains available under `/ai-skills-source/<source-path>`.
The rendered page uses its first H1 as the title and enables `stickyToc: true`
for the remaining Markdown headings. See [automatic contents](./sticky-contents.md).

Install commands point to jiyuu's published `main` branch. Local edits included
in the website snapshot will reach that installation source only after they are
published in jiyuu. GitHub links on skill pages lead to the parent skill directory;
the Original Markdown download always matches the website snapshot.

The catalogue uses the shared site header, fonts, and themes. Search filters names,
folder names, and descriptions in the browser. Without JavaScript, the complete
alphabetical list and installation text remain available.

Development and build use separate Vite caches. This prevents a production build
from invalidating dependency URLs still used by the development preview, including
the lazily hydrated GitHub activity chart. The activity API and local cache remain
the chart's data sources.

The HTML minifier preserves Astro islands verbatim. React uses comment separators
between adjacent server-rendered text nodes; removing those separators caused
production hydration errors in the homepage status clock.

## Validation, 2026-10-19

The current snapshot contains 22 skills and 27 supporting pages. Jiyuu
[PR 36](https://github.com/Unique-Divine/jiyuu/pull/36) retired `find-skills`,
`lang-cavemen`, and the earlier `new-skills` workflow. The snapshot now records
the clean, merged source revision. Import tests
cover all rendered internal links and heading fragments, private exclusions,
missing references, collisions, folder/name differences, and original file hashes.
An unchanged reimport preserves the complete snapshot and publication dates.

The production build, focused ESLint/format checks, contents tests, and research
tests pass. Browser checks cover development and production previews, search,
clipboard controls, responsive layouts, both themes, skill breadcrumbs, sticky
contents and anchor offsets, category archives, the writing-only homepage widget,
the live GitHub chart, API failure/cache behavior, no-JavaScript links, and print.
No browser errors remain in either preview.
