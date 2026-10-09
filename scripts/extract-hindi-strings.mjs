// Lists every Hindi UI string in the reader-facing code (JSX text, string literals and the static
// parts of template literals) so src/i18n/en-ui.ts can translate them.
// Usage: node scripts/extract-hindi-strings.mjs > /tmp/hindi.json
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOTS = ["src/components", "src/pages", "src/lib", "src/hooks"];
const SKIP = [/__tests__/, /[\\/]admin[\\/]/, /AdminCatalog|AdminCollections/, /src[\\/]i18n[\\/]/];
const DEVANAGARI = /[ऀ-ॿ]/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx?|mjs)$/.test(entry.name) && !SKIP.some((r) => r.test(p))) out.push(p);
  }
  return out;
}

const found = new Map();
const add = (raw, file) => {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || !DEVANAGARI.test(text)) return;
  const entry = found.get(text) ?? { count: 0, files: new Set() };
  entry.count += 1;
  entry.files.add(path.basename(file));
  found.set(text, entry);
};

for (const file of ROOTS.flatMap((r) => walk(r))) {
  const src = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isJsxText(node)) add(node.getText(), file);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node.text, file);
    else if (ts.isTemplateExpression(node)) {
      // Keep the pattern with {} placeholders so it can be matched with numbers/names filled in.
      let pattern = node.head.text;
      for (const span of node.templateSpans) pattern += "{}" + span.literal.text;
      add(pattern, file);
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
}

const list = [...found.entries()].sort((a, b) => b[1].count - a[1].count).map(([text, v]) => ({ text, count: v.count, files: [...v.files].slice(0, 3) }));
process.stdout.write(JSON.stringify(list, null, 1));
