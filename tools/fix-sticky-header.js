/**
 * The sticky header lost its stickiness, so the search bar scrolled away.
 *
 * The "Welcoming typed hero" block ended with one brace too many:
 *
 *     ...min-height:1.12em;color:#5c45e7}}
 *                                       ^ stray
 *
 * A stray "}" at the top level of a stylesheet is not simply ignored. The
 * parser treats it as the start of a qualified rule and swallows tokens as
 * that rule's prelude until the next "{" — so it consumed the selector of the
 * rule immediately following it. That rule was
 *
 *     .topbar{position:sticky;top:0;z-index:30}
 *
 * which is what makes the header, and the search inside it, stay reachable.
 * With it dropped, an earlier .topbar{position:relative} won and the whole bar
 * scrolled out of view. Nothing else in the sheet was affected, which is why
 * the page looked right until you scrolled.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "index.html");
const STRAY = "min-height:1.12em;color:#5c45e7}}";
const FIXED = "min-height:1.12em;color:#5c45e7}";

let html = fs.readFileSync(PAGE, "utf8");

if (html.includes(STRAY)) {
  html = html.replace(STRAY, FIXED);
  fs.writeFileSync(PAGE, html);
  console.log("  ok  removed the stray brace after the typed-hero rules");
} else {
  console.log("  --  already applied");
}

/* --------------------------------------------------------------- checks */
const out = fs.readFileSync(PAGE, "utf8");
const problems = [];

// every stylesheet must balance, and must never dip below zero
let n = 0;
for (const m of out.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
  n++;
  const css = m[1].replace(/\/\*[\s\S]*?\*\//g, "");
  let d = 0;
  let neg = false;
  for (const ch of css) {
    if (ch === "{") d++;
    else if (ch === "}") { d--; if (d < 0) neg = true; }
  }
  if (neg) problems.push(`style#${n}: a stray } closes more than was opened`);
  if (d !== 0) problems.push(`style#${n}: ${d > 0 ? d + " unclosed" : -d + " extra"} brace(s)`);
}

// and the rule that the stray brace was eating must be present and last
const sticky = /\.topbar\{position:sticky;top:0;z-index:30\}/;
if (!sticky.test(out)) problems.push("the sticky-header rule is missing");
const lastRelative = out.lastIndexOf(".topbar{position:relative");
const lastSticky = out.search(sticky);
if (lastRelative > -1 && lastSticky > -1 && lastRelative > lastSticky)
  problems.push("a later .topbar{position:relative} would override the sticky rule");

if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log("  ok  stylesheets balance; the header's sticky rule survives parsing");
