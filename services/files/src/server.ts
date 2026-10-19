import { createReadStream, promises as fs } from "node:fs"
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http"
import { resolve, sep } from "node:path"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { pathToFileURL } from "node:url"
import { Storage } from "@google-cloud/storage"

export const MAX_BYTES = 256 * 1024 * 1024
const CACHE = "public, max-age=300, s-maxage=300, no-transform"
const INLINE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
}
type Metadata = {
  size: number
  etag: string
  modified: Date
  generation?: string
}
export interface ObjectSource {
  metadata(key: string): Promise<Metadata>
  open(key: string, metadata: Metadata, start: number, end: number): Readable
}

export class GcsSource implements ObjectSource {
  private bucket
  constructor(name: string) {
    this.bucket = new Storage().bucket(name)
  }
  async metadata(key: string): Promise<Metadata> {
    const [value] = await this.bucket.file(key).getMetadata()
    return {
      size: Number(value.size),
      etag: `"${value.generation}"`,
      modified: new Date(value.updated!),
      generation: String(value.generation),
    }
  }
  open(key: string, metadata: Metadata, start: number, end: number) {
    return this.bucket
      .file(key, { generation: metadata.generation })
      .createReadStream({ start, end, decompress: false })
  }
}

// Local development uses real files and the production HTTP handler.
export class DirectorySource implements ObjectSource {
  constructor(private root: string) {}
  private path(key: string) {
    const root = resolve(this.root)
    const path = resolve(root, key)
    if (!path.startsWith(root + sep))
      throw Object.assign(new Error("Invalid path"), { code: 404 })
    return path
  }
  async metadata(key: string): Promise<Metadata> {
    const value = await fs.stat(this.path(key))
    if (!value.isFile())
      throw Object.assign(new Error("Not a file"), { code: 404 })
    return {
      size: value.size,
      modified: value.mtime,
      etag: `"${value.size}-${value.mtimeMs}"`,
    }
  }
  open(key: string, _metadata: Metadata, start: number, end: number) {
    return createReadStream(this.path(key), { start, end })
  }
}

export function fileKey(rawUrl: string): string | null {
  const rawPath = rawUrl.split("?", 1)[0]
  if (!rawPath.startsWith("/f/")) return null
  if (/%(?:2f|5c)/i.test(rawPath)) return null
  try {
    const key = decodeURIComponent(rawPath.slice(3))
    return key.split("/").every(
      (part) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part) && !part.includes(".."),
    )
      ? key
      : null
  } catch {
    return null
  }
}

function byteRange(value: string, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value)
  if (!match || (!match[1] && !match[2]) || size === 0) return null
  if (!match[1]) {
    const suffix = Number(match[2])
    return Number.isSafeInteger(suffix) && suffix > 0
      ? [Math.max(0, size - suffix), size - 1]
      : null
  }
  const start = Number(match[1])
  const end = match[2] ? Number(match[2]) : size - 1
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start >= size ||
    end < start
  )
    return null
  return [start, Math.min(end, size - 1)]
}

function errorResponse(res: ServerResponse, status: number, message: string) {
  res.setHeader("Cache-Control", "no-store")
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" })
  res.end(message + "\n")
}

