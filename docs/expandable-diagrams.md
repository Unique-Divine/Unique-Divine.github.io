# Expandable diagrams

Use component `ExpandableDiagram.astro` in a blog MDX entry to show a diagram
at the reading-column width and let readers open a larger view.

```mdx
import ExpandableDiagram from "~/components/common/ExpandableDiagram.astro"

<ExpandableDiagram
  src="/diagrams/overview.svg"
  alt="The proposal, voting, and application execution path"
  width={1200}
  height={700}
  caption="One successful round."
/>
```

In this example, the image lives at `public/diagrams/overview.svg`. Supply its
actual dimensions to reserve the right aspect ratio. Props `src`, `alt`,
`width`, and `height` are required. Prop `caption` is optional, and prop
`loading` accepts `lazy`, the default, or `eager`. For a custom evidence label
or richer caption, use the named slot `caption` instead of the caption prop.

Inline images fit the column without horizontal scrolling. Clicking the image
or its expand icon opens a native dialog. The close button, Escape key, and
backdrop dismiss it. Keyboard focus cycles inside the viewer and returns to the
image button without scrolling the page. Each instance has its own dialog ID,
so the same source image can appear more than once.

The expanded image fills a dialog up to 1450 px wide and 94% of the viewport
height. Its readable minimum image width is 1050 px, with horizontal and vertical
scrolling inside the image area as needed. The 44 px close button stays outside
that scrolling area. The background page stays locked while the dialog is open.

The viewer copies the preview's source, description, and dimensions when it
opens. It observes subsequent preview changes, including the research article's
node and upgrade selectors. Closed expanded images do not request their source
until first opened.

Static previews and captions remain visible without JavaScript. Expand controls
are disabled until initialized, and the icon is hidden. Printing includes the
inline figure and caption and hides viewer controls and dialogs.

The component carries its styles and a client module. The blog renderer also
loads that module when it finds a diagram, supporting the site's Astro 4 dynamic
MDX rendering path. It does not require the research data, a particular asset
directory, or the research guide wrapper.

The interaction follows the Sai docs-app Teller component. The next mobile
iteration is tracked in [issue 41: Improve mobile diagram viewing and zoom](https://github.com/Unique-Divine/Unique-Divine.github.io/issues/41).
That issue covers initial scale, touch panning, pinch zoom, safe areas, landscape
orientation, and testing on iOS Safari and Android Chrome.
