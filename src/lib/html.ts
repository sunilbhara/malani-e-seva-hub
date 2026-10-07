// Post HTML: sanitising for display, heading anchors for the table of contents, plain-text helpers.
import DOMPurify from "dompurify";

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

let hooksInstalled = false;

function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  // Every link opens safely in a new tab; only http(s)/mailto/tel are allowed (DOMPurify default URI policy).
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      node.setAttribute("decoding", "async");
    }
  });
}

export function isRichHtml(content: string): boolean {
  return /<\/?(p|h[1-6]|ul|ol|li|table|strong|em|a|br|blockquote|img)\b/i.test(content);
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text written before the rich editor existed becomes paragraphs. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Sanitises post HTML and gives every h2/h3 a stable id (section-1, section-2…)
 * so the table of contents can link to it (audit B9).
 */
export function preparePostHtml(content: string): { html: string; headings: Heading[] } {
  installHooks();
  const source = isRichHtml(content) ? content : plainTextToHtml(content);
  const clean = DOMPurify.sanitize(source, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "iframe"],
    FORBID_ATTR: ["style", "id"],
  });
  if (typeof document === "undefined") return { html: clean, headings: [] };
  // `clean` is DOMPurify output and the container is never attached to the page.
  const container = document.createElement("div");
  container.innerHTML = clean;
  const headings: Heading[] = [];
  container.querySelectorAll("h2, h3").forEach((el, index) => {
    const id = `section-${index + 1}`;
    el.setAttribute("id", id);
    const text = el.textContent?.trim() ?? "";
    if (text) headings.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
  });
  return { html: container.innerHTML, headings };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptOf(html: string, max = 160): string {
  const text = stripHtml(html);
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
