# Block-latency article

The normal blog entry is `/261019-block-latency`, in category `Nibiru` with the
six research tags in its frontmatter. It uses the normal article content layout.
The MDX entry owns the prose; Astro components own the figures and interactive
tables. The site builds from committed data and assets, with no telemetry access.

The cover uses `/research/261019-block-latency/normal-budget.svg`, the same
"Where the block interval goes" SVG shown in the validator budget. There is no
separate cover copy, so edits to that asset also change the cover. Replace the
frontmatter field `image` when a different cover is ready.

To refresh this fixed capture, run from the website checkout:

```sh
just research-import ../boku/epics/26-10-18-sai-node-perf/profiling
just research-test
just build
just research-preview
```

The importer checks the source report and original guide hashes, verifies the
baseline and upgrade tables against the report, and exports the generated SVGs.
It replaces the block-flow scale label for this article and records both source
figure hashes and presentation edits. The research originals remain unchanged.
It exports identical build-time and downloadable display data and a hash manifest.
The detailed timelines and generated tables accompany the 12 guide SVGs.

Preserve null states as unavailable, observed zeros, incomplete windows, and
signed residuals when editing the display. The scenario table retains the
residual while subtracting selected phase contributions. Its hypothetical rows
are not protocol forecasts or tested changes. A single-validator experiment is
only a local control; network and fault behavior need separate experiments.

The introduction links to the opportunity table after the baseline. Its combined
validator calculation is `1,515.04 − 922.49 − 324.85 ≈ 267.70 ms`. The subtraction
retains other work and the signed residual. Node selection updates the table and
calculation together. This is a hypothesis supported by measured phase costs.

The article enables [automatic contents navigation](./sticky-contents.md) with
`stickyToc: true`. Astro generates the section IDs and list from its Markdown
headings. Interactive figure headings remain outside that compiler metadata. At 1280px and above it uses a sticky sidebar beside the
normal reading column. Smaller screens use a collapsible list. Static links work
without JavaScript; the client adds active-section tracking and menu dismissal.
Other posts retain their layout and navigation. SVG download CTAs are omitted;
the evidence data, tables, and detailed timeline links remain available.

On smaller screens, the contents bar stays in normal flow until it reaches the
site header, then sticks beneath it for the rest of the article. Its list opens
as an overlay with bounded height and internal scrolling. Header and collapsed
bar measurements determine the sticky position, section tracking, and anchor
offsets. Resize observers handle changes to the header and bar; moving to the
desktop sidebar closes the mobile list. Native details and sticky positioning
also work without JavaScript, using fallback offsets.

Keep the component inside the container that owns the full article body. Sticky
positioning ends at that container's bottom, so a short wrapper would prevent the
bar from following the reader.

The six research figures use the shared
[expandable diagram component](./expandable-diagrams.md). Their inline previews
fit the reading column, with a larger dialog available by clicking the diagram
or its expand icon. Node and upgrade selection update the image used by the
viewer. Horizontal scrolling is confined to the expanded view when needed.
Mobile interaction refinements are tracked in
[issue 41](https://github.com/Unique-Divine/Unique-Divine.github.io/issues/41).

File `src/data/blogSections.ts` changes section headings and document titles
without changing URL slugs, category/tag membership, or post labels. Unmapped
sections retain their existing behavior.

Building does not deploy. The existing working tree may contain other website
changes; publication remains a separate operation.
