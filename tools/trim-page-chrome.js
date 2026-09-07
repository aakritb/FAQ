/**
 * Remove two pieces of page furniture that were not carrying their weight.
 *
 * 1. The article page's breadcrumb bar. A reader still gets back three other
 *    ways — the logo, "All articles" in the section navigator, and the header
 *    search — and the article's own product and category are printed in its
 *    meta line, so the bar was repeating what the page already said.
 *
 * 2. The knowledge base's "One knowledge base for your entire firm" heading
 *    and its subtitle. The hero above it already says what the page is for.
 *
 * The welcome block also held the search result count, which the page writes
 * to on every render. Deleting it outright would throw on the first keystroke,
 * so the count moves next to the results heading, which is what it counts.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");
const { hasMarkup, hasStyleRule, hasScript } = require("./lib/regions");

const ROOT = path.resolve(__dirname, "..");
const notes = [];

/* ------------------------------------------------ 1. article breadcrumbs */
{
  const file = path.join(ROOT, "article.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const done = [];

  const BAR = /\s*<nav class="ar-crumbs"[\s\S]*?<\/nav>/;
  if (BAR.test(html)) { html = html.replace(BAR, ""); done.push("bar"); }

  // the two assignments that filled it, and the lookup itself
  html = html.replace(/\n?\s*crumbs\.innerHTML=[\s\S]*?;(?=\n)/g, "");
  html = html.replace(/\n?  var crumbs=document\.getElementById\('ar-crumbs'\);/g, "");
  // and the comment that described them, which would otherwise describe
  // something the page no longer has
  html = html.replace(/\n?\s*\/\* ---- breadcrumbs stay inside this design[^*]*\*\/\n?/g, "\n");
  if (!/\bcrumbs\b/.test(html)) done.push("script");

  const CSS = [
    /\/\* ---- breadcrumbs ---- \*\/\n?/,
    /\.ar-crumbs\{[^}]*\}/g,
    /\.ar-crumbs-inner\{[^}]*\}/g,
    /\.ar-crumbs a\{[^}]*\}/g,
    /\.ar-crumbs a:hover,\.ar-crumbs a:focus-visible\{[^}]*\}/g,
    /\.ar-crumbs span\[aria-current\]\{[^}]*\}/g,
  ];
  for (const re of CSS) if (re.test(html)) { html = html.replace(re, ""); }
  done.push("css");

  if (html !== before) { fs.writeFileSync(file, html); notes.push(`article.html: breadcrumbs removed (${done.join(", ")})`); }
  else notes.push("article.html: already done");
}

/* -------------------------------------------- 2. hub welcome heading */
{
  const file = path.join(ROOT, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const done = [];

  // The count lives inside the block being removed and is written to on every
  // render, so move it rather than drop it.
  const BLOCK = /\s*<div class="hc-welcome">[\s\S]*?<span class="hc-count" id="hc-count"><\/span>\s*<\/div>/;
  if (BLOCK.test(html)) {
    html = html.replace(BLOCK, "");
    done.push("heading and subtitle");
  }

  const HEAD = '<div class="hc-section-head"><h3 id="hc-results-title">All help articles</h3>';
  if (!hasMarkup(html, 'id="hc-count"')) {
    if (!html.includes(HEAD)) throw new Error("index.html: results heading not found, cannot rehome the count");
    html = html.replace(HEAD, () => HEAD + '<span class="hc-count" id="hc-count"></span>');
    done.push("count moved beside the results heading");
  }

  for (const re of [/\.hc-welcome\{[^}]*\}/g, /\.hc-welcome h2\{[^}]*\}/g, /\.hc-welcome p\{[^}]*\}/g]) {
    if (re.test(html)) html = html.replace(re, "");
  }
  // the count now sits next to the heading, so let the heading keep the space
  if (!html.includes(".hc-section-head h3+.hc-count")) {
    const at = html.lastIndexOf("</style>");
    html = html.slice(0, at) +
      "\n/* The result count sits beside the results heading now that the welcome\n" +
      "   block that used to hold it is gone. */\n" +
      ".hc-section-head h3+.hc-count{margin-right:auto}\n" +
      html.slice(at);
    done.push("count styling");
  }

  if (html !== before) { fs.writeFileSync(file, html); notes.push(`index.html: ${done.join(", ")}`); }
  else notes.push("index.html: already done");
}

notes.forEach((n) => console.log("  ok  " + n));

/* ------------------------------------------------------------- checks */
const problems = [];
{
  const art = fs.readFileSync(path.join(ROOT, "article.html"), "utf8");
  if (hasMarkup(art, "ar-crumbs")) problems.push("article.html: the breadcrumb bar is still in the markup");
  if (hasScript(art, "crumbs.innerHTML")) problems.push("article.html: still writing breadcrumbs");
  if (hasScript(art, "getElementById('ar-crumbs')")) problems.push("article.html: still looking up the breadcrumb bar");
  if (hasStyleRule(art, ".ar-crumbs")) problems.push("article.html: breadcrumb styles left behind");
  if (/\bcrumbs\b/.test(art)) problems.push("article.html: a stale breadcrumb reference or comment remains");
  // a reader must still have a way back
  if (!hasMarkup(art, 'href="index.html" aria-label="AssureOne help center home"'))
    problems.push("article.html: the logo no longer links home");
  if (!hasScript(art, "ar-side-back")) problems.push("article.html: the All articles link is gone");
  if (!hasMarkup(art, 'id="ar-search"')) problems.push("article.html: the header search is gone");

  const hub = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (hasMarkup(hub, "hc-welcome")) problems.push("index.html: the welcome block is still in the markup");
  if (hasStyleRule(hub, ".hc-welcome")) problems.push("index.html: welcome styles left behind");
  if (hub.includes("One knowledge base for your entire firm")) problems.push("index.html: the heading text is still present");
  // the count still has to exist, or every render throws
  if (!hasMarkup(hub, 'id="hc-count"')) problems.push("index.html: the result count element is gone; render() would throw");
  if (!hasScript(hub, "count.textContent=active")) problems.push("index.html: the count is no longer written");
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log("\n  ok  breadcrumbs and welcome heading gone, count rehomed, all routes back intact");
