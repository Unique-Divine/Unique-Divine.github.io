import { createHash } from "node:crypto"
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

const root = fileURLToPath(new URL("../", import.meta.url))
const assetDir = path.join(root, "assets/skill-covers")
const outDir = path.join(root, "public/covers/skills")
const manifestPath = path.join(outDir, "manifest.json")
const hash = (value) => createHash("sha256").update(value).digest("hex")
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  )

export async function coverEntries() {
  const dir = path.join(root, "src/content/skill")
  const skills = []
  for (const file of (await readdir(dir))
    .filter((f) => f.endsWith(".md"))
    .sort()) {
    const raw = await readFile(path.join(dir, file), "utf8")
    const data = yaml.load(raw.match(/^---\n([\s\S]*?)\n---/)[1])
    if (data.kind === "skill")
      skills.push({ folder: data.folder, title: data.title })
  }
  return [
    { folder: "catalogue", title: "Agent skills.\nLess repeating myself." },
    ...skills,
  ]
}

async function inputs() {
  const assets = {}
  for (const name of ["avatar.jpg", "Archivo.ttf", "JetBrainsMono.ttf"])
    assets[name] = await readFile(path.join(assetDir, name))
  return {
    assets,
    template: await readFile(
      new URL("./skill-cover.html", import.meta.url),
      "utf8",
    ),
    renderer: await readFile(
      new URL("./skill-covers.mjs", import.meta.url),
      "utf8",
    ),
  }
}
const inputHash = (entry, source) =>
  hash(
    JSON.stringify(entry) +
      source.template +
      source.renderer +
      Object.values(source.assets).map(hash).join(""),
  )

export async function validateSkillCovers() {
  const entries = await coverEntries()
  const source = await inputs()
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
  for (const entry of entries) {
    const record = manifest[entry.folder]
    if (!record || record.input !== inputHash(entry, source))
      throw new Error(
        `Stale skill cover for ${entry.folder}. Run just covers-generate.`,
      )
    const png = await readFile(path.join(outDir, entry.folder + ".png"))
    if (
      hash(png) !== record.sha256 ||
      png.readUInt32BE(16) !== 1200 ||
      png.readUInt32BE(20) !== 630
    )
      throw new Error(
        `Invalid skill cover for ${entry.folder}. Run just covers-generate.`,
      )
  }
  if (Object.keys(manifest).length !== entries.length)
    throw new Error("Stale skill cover inventory. Run just covers-generate.")
  return entries.length
}

async function generate() {
  const { chromium } = await import("playwright")
  const source = await inputs()
  const entries = await coverEntries()
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  })
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  })
  const manifest = {}
  await mkdir(outDir, { recursive: true })
  try {
    for (const entry of entries) {
      let html = source.template
        .replaceAll("{{TITLE}}", escape(entry.title))
        .replaceAll(
          "{{FOLDER}}",
          escape(
            entry.folder === "catalogue"
              ? "The public collection"
              : entry.folder,
          ),
        )
      for (const [name, data] of Object.entries(source.assets))
        html = html.replaceAll(
          "{{" + name + "}}",
          "data:" +
            (name.endsWith(".jpg") ? "image/jpeg" : "font/ttf") +
            ";base64," +
            data.toString("base64"),
        )
      await page.setContent(html)
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map((i) => i.decode()))
        const title = document.querySelector("h1")
        let size = 82
        while (
          (title.scrollHeight > 252 || title.scrollWidth > title.clientWidth) &&
          size > 42
        )
          title.style.fontSize = --size + "px"
        if (title.scrollHeight > 252 || title.scrollWidth > title.clientWidth)
          throw new Error("Cover title overflow")
        if (!document.fonts.check("900 60px Archivo"))
          throw new Error("Archivo failed to load")
      })
      const png = await page.screenshot({ type: "png" })
      await writeFile(path.join(outDir, entry.folder + ".png"), png)
      manifest[entry.folder] = {
        title: entry.title,
        input: inputHash(entry, source),
        sha256: hash(png),
      }
    }
  } finally {
    await browser.close()
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n")
  const cards = entries
    .map(
      (e) =>
        `<figure><img src="${e.folder}.png" alt="${escape(e.title)}"><figcaption>${escape(e.folder)}</figcaption></figure>`,
    )
    .join("")
  await writeFile(
    path.join(outDir, "viewer.html"),
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Skill cover contact sheet</title><style>body{background:#e8ebf2;font:16px system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:24px}figure{margin:0}img{width:100%;border-radius:8px}figcaption{padding:8px}</style><h1>Skill covers</h1><main>${cards}</main>`,
  )
  console.log(
    `Generated ${entries.length} covers. Contact sheet: ${outDir}/viewer.html`,
  )
}

export function skillCoverValidation() {
  return {
    name: "validate-skill-covers",
    hooks: {
      "astro:build:start": async () => {
        await validateSkillCovers()
      },
    },
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.includes("--check"))
    console.log(`Verified ${await validateSkillCovers()} skill covers`)
  else await generate()
}
