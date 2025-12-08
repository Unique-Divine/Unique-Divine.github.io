# HACKING.md

Personal website built with **[Astro 4.0](https://astro.build/) + [Tailwind CSS](https://tailwindcss.com/)**.

- ✅ **Production-ready** scores in **PageSpeed Insights** reports
- ✅ Integration with **Tailwind CSS** supporting **Dark mode**
- ✅ **Fast and SEO friendly blog** with automatic **RSS feed**, **MDX** support, **Categories & Tags**
- ✅ **Image Optimization** (using **Astro Assets** and **Unpic** for Universal image CDN)
- ✅ Generation of **project sitemap** based on routes
- ✅ **Open Graph tags** for social media sharing
- ✅ **Analytics** support (Google Analytics configured but optional)

<br>

## Project structure

```
/
├── public/
│   ├── _headers
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── favicons/
│   │   ├── images/
│   │   └── styles/
│   │       └── tailwind.css
│   ├── components/
│   │   ├── blog/
│   │   ├── common/
│   │   ├── ui/
│   │   ├── widgets/
│   │   │   ├── PageHeader.astro
│   │   │   └── ...
│   │   ├── CustomStyles.astro
│   │   ├── Favicons.astro
│   │   └── Logo.astro
│   ├── content/
│   │   ├── post/
│   │   │   ├── post-slug-1.md
│   │   │   ├── post-slug-2.mdx
│   │   │   └── ...
│   │   └-- config.ts
│   ├── layouts/
│   │   ├── Layout.astro
│   │   ├── MarkdownLayout.astro
│   │   └── PageLayout.astro
│   ├── pages/
│   │   ├── [...blog]/
│   │   │   ├── [category]/
│   │   │   ├── [tag]/
│   │   │   ├── [...page].astro
│   │   │   └── index.astro
│   │   ├── index.astro
│   │   ├── 404.astro
│   │   ├-- rss.xml.ts
│   │   └── ...
│   ├── utils/
│   ├── config.yaml
│   └── navigation.js
├── scripts/
│   └── publish.sh
├── package.json
├── astro.config.mjs
├── justfile
└── ...
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory if they do not require any transformation or in the `assets/` directory if they are imported directly.

<br>

## Commands

All commands are run from the root of the project using `just`:

| Command       | Action                                        |
| :------------ | :-------------------------------------------- |
| `just i`      | Installs dependencies using bun               |
| `just dev`    | Starts local dev server at `localhost:3000`   |
| `just b`      | Build your production site to `./dist/`       |
| `just preview`| Preview your build locally                    |
| `just fmt`    | Format codes with Prettier                    |
| `just lint`   | Run ESLint                                    |
| `just deploy` | Build and deploy to GitHub Pages              |

<br>

## Configuration

Basic configuration file: `./src/config.yaml`

The main site configuration is in `src/config.yaml`, including:
- Site name and URL
- SEO metadata
- Blog settings (posts per page, permalink structure)
- Analytics configuration
- UI theme settings

Navigation is configured in `src/navigation.js`.

<br>

## Development

### Local Development

```bash
just i    # Install dependencies
just dev  # Start dev server
```

The site will be available at `http://localhost:3000`

### Building

```bash
just b  # Build production site
```

The built files will be in the `dist/` directory.


## Deployment

The site is deployed to GitHub Pages using the deployment script:

```bash
just deploy
```

This runs `scripts/publish.sh` which:
1. Installs dependencies using bun
2. Builds the production site
3. Creates GitHub Pages records (CNAME, .nojekyll)
4. Pushes the built site to the `gh-pages` branch

The deployment targets `Unique-Divine.github.io` repository.

<br>

## Technologies

- **Astro 4.0** - Web framework
- **Tailwind CSS** - Styling
- **Bun** - Package manager and runtime
- **TypeScript** - Type safety
- **MDX** - Markdown with JSX support
- **React** - For interactive components

<br>

## License

This personal website is based on the AstroWind template, which is licensed under the MIT license.
