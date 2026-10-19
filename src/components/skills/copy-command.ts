for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-copy-command]",
)) {
  button.hidden = false
  button.addEventListener("click", async () => {
    const label = button.querySelector("span")!
    try {
      await navigator.clipboard.writeText(button.dataset.copyCommand!)
      label.textContent = "Copied"
    } catch {
      label.textContent = "Select text to copy"
    }
    setTimeout(() => (label.textContent = "Copy"), 2500)
  })
}
