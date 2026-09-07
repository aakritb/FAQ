/**
 * Make the hero headline static.
 *
 * It used to type and delete its way through five phrases behind a blinking
 * caret. It now reads "Hi! Let's help you get answers faster." and stays
 * there — the phrase the animation ended on, and the one the reduced-motion
 * path already showed.
 *
 * The animated half carried aria-hidden with a screen-reader-only duplicate
 * beside it, because text that rewrites itself is unreadable aloud. With
 * static text both go: the headline is now simply read as written.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");
const { hasMarkup, hasScript, hasStyleRule } = require("./lib/regions");

const ROOT = path.resolve(__dirname, "..");
const file = path.join(ROOT, "index.html");
const HEADLINE = "get answers faster.";

let html = fs.readFileSync(file, "utf8");
const before = html;
const done = [];

/* 1. the markup: one heading, no caret, no hidden duplicate */
// Matches whatever shape the second half is in — the original animated span
// with its screen-reader twin, an animated span on its own, or the static text
// already in place — and rebuilds it. Rewriting the static form produces the
// same bytes, so this stays idempotent.
const OLD_H1 = /<h1><span class="hc-hello">([^<]*)<\/span>[\s\S]*?<\/h1>/;
const m = html.match(OLD_H1);
if (m) {
  html = html.replace(OLD_H1, () =>
    // A space between the spans: they are block-level so it changes nothing
    // visually, but without it the heading is read aloud as "youget".
    `<h1><span class="hc-hello">${m[1]}</span> <span class="hc-typing-line">${HEADLINE}</span></h1>`);
  done.push("headline");
}

/* 2. the typing loop */
// Anchored on the line that follows the block. A non-greedy match up to
// "setTimeout(typeNext,1550);}" stops at the identical call *inside* the loop
// and cuts the statement in half.
const SCRIPT = /\n?  const typed=document\.getElementById\('hc-typed'\);[\s\S]*?\n(?=  const categories=\[)/;
if (SCRIPT.test(html)) { html = html.replace(SCRIPT, "\n"); done.push("typing loop"); }

/* 3. the caret, its blink, and the now-unused visually-hidden helper */
const CARET_RULES = [
  /\.hc-typing-caret\{display:inline-block;[^}]*\}/g,
  /\.hc-typing-caret\{animation:none\}/g,
  /@keyframes hc-caret-blink\{[^}]*\}/g,
  /\.hc-sr-only\{[^}]*\}/g,
];
for (const re of CARET_RULES) {
  if (re.test(html)) { html = html.replace(re, ""); done.push("css"); }
}

/* That reduced-motion block held nothing but the caret rule, so it is empty
 * now. Only removed when it really is empty. */
const EMPTY_MEDIA = /@media\(prefers-reduced-motion:reduce\)\{\s*\}/g;
if (EMPTY_MEDIA.test(html)) { html = html.replace(EMPTY_MEDIA, ""); done.push("empty media block"); }

if (html !== before) {
  fs.writeFileSync(file, html);
  console.log(`  ok  index.html: ${[...new Set(done)].join(", ")} — headline is now static`);
} else {
  console.log("  --  index.html: headline already static");
}

/* ------------------------------------------------------------- checks */
const out = fs.readFileSync(file, "utf8");
const problems = [];
if (hasScript(out, "typingPhrases")) problems.push("the typing loop is still there");
if (hasScript(out, "getElementById('hc-typed')")) problems.push("still looking up the animated span");
if (hasMarkup(out, "hc-typing-caret")) problems.push("the caret element is still in the markup");
if (hasStyleRule(out, ".hc-typing-caret")) problems.push("caret styles left behind");
if (out.includes("@keyframes hc-caret-blink")) problems.push("the caret blink animation is still defined");
if (hasMarkup(out, "hc-sr-only")) problems.push("the screen-reader duplicate is still in the markup");
if (hasStyleRule(out, ".hc-sr-only")) problems.push("hc-sr-only styles left behind");
if (hasMarkup(out, 'aria-hidden="true"><span id="hc-typed"'))
  problems.push("the headline is still hidden from screen readers");
if (!hasMarkup(out, `<span class="hc-typing-line">${HEADLINE}</span>`))
  problems.push(`the headline does not read "${HEADLINE}"`);
if (!hasMarkup(out, `</span> <span class="hc-typing-line">`))
  problems.push("no space between the heading's two spans; it would be read as one word");
if (!hasStyleRule(out, ".hc-typing-line")) problems.push("the headline's second-line styling is gone");
if (/@media\([^)]*\)\{\s*\}/.test(out)) problems.push("an empty @media block was left behind");
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log(`  ok  headline reads "${HEADLINE}", nothing animates it, no caret or hidden duplicate left`);
