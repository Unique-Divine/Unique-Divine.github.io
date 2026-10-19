const root = document.querySelector<HTMLElement>("[data-skills-catalogue]")
if (root) {
  const search = root.querySelector<HTMLElement>("[data-skills-search]")!
  const input = root.querySelector<HTMLInputElement>("input")!
  const clear = root.querySelector<HTMLButtonElement>("[data-skills-clear]")!
  const cards = [...root.querySelectorAll<HTMLElement>("[data-skill-card]")]
  const count = root.querySelector("[data-skills-count]")!
  const status = root.querySelector("[data-skills-status]")!
  const empty = root.querySelector<HTMLElement>("[data-skills-empty]")!
  search.hidden = false
  const update = () => {
    const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
    let visible = 0
    for (const card of cards) {
      card.hidden = !terms.every((term) => card.dataset.search!.includes(term))
      if (!card.hidden) visible++
    }
    count.textContent = String(visible)
    status.textContent = `${visible} matching skills`
    empty.hidden = visible > 0
    clear.hidden = !input.value
  }
  input.addEventListener("input", update)
  clear.addEventListener("click", () => {
    input.value = ""
    update()
    input.focus()
  })
}
