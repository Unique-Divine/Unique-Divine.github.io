import { afterAll, beforeAll, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createFileServer, DirectorySource, fileKey, MAX_BYTES } from "./server"

let directory: string
let origin: string
let server: ReturnType<typeof createFileServer>
beforeAll(async () => {
  directory = await fs.mkdtemp(join(tmpdir(), "personal-files-test-"))
  await fs.writeFile(
    join(directory, "screenshot.png"),
    Buffer.from("abcdefghij"),
  )
  await fs.writeFile(join(directory, "report.pdf"), "%PDF-1.4\n")
  await fs.mkdir(join(directory, "26"))
  await fs.copyFile(join(directory, "screenshot.png"), join(directory, "26/10-12-trade-modal.png"))
  await fs.copyFile(join(directory, "report.pdf"), join(directory, "26/10-12-report.pdf"))
  await fs.writeFile(
    join(directory, "active.html"),
    "<script>alert(1)</script>",
  )
  await fs.writeFile(join(directory, "empty.txt"), "")
  const large = await fs.open(join(directory, "large.bin"), "w")
  await large.truncate(MAX_BYTES)
  await large.close()
  await fs.link(join(directory, "large.bin"), join(directory, "26/10-12-large.bin"))
  const oversize = await fs.open(join(directory, "oversize.bin"), "w")
  await oversize.truncate(MAX_BYTES + 1)
  await oversize.close()
  server = createFileServer(new DirectorySource(directory))
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address()
  if (!address || typeof address === "string")
    throw new Error("No listening port")
  origin = `http://127.0.0.1:${address.port}`
})
afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  await fs.rm(directory, { recursive: true, force: true })
})
test("serves images and PDFs inline with safe cache and MIME headers", async () => {
  const image = await fetch(origin + "/f/screenshot.png")
  expect(image.status).toBe(200)
  expect(image.headers.get("content-type")).toBe("image/png")
  expect(image.headers.get("content-disposition")).toStartWith("inline")
  expect(image.headers.get("x-content-type-options")).toBe("nosniff")
  expect(image.headers.get("cache-control")).toContain("max-age=300")
  expect(await image.text()).toBe("abcdefghij")
  const pdf = await fetch(origin + "/f/report.pdf")
  expect(pdf.headers.get("content-type")).toBe("application/pdf")
  expect(await pdf.text()).toStartWith("%PDF")
})
test("HEAD and conditional GET return metadata without file bodies", async () => {
  const head = await fetch(origin + "/f/screenshot.png", { method: "HEAD" })
  expect(head.headers.get("content-length")).toBe("10")
  expect(await head.text()).toBe("")
  for (const headers of [
    { "If-None-Match": head.headers.get("etag")! },
    { "If-None-Match": `W/${head.headers.get("etag")}` },
    { "If-Modified-Since": head.headers.get("last-modified")! },
  ]) {
    const response = await fetch(origin + "/f/screenshot.png", { headers })
    expect(response.status).toBe(304)
    expect(await response.text()).toBe("")
  }
})
test("byte ranges support partial, open-ended, and suffix downloads", async () => {
  for (const [range, text, contentRange] of [
    ["bytes=2-5", "cdef", "bytes 2-5/10"],
    ["bytes=7-", "hij", "bytes 7-9/10"],
    ["bytes=-3", "hij", "bytes 7-9/10"],
  ]) {
    const response = await fetch(origin + "/f/screenshot.png", {
      headers: { Range: range },
    })
    expect(response.status).toBe(206)
    expect(response.headers.get("content-range")).toBe(contentRange)
    expect(await response.text()).toBe(text)
  }
  const invalid = await fetch(origin + "/f/screenshot.png", {
    headers: { Range: "bytes=50-" },
  })
  expect(invalid.status).toBe(416)
  expect(invalid.headers.get("cache-control")).toBe("no-store")
  const stale = await fetch(origin + "/f/screenshot.png", {
    headers: { Range: "bytes=0-1", "If-Range": '"stale"' },
  })
  expect(stale.status).toBe(200)
  expect(await stale.text()).toBe("abcdefghij")
})
test("rejects unsafe paths and public writes, and downloads active formats", async () => {
  for (const path of [
    "/f/%2e%2e%2fsecret",
    "/f/%252e%252e",
    "/f/%00",
    "/f/%ZZ",
    "/f/26//10-12-image.png",
    "/f/26/../secret",
    "/f/26/./image.png",
    "/f/26/image.png/",
    "/f/26%2f10-12-image.png",
    "/f/26%2F10-12-image.png",
    "/f/26/%5csecret",
    "/f/26/\\secret",
    "/f/26/%252fsecret",
    "/f/",
    "/other",
  ])
    expect(fileKey(path)).toBeNull()
  const missing = await fetch(origin + "/f/missing.png")
  expect(missing.status).toBe(404)
  expect(missing.headers.get("cache-control")).toBe("no-store")
  const write = await fetch(origin + "/f/screenshot.png", { method: "POST" })
  expect(write.status).toBe(405)
  expect(write.headers.get("allow")).toBe("GET, HEAD")
  const active = await fetch(origin + "/f/active.html")
  expect(active.headers.get("content-disposition")).toStartWith("attachment")
  expect(active.headers.get("content-security-policy")).toContain("sandbox")
  expect((await fetch(origin + "/f/empty.txt")).status).toBe(200)
  expect((await fetch(origin + "/f/oversize.bin")).status).toBe(413)
})
test("dated paths serve images and PDFs with basename download headers", async () => {
  const url = origin + "/f/26/10-12-trade-modal.png"
  expect(fileKey("/f/26/10-12-trade-modal.png?direct=1")).toBe("26/10-12-trade-modal.png")
  const image = await fetch(url)
  expect(image.status).toBe(200)
  expect(image.headers.get("content-type")).toBe("image/png")
  expect(image.headers.get("content-disposition")).toBe('inline; filename="10-12-trade-modal.png"')
  expect(await image.text()).toBe("abcdefghij")
  const head = await fetch(url, { method: "HEAD" })
  expect(head.headers.get("content-length")).toBe("10")
  expect(await head.text()).toBe("")
  const conditional = await fetch(url, { headers: { "If-None-Match": head.headers.get("etag")! } })
  expect(conditional.status).toBe(304)
  const range = await fetch(url, { headers: { Range: "bytes=2-5" } })
  expect(range.status).toBe(206)
  expect(await range.text()).toBe("cdef")
  const pdf = await fetch(origin + "/f/26/10-12-report.pdf")
  expect(pdf.status).toBe(200)
  expect(pdf.headers.get("content-type")).toBe("application/pdf")
  expect(await pdf.text()).toBe("%PDF-1.4\n")
})
test("streams 256 MiB through HTTP and preserves its checksum", async () => {
  const response = await fetch(origin + "/f/large.bin")
  expect(response.status).toBe(200)
  expect(response.headers.get("content-length")).toBeNull()
  const hash = createHash("sha256")
  let count = 0
  for await (const chunk of response.body!) {
    hash.update(chunk)
    count += chunk.byteLength
  }
  expect(count).toBe(MAX_BYTES)
  const expected = createHash("sha256")
  const block = Buffer.alloc(1024 * 1024)
  for (let i = 0; i < 256; i++) expected.update(block)
  expect(hash.digest("hex")).toBe(expected.digest("hex"))
}, 30000)

