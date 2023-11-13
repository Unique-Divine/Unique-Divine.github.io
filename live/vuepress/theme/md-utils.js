export function replaceUnsafeChar(ch) {
    return HTML_REPLACEMENTS[ch];
}
export const HTML_REPLACEMENTS = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
};
export function escapeHtml(str) {
    if (/[&<>"]/.test(str)) {
        return str.replace(/[&<>"]/g, replaceUnsafeChar);
    }
    return str;
}
