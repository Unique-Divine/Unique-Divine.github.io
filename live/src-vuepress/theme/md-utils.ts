export function replaceUnsafeChar(ch: string): string {
  return HTML_REPLACEMENTS[ch]
}

export const HTML_REPLACEMENTS: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}

export function escapeHtml(str: string): string {
  if (/[&<>"]/.test(str)) {
    return str.replace(/[&<>"]/g, replaceUnsafeChar)
  }
  return str
}
