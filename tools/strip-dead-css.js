/**
 * Remove stylesheet rules that can never match anything.
 *
 * Sections were taken off these pages over time — the discovery rails, the
 * breadcrumb, the old pre-redesign FAQ layout — and each time the markup went
 * but the rules stayed. Dead rules are not harmless: they are what a guard
 * keyed on a bare class name matches, which is the bug this project has hit
 * twice, and they make the next reader believe an element still exists.
 *
 * A rule is removed only when its selector names at least one class and every
 * class it names appears nowhere outside the stylesheet — not in the markup,
 * not in a script that builds markup. A selector mixing a dead class with a
 * live one is left alone, so this errs towards keeping things.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");
const { regions } = require("./lib/regions.js");

const ROOT = path.resolve(__dirname, "..");
const PAGES = ["index.html", "article.html"];

function deadClasses(html) {
  const r = regions(html);
  const live = r.markup + "\n" + r.script;
  const named = new Set();
  for (const m of r.style.matchAll(/\.([a-zA-Z][\w-]*)/g)) named.add(m[1]);
  return new Set([...named].filter((c) => !live.includes(c)));
}

/* Split a stylesheet into top-level chunks: at-rule blocks and plain rules. */
function chunks(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) { out.push({ kind: "text", text: css.slice(i) }); break; }
    const prelude = css.slice(i, open);
    let depth = 0, j = open;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") { depth--; if (depth === 0) break; }
    }
    const body = css.slice(open + 1, j);
    out.push({ kind: prelude.trimStart().startsWith("@") ? "at" : "rule", prelude, body });
    i = j + 1;
  }
  return out;
}

const isDeadSelector = (selector, dead) => {
  const parts = selector.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  return parts.every((sel) => {
    const cs = [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
    return cs.length > 0 && cs.every((c) => dead.has(c));
  });
};

function strip(css, dead, removed) {
  return chunks(css)
    .map((c) => {
      if (c.kind === "text") return c.text;
      if (c.kind === "at") {
        // a conditional group: strip inside it, drop it if nothing is left
        if (/^\s*@(media|supports)/.test(c.prelude)) {
          const inner = strip(c.body, dead, removed);
          if (!inner.trim()) return "";
          return c.prelude + "{" + inner + "}";
        }
        return c.prelude + "{" + c.body + "}";
      }
      if (isDeadSelector(c.prelude, dead)) {
        removed.push(c.prelude.trim().replace(/\s+/g, " "));
        return "";
      }
      return c.prelude + "{" + c.body + "}";
    })
    .join("");
}

let total = 0;
const report = [];

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  const before = fs.readFileSync(file, "utf8");
  const dead = deadClasses(before);

  // what rules does each live class have now? none may be lost.
  const liveClasses = [...new Set([...regions(before).style.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]))]
    .filter((c) => !dead.has(c));
  const countFor = (html, c) => (regions(html).style.match(new RegExp("\\." + c.replace(/-/g, "\\-") + "(?![\\w-])", "g")) || []).length;
  const wanted = new Map(liveClasses.map((c) => [c, countFor(before, c)]));

  const removed = [];
  let out = before.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g,
    (_m, attrs, css) => "<style" + attrs + ">" + strip(css, dead, removed) + "</style>");

  if (removed.length) {
    fs.writeFileSync(file, out);
    total += removed.length;
    report.push(`  ok  ${page}: removed ${removed.length} rule${removed.length === 1 ? "" : "s"} that match nothing`);
  } else {
    report.push(`  --  ${page}: nothing dead`);
  }

  /* ---------------------------------------------------------- checks */
  const after = fs.readFileSync(file, "utf8");
  const problems = [];
  for (const [c, n] of wanted) {
    const now = countFor(after, c);
    if (now !== n) problems.push(`${page}: .${c} lost ${n - now} of its ${n} rule reference(s)`);
  }
  let s = 0;
  for (const m of after.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    s++;
    const css = m[1].replace(/\/\*[\s\S]*?\*\//g, "");
    let d = 0, neg = false;
    for (const ch of css) { if (ch === "{") d++; else if (ch === "}") { d--; if (d < 0) neg = true; } }
    if (neg || d !== 0) problems.push(`${page} style#${s}: braces no longer balance (depth ${d}${neg ? ", went negative" : ""})`);
  }
  if (/\{\s*\}/.test(regions(after).style)) problems.push(`${page}: an empty rule was left behind`);
  if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
}

report.forEach((l) => console.log(l));
console.log(`  ok  ${total} dead rules gone; every live class kept all of its rules`);
