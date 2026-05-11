/** Strip HTML tags for excerpts and read-time (client-safe). */
export function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const d = document.createElement("div");
    d.innerHTML = html;
    const t = (d.textContent || d.innerText || "").replace(/\s+/g, " ").trim();
    if (t) return t;
  }
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function isRichHtml(content: string): boolean {
  return /<\s*(p|h[1-6]|ul|ol|li|div|blockquote|strong|em|b|i|br|img|a)\b/i.test(content.trim());
}

/** Plain-text excerpt for cards; supports TipTap HTML bodies. */
export function postExcerpt(content: string, maxLen = 160): string {
  const plain = stripHtml(content).replace(/\s+/g, " ").trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

export function readTimeMinutes(content: string, wordsPerMinute = 200): number {
  const plain = stripHtml(content);
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  if (words < 8 && plain.length > 0) {
    return Math.max(1, Math.ceil(plain.length / 550));
  }
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
