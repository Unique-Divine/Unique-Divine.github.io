const root = document.querySelector<HTMLElement>("[data-mcp-tools]")
if (root) {
  const search = root.querySelector<HTMLElement>("[data-mcp-search]")!
  const input = search.querySelector<HTMLInputElement>("input")!
  const rows = [...root.querySelectorAll<HTMLElement>("[data-mcp-tool]")]
  const count = root.querySelector("[data-mcp-tool-count]")!
  const status = root.querySelector("[data-mcp-status]")!
  const empty = root.querySelector<HTMLElement>("[data-mcp-empty]")!
  search.hidden = false
  input.addEventListener("input", () => {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
    let visible = 0
    for (const row of rows) {
      row.hidden = !terms.every((term) => row.dataset.search!.includes(term))
      if (!row.hidden) visible++
    }
    count.textContent = terms.length
      ? `${visible} of ${rows.length}`
      : String(rows.length)
    status.textContent = `${visible} matching tools`
    empty.hidden = visible > 0
  })
}
