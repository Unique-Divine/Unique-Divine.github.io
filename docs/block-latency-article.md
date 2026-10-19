# Block-latency article

The normal blog entry is `/261019-block-latency`, in category `Nibiru` with the
six research tags in its frontmatter. It uses the opt-in `wide` content layout.
The MDX entry owns the prose; Astro components own the figures and interactive
tables. The site builds from committed data and assets, with no telemetry access.

To refresh this fixed capture, run from the website checkout:

```sh
just research-import ../boku/epics/26-10-18-sai-node-perf/profiling
just research-test
just build
just research-preview
```

The importer checks the source report and original guide hashes, verifies the
baseline and upgrade tables against the report, and copies the generated SVGs.
It exports identical build-time and downloadable display data and a hash manifest.
The detailed timelines and generated tables accompany the 12 guide SVGs.

Preserve null states as unavailable, observed zeros, incomplete windows, and
signed residuals when editing the display. The scenario table retains the
residual while subtracting selected phase contributions. Its hypothetical rows
are not protocol forecasts or tested changes. A single-validator experiment is
only a local control; network and fault behavior need separate experiments.

File `src/data/blogSections.ts` changes section headings and document titles
without changing URL slugs, category/tag membership, or post labels. Unmapped
sections retain their existing behavior.

Building does not deploy. The existing working tree may contain other website
changes; publication remains a separate operation.
