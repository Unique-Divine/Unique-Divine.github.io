class ExpandableDiagram extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return
    const preview = this.querySelector<HTMLImageElement>(
      "[data-diagram-preview]",
    )!
    const expanded = this.querySelector<HTMLImageElement>(
      "[data-diagram-expanded]",
    )!
    const opener = this.querySelector<HTMLButtonElement>("[data-diagram-open]")!
    const dialog = this.querySelector<HTMLDialogElement>("dialog")!

    const syncImage = () => {
      for (const name of ["src", "alt", "width", "height"]) {
        const value = preview.getAttribute(name)
        if (value !== null) expanded.setAttribute(name, value)
      }
    }
    const syncLabel = () => {
      opener.setAttribute("aria-label", `Expand diagram: ${preview.alt}`)
      dialog.setAttribute("aria-label", `Expanded diagram: ${preview.alt}`)
      if (dialog.open) syncImage()
    }
    opener.addEventListener("click", () => {
      syncLabel()
      syncImage()
      dialog.showModal()
    })
    this.querySelector("[data-diagram-close]")!.addEventListener("click", () =>
      dialog.close(),
    )
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return
      const box = dialog.getBoundingClientRect()
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        dialog.close()
    })
    dialog.addEventListener("close", () =>
      opener.focus({ preventScroll: true }),
    )
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return
      const targets = [
        ...dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [tabindex='0']",
        ),
      ]
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    })
    new MutationObserver(syncLabel).observe(preview, {
      attributes: true,
      attributeFilter: ["src", "alt", "width", "height"],
    })
    opener.disabled = false
    this.dataset.ready = "true"
  }
}

if (!customElements.get("expandable-diagram"))
  customElements.define("expandable-diagram", ExpandableDiagram)
