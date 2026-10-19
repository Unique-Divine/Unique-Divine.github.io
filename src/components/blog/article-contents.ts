function initializeContents(root: HTMLElement) {
  const links = [...root.querySelectorAll<HTMLAnchorElement>("a[href^='#']")]
  const sections = [...new Set(links.map((link) => link.hash.slice(1)))].map(
    (id) => ({ id, element: document.getElementById(id) }),
  )
  const details = root.querySelector<HTMLDetailsElement>("details")!
  const summary = details.querySelector<HTMLElement>("summary")!
  const header = document.getElementById("header")
  const currentLabel = root.querySelector<HTMLElement>(
    "[data-contents-current]",
  )!
  let pending = false

  function update() {
    pending = false
    const headerBottom = Math.max(
      0,
      header?.getBoundingClientRect().bottom ?? 0,
    )
    const mobile = getComputedStyle(details).display !== "none"
    const barHeight = mobile ? details.getBoundingClientRect().height : 0
    const threshold = headerBottom + barHeight + 32
    root.style.setProperty("--contents-header-bottom", `${headerBottom}px`)
    root.style.setProperty("--contents-bar-height", `${barHeight}px`)
    root.style.setProperty("--contents-top", `${threshold}px`)
    if (!mobile) details.open = false
    let current = sections[0]?.id
    for (const section of sections) {
      if (
        section.element &&
        section.element.getBoundingClientRect().top <= threshold + 1
      )
        current = section.id
    }
    for (const link of links) {
      if (link.hash.slice(1) === current) {
        link.setAttribute("aria-current", "location")
        currentLabel.textContent = link.textContent
        currentLabel.title = link.textContent ?? ""
      } else link.removeAttribute("aria-current")
    }
    for (const { element } of sections) {
      if (element) element.style.scrollMarginTop = `${threshold}px`
    }
  }

  function schedule() {
    if (pending) return
    pending = true
    requestAnimationFrame(update)
  }

  for (const link of links)
    link.addEventListener("click", () => {
      details.open = false
    })
  document.addEventListener("click", (event) => {
    if (!root.contains(event.target as Node)) details.open = false
  })
  details.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && details.open) {
      details.open = false
      summary.focus({ preventScroll: true })
    }
  })
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule)
  window.addEventListener("hashchange", schedule)
  window.addEventListener("load", schedule, { once: true })
  const observer = new ResizeObserver(schedule)
  if (header) observer.observe(header)
  observer.observe(details)
  update()
}

for (const root of document.querySelectorAll<HTMLElement>(
  "[data-article-contents]",
))
  initializeContents(root)
