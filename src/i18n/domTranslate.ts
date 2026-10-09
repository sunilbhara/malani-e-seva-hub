/**
 * English mode for the reader interface (Phase 4).
 *
 * Interface copy is written in Hindi inside the components. When a reader picks English, this
 * swaps visible interface text and a few attributes (aria-label, placeholder, title, alt) using
 * the dictionary in en-ui.ts, and keeps doing so as React re-renders (MutationObserver).
 * It never touches post content (.post-body), form values, editable areas, anything marked
 * [data-no-translate], or the admin area. Switching back restores the original Hindi.
 */
import { EN_UI } from "./en-ui";

const DEVANAGARI = /[ऀ-ॿ]/;
const ATTRS = ["aria-label", "placeholder", "title", "alt"] as const;
const SKIP_SELECTOR = ".post-body, [data-no-translate], textarea, script, style, [contenteditable='true'], [contenteditable='']";

const exact = new Map<string, string>();
const patterns: Array<{ re: RegExp; out: string }> = [];
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const [hi, en] of Object.entries(EN_UI)) {
  if (hi.includes("{}")) patterns.push({ re: new RegExp(`^${hi.split("{}").map(escape).join("(.+?)")}$`), out: en });
  else exact.set(hi, en);
}
// Longest patterns first so specific wordings win over generic ones.
patterns.sort((a, b) => b.re.source.length - a.re.source.length);

/** Single words that may appear inside dates/times ("8 अक्टू 2026", "3 घंटे पहले"). */
const TOKENS: Record<string, string> = {
  जनवरी: "January", फरवरी: "February", मार्च: "March", अप्रैल: "April", मई: "May", जून: "June", जुलाई: "July",
  अगस्त: "August", सितंबर: "September", अक्टूबर: "October", नवंबर: "November", दिसंबर: "December",
  जन: "Jan", फर: "Feb", अग: "Aug", सितं: "Sep", अक्टू: "Oct", नवं: "Nov", दिसं: "Dec",
  पहले: "ago", मिनट: "min", घंटे: "h", दिन: "days", वर्ष: "years", पद: "posts", से: "from", तक: "to",
};

/** English for a Hindi interface string, or null when there is nothing to translate. */
export function translateText(text: string): string | null {
  if (!DEVANAGARI.test(text)) return null;
  const core = text.replace(/\s+/g, " ").trim();
  const lead = text.match(/^\s*/)?.[0] ?? "";
  const trail = text.match(/\s*$/)?.[0] ?? "";
  const wrap = (s: string) => lead + s + trail;

  const hit = exact.get(core);
  if (hit !== undefined) return wrap(hit);

  for (const { re, out } of patterns) {
    const m = core.match(re);
    if (m) {
      let i = 1;
      return wrap(out.replace(/\{\}/g, () => {
        const part = m[i++] ?? "";
        return translateText(part)?.trim() ?? part;
      }));
    }
  }

  // Dates, times and counts: accept only if every Hindi word is a known token.
  const tokenised = core.replace(/[ऀ-ॿ]+/g, (w) => TOKENS[w] ?? w);
  return DEVANAGARI.test(tokenised) ? null : wrap(tokenised);
}

const textOriginal = new Map<Text, { original: string; written: string }>();
const attrOriginal = new Map<Element, Map<string, { original: string; written: string }>>();

const inAdmin = () => typeof location !== "undefined" && location.pathname.startsWith("/admin");
const skipped = (el: Element | null) => !el || Boolean(el.closest(SKIP_SELECTOR));

function processText(node: Text) {
  if (skipped(node.parentElement)) return;
  const current = node.nodeValue ?? "";
  const seen = textOriginal.get(node);
  if (seen && seen.written === current) return; // our own write
  const translated = translateText(current);
  if (translated === null || translated === current) return;
  textOriginal.set(node, { original: current, written: translated });
  node.nodeValue = translated;
}

function processElement(el: Element) {
  if (skipped(el) && !el.matches("textarea")) return;
  for (const attr of ATTRS) {
    const value = el.getAttribute(attr);
    if (!value || !DEVANAGARI.test(value)) continue;
    const map = attrOriginal.get(el) ?? new Map();
    if (map.get(attr)?.written === value) continue;
    const translated = translateText(value);
    if (translated === null) continue;
    map.set(attr, { original: value, written: translated });
    attrOriginal.set(el, map);
    el.setAttribute(attr, translated);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return processText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (skipped(el) && !el.matches("textarea")) return;
  processElement(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      if (n.nodeType !== Node.ELEMENT_NODE || !(n as Element).matches(SKIP_SELECTOR)) return NodeFilter.FILTER_ACCEPT;
      // Text areas: translate the placeholder, never the typed text.
      if ((n as Element).matches("textarea")) processElement(n as Element);
      return NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) processText(n as Text);
    else processElement(n as Element);
  }
}

let titleOriginal: string | null = null;
function processTitle() {
  const t = document.title;
  if (!DEVANAGARI.test(t)) return;
  const translated = translateText(t);
  if (translated) {
    titleOriginal = t;
    document.title = translated;
  }
}

/** Starts English mode; returns a function that stops it and restores the Hindi. */
export function startEnglish(): () => void {
  const run = () => {
    if (inAdmin()) return;
    walk(document.body);
    processTitle();
  };
  run();
  const observer = new MutationObserver((mutations) => {
    if (inAdmin()) return;
    for (const m of mutations) {
      if (m.type === "characterData") processText(m.target as Text);
      else if (m.type === "attributes") processElement(m.target as Element);
      else m.addedNodes.forEach((n) => walk(n));
    }
    processTitle();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  const titleEl = document.querySelector("title");
  const titleObserver = new MutationObserver(processTitle);
  if (titleEl) titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });

  return () => {
    observer.disconnect();
    titleObserver.disconnect();
    textOriginal.forEach(({ original, written }, node) => {
      if (node.isConnected && node.nodeValue === written) node.nodeValue = original;
    });
    attrOriginal.forEach((map, el) => {
      map.forEach(({ original, written }, attr) => {
        if (el.isConnected && el.getAttribute(attr) === written) el.setAttribute(attr, original);
      });
    });
    textOriginal.clear();
    attrOriginal.clear();
    if (titleOriginal && !DEVANAGARI.test(document.title)) document.title = titleOriginal;
    titleOriginal = null;
  };
}