export function createFileServer(source: ObjectSource, directOrigin?: string) {
  if (directOrigin) {
    const url = new URL(directOrigin)
    if (url.protocol !== "https:" || url.origin !== directOrigin)
      throw new Error("FILES_DIRECT_ORIGIN must be an HTTPS origin")
  }
  return createServer((req, res) => {
    handle(req, res, source, directOrigin).catch((error: unknown) => {
      const code = (error as { code?: number | string }).code
      if (res.headersSent) {
        res.destroy()
        return
      }
      if (code === 404 || code === "ENOENT")
        errorResponse(res, 404, "File not found")
      else {
        console.error(
          JSON.stringify({ event: "file_read_failed", path: req.url, code }),
        )
        errorResponse(res, 502, "Storage temporarily unavailable")
      }
    })
  })
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  source: ObjectSource,
  directOrigin?: string,
) {
  res.setHeader("X-Content-Type-Options", "nosniff")
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD")
    errorResponse(res, 405, "Method not allowed")
    return
  }
  if (req.url === "/healthz") {
    res.end("ok\n")
    return
  }
  const key = fileKey(req.url ?? "")
  if (!key) {
    errorResponse(res, 404, "File not found")
    return
  }
  const meta = await source.metadata(key)
  if (
    !Number.isSafeInteger(meta.size) ||
    meta.size < 0 ||
    meta.size > MAX_BYTES
  ) {
    errorResponse(res, 413, "File exceeds 256 MiB")
    return
  }
  const extension = key.split(".").at(-1)?.toLowerCase() ?? ""
  const inlineType = INLINE_TYPES[extension]
  res.setHeader("Content-Type", inlineType ?? "application/octet-stream")
  res.setHeader(
    "Content-Disposition",
    `${inlineType ? "inline" : "attachment"}; filename="${key.split("/").at(-1)}"`,
  )
  res.setHeader("Cache-Control", CACHE)
  res.setHeader("ETag", meta.etag)
  res.setHeader("Last-Modified", meta.modified.toUTCString())
  res.setHeader("Accept-Ranges", "bytes")
  if (!inlineType)
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'")
  const noneMatch = req.headers["if-none-match"]
  const matchingEtag = noneMatch
    ?.split(",")
    .some(
      (value) =>
        value.trim() === "*" || value.trim().replace(/^W\//, "") === meta.etag,
    )
  const modifiedSince = req.headers["if-modified-since"]
  if (
    matchingEtag ||
    (!noneMatch &&
      modifiedSince &&
      Math.floor(meta.modified.getTime() / 1000) * 1000 <=
        Date.parse(modifiedSince))
  ) {
    res.writeHead(304)
    res.end()
    return
  }
  let start = 0,
    end = meta.size - 1,
    status = 200
  const rangeHeader = req.headers["if-range"]
  const ifRange = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader
  const allowRange =
    !ifRange ||
    ifRange === meta.etag ||
    Math.floor(meta.modified.getTime() / 1000) * 1000 <= Date.parse(ifRange)
  if (req.method === "GET" && req.headers.range && allowRange) {
    const range = byteRange(req.headers.range, meta.size)
    if (!range) {
      res.setHeader("Content-Range", `bytes */${meta.size}`)
      errorResponse(res, 416, "Range not satisfiable")
      return
    }
    [start, end] = range
    status = 206
    res.setHeader("Content-Range", `bytes ${start}-${end}/${meta.size}`)
  }
  if (req.method === "HEAD") {
    res.setHeader("Content-Length", meta.size)
    res.writeHead(status)
    res.end()
    return
  }
  // Firebase truncates proxied responses at 32 MiB. Preserve the shared URL,
  // but send larger bodies directly through Cloud Run's streaming endpoint.
  const direct =
    new URL(req.url!, "https://localhost").searchParams.get("direct") === "1"
  if (directOrigin && !direct && end - start + 1 > 24 * 1024 * 1024) {
    res.removeHeader("Content-Range")
    res.setHeader("Cache-Control", "no-store")
    res.writeHead(302, { Location: `${directOrigin}/f/${key}?direct=1` })
    res.end()
    return
  }
  if (meta.size === 0) {
    res.writeHead(status)
    res.end()
    return
  }
  // Chunked streaming avoids Cloud Run's buffered-response size limit.
  res.writeHead(status)
  try {
    await pipeline(source.open(key, meta, start, end), res)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code !== "ERR_STREAM_PREMATURE_CLOSE")
      console.error(JSON.stringify({ event: "stream_failed", key, code }))
    if (!res.destroyed) res.destroy()
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const bucket = process.env.FILES_BUCKET
  const local = process.env.FILES_DIRECTORY
  if (!bucket && !local)
    throw new Error("FILES_BUCKET or FILES_DIRECTORY is required")
  createFileServer(
    local ? new DirectorySource(local) : new GcsSource(bucket!),
    process.env.FILES_DIRECT_ORIGIN,
  ).listen(Number(process.env.PORT ?? 8080), "0.0.0.0")
}
