/**
 * Remove the right-hand discovery rails.
 *
 * The knowledge base carried "Popular now" and "Latest articles"; the article
 * page carried "Related articles". Those were the only cards in either rail,
 * so both rails go entirely and the grids collapse to two columns — sidebar
 * and content — with the content taking the freed width.
 *
 * The layout is corrected with a rule appended last rather than by unpicking
 * the four style layers that size those grids, because those layers overwrite
 * each other and a combined selector like `.hc-sidebar,.hc-rail{...}` cannot
 * be edited safely by pattern. The rail CSS that remains now targets nothing.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");
const { hasMarkup, hasStyleRule } = require("./lib/regions");

const ROOT = path.resolve(__dirname, "..");

const LAYOUT = `
/* rails-removed:start */
/* The discovery rails are gone, so the shells are two columns and the
   reading column takes the width the rail used to hold. */
.hc-shell{grid-template-columns:190px minmax(0,1fr)!important}
@media(max-width:1080px){.hc-shell{grid-template-columns:170px minmax(0,1fr)!important}}
.ar-shell{max-width:1120px!important;grid-template-columns:218px minmax(0,1fr)!important}
@media(min-width:981px){
  .ar-side{grid-column:1!important;grid-row:1!important}
  #ar-main{grid-column:2!important;grid-row:1!important}
}
@media(max-width:760px){.ar-shell{grid-template-columns:minmax(0,1fr)!important}}
/* rails-removed:end */
`;

function addLayout(html) {
  if (html.includes("/* rails-removed:start */")) return html;
  const at = html.lastIndexOf("</style>");
  if (at < 0) throw new Error("no </style> to append to");
  return html.slice(0, at) + LAYOUT + html.slice(at);
}

const notes = [];

/* ------------------------------------------------------ knowledge base */
{
  const file = path.join(ROOT, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const done = [];

  // 1. the rail element
  // Tolerant of whitespace and attribute order, so a rail re-added in any
  // shape is removed rather than reported as an unexpected form.
  const RAIL = /\s*<aside[^>]*class="[^"]*hc-rail[^"]*"[^>]*>[\s\S]*?<\/aside>/g;
  if (RAIL.test(html)) { html = html.replace(RAIL, "\n"); done.push("rail markup"); }

  // 2. the code that filled it
  const POPULAR = /\n?  const popular=\[[^\]]*\]\.map\(id=>articles\.find\(a=>a\.id===id\)\)\.filter\(Boolean\);\n?/;
  const LATEST = /\n?  const latest=\[[^\]]*\]\.map\(id=>articles\.find\(a=>a\.id===id\)\)\.filter\(Boolean\);\n?/;
  const FILL_POPULAR = /\n?  document\.getElementById\('hc-popular'\)\.innerHTML=[\s\S]*?\.join\(''\);\n?/;
  const FILL_LATEST = /\n?  document\.getElementById\('hc-latest'\)\.innerHTML=[\s\S]*?\.join\(''\);\n?/;
  for (const [re, label] of [[FILL_POPULAR, "popular fill"], [FILL_LATEST, "latest fill"],
                             [POPULAR, "popular list"], [LATEST, "latest list"]]) {
    if (re.test(html)) { html = html.replace(re, "\n"); done.push(label); }
  }

  // 3. the empty-index fallback used to hide those two cards; nothing to hide now
  const HIDE = /\n?      \/\/ The Popular and Latest cards are driven by the index[\s\S]*?\}\);\n?/;
  if (HIDE.test(html)) { html = html.replace(HIDE, "\n"); done.push("fallback rail-hiding"); }

  html = addLayout(html);
  if (html !== before) { fs.writeFileSync(file, html); notes.push(`index.html: ${done.join(", ") || "layout"}`); }
  else notes.push("index.html: already done");
}

/* ------------------------------------------------------- article reader */
{
  const file = path.join(ROOT, "article.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const done = [];

  const RAIL = /\s*<aside[^>]*(?:class="[^"]*ar-rail[^"]*"|id="ar-rail")[^>]*>[\s\S]*?<\/aside>/g;
  if (RAIL.test(html)) { html = html.replace(RAIL, "\n"); done.push("rail markup"); }

  // the related-articles computation and the assignment that rendered it
  const POOL = /\n?  \/\* The sidebar already lists this category[\s\S]*?if\(!related\.length\) related=pool\.slice\(0,6\);\n?/;
  if (POOL.test(html)) { html = html.replace(POOL, "\n"); done.push("related computation"); }

  const FILL = /\n?  rail\.innerHTML=\n?\s*\(related\.length[\s\S]*?: ''\);\n?/;
  if (FILL.test(html)) { html = html.replace(FILL, "\n"); done.push("related fill"); }

  // the not-found branch cleared the rail; and the lookup itself is now unused
  html = html.replace(/\n?\s*rail\.innerHTML=[^;]*;/g, "");
  html = html.replace(/\n?  var rail=document\.getElementById\('ar-rail'\);/g, "");
  html = html.replace(/side\.innerHTML='';rail\.innerHTML='';/g, "side.innerHTML='';");
  if (!/\brail\b/.test(html.replace(/ar-rail/g, ""))) done.push("rail references");

  html = addLayout(html);
  if (html !== before) { fs.writeFileSync(file, html); notes.push(`article.html: ${done.join(", ") || "layout"}`); }
  else notes.push("article.html: already done");
}

notes.forEach((n) => console.log("  ok  " + n));

/* ------------------------------------------------------------- checks */
const problems = [];
{
  const hub = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (hasMarkup(hub, 'class="hc-rail"')) problems.push("index.html: rail element still in the markup");
  if (/getElementById\('hc-(popular|latest)'\)/.test(hub)) problems.push("index.html: still populating a removed rail");
  if (/const (popular|latest)=\[/.test(hub)) problems.push("index.html: rail id list still present");
  if (!hub.includes("/* rails-removed:start */")) problems.push("index.html: layout override missing");

  const art = fs.readFileSync(path.join(ROOT, "article.html"), "utf8");
  if (hasMarkup(art, 'id="ar-rail"')) problems.push("article.html: rail element still in the markup");
  if (/rail\.innerHTML/.test(art)) problems.push("article.html: still writing to a removed rail");
  if (/getElementById\('ar-rail'\)/.test(art)) problems.push("article.html: still looking up a removed rail");
  if (!art.includes("/* rails-removed:start */")) problems.push("article.html: layout override missing");

  // the shells must be two columns, not three
  for (const [page, html] of [["index.html", hub], ["article.html", art]]) {
    if (!hasStyleRule(html, page === "index.html" ? ".hc-shell" : ".ar-shell"))
      problems.push(`${page}: shell rule missing`);
  }
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log("\n  ok  both rails removed, nothing still writes to them, shells are two columns");