test("large proxied downloads redirect while HEAD and bounded ranges stay local", async () => {
  const proxy = createFileServer(
    new DirectorySource(directory),
    "https://download.example.com",
  )
  await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve))
  const address = proxy.address() as { port: number }
  const url = `http://127.0.0.1:${address.port}/f/large.bin`
  try {
    const response = await fetch(url, { redirect: "manual" })
    expect(response.status).toBe(302)
    expect(response.headers.get("location")).toBe(
      "https://download.example.com/f/large.bin?direct=1",
    )
    expect(response.headers.get("cache-control")).toBe("no-store")
    const nestedUrl = `http://127.0.0.1:${address.port}/f/26/10-12-large.bin`
    const nested = await fetch(nestedUrl, { redirect: "manual" })
    expect(nested.status).toBe(302)
    expect(nested.headers.get("location")).toBe(
      "https://download.example.com/f/26/10-12-large.bin?direct=1",
    )
    const nestedRange = await fetch(nestedUrl + "?direct=1", {
      headers: { Range: "bytes=0-7" }, redirect: "manual",
    })
    expect(nestedRange.status).toBe(206)
    expect((await nestedRange.arrayBuffer()).byteLength).toBe(8)
    expect(
      (await fetch(url, { method: "HEAD" })).headers.get("content-length"),
    ).toBe(String(MAX_BYTES))
    for (const path of [url, url + "?direct=1"]) {
      const range = await fetch(path, {
        headers: { Range: "bytes=0-7" },
        redirect: "manual",
      })
      expect(range.status).toBe(206)
      expect((await range.arrayBuffer()).byteLength).toBe(8)
    }
    const direct = await fetch(url + "?direct=1", { redirect: "manual" })
    expect(direct.status).toBe(200)
    await direct.body!.cancel()
  } finally {
    proxy.closeAllConnections()
    await new Promise<void>((resolve) => proxy.close(() => resolve()))
  }
})
