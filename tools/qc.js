/**
 * Static QC for the whole help centre. Reports every problem it finds rather
 * than stopping at the first, and exits non-zero if anything failed.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const { hasStyle, hasStyleRule, hasScript, hasMarkup, hasMarkupOrScript, countIn } = require("./lib/regions");

const ROOT = require("path").resolve(__dirname, "..");
const PAGES = ["index.html", "article.html", "assurepro/index.html",
  "assureaudit/index.html", "assurebooks/index.html", "assuretax/index.html"];
const CHUNKS = ["questions-1.js", "questions-2.js", "questions-3.js",
  "questions-4.js", "questions-5.js", "questions-6.js"];
const ALL_DIRS = { pro: "assurepro", books: "assurebooks", tax: "assuretax" };
// A product taken off the site by tools/set-published-products.js has no FAQS
// array; its answers live in drafts/ and must not appear anywhere deployed.
const DIRS = Object.fromEntries(Object.entries(ALL_DIRS).filter(
  ([, dir]) => fs.readFileSync(path.join(ROOT, dir, "index.html"), "utf8").includes("const FAQS=")));
const UNPUBLISHED = Object.entries(ALL_DIRS).filter(([k]) => !DIRS[k]).map(([, dir]) => dir);
const NAMES = { pro: "AssurePro", books: "AssureBooks", tax: "AssureTax", audit: "AssureAudit" };

const fails = [];
const warns = [];
const notes = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

function section(t) { notes.push("\n" + t); }

/* ---------------------------------------------------------- 1. files exist */
section("1. files");
for (const p of [...PAGES, ...CHUNKS]) {
  if (!exists(p)) fail(`missing file: ${p}`);
}
notes.push(`   ${PAGES.length} pages + ${CHUNKS.length} data files present`);

/* --------------------------------------------------------- 2. scripts parse */
section("2. javascript parses");
function inlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}
for (const p of PAGES) {
  const blocks = inlineScripts(read(p));
  blocks.forEach((code, i) => {
    try { new vm.Script(`(function(){${code}})`); }
    catch (e) { fail(`${p}: inline script #${i + 1} does not parse — ${e.message}`); }
  });
  notes.push(`   ${p}: ${blocks.length} inline scripts ok`);
}
for (const c of CHUNKS) {
  try { new vm.Script(read(c)); } catch (e) { fail(`${c}: does not parse — ${e.message}`); }
}

/* --------------------------------------------------------------- 3. the data */
section("3. article data");
const ctx = { window: {} };
vm.createContext(ctx);
for (const c of CHUNKS) vm.runInContext(read(c), ctx);
const arts = ctx.window.ASSUREONE_ARTICLES || [];
notes.push(`   ${arts.length} articles`);

const ids = new Set();
for (const a of arts) {
  if (ids.has(a.id)) fail(`duplicate article id: ${a.id}`);
  ids.add(a.id);
  for (const f of ["id", "product", "category", "title", "description", "answer", "search", "read", "path"]) {
    if (!a[f]) fail(`${a.id}: missing ${f}`);
  }
  if (!NAMES[a.product]) fail(`${a.id}: unknown product "${a.product}"`);
  if (a.answer && a.answer.trim().length < 15) fail(`${a.id}: answer too short`);
  if (a.steps && a.steps.some((s) => !s || !s.trim())) fail(`${a.id}: blank step`);
  if (a.more && a.more.some((s) => !s || !s.trim())) fail(`${a.id}: blank extra paragraph`);
  if (a.path !== DIRS[a.product] + "/index.html") fail(`${a.id}: wrong path ${a.path}`);
}
notes.push(`   by product: ${Object.keys(DIRS).map((k) => k + "=" + arts.filter((a) => a.product === k).length).join(" ")}`);
notes.push(`   with extra paragraphs: ${arts.filter((a) => a.more).length}, with steps: ${arts.filter((a) => a.steps).length}`);

/* ------------------------------------ 4. data matches the source of truth */
section("4. data matches the product pages");
let compared = 0;
for (const [key, dir] of Object.entries(DIRS)) {
  const html = read(dir + "/index.html");
  const fm = html.match(/const FAQS=(\[[\s\S]*?\n\]);/);
  if (!fm) { fail(`${dir}: FAQS unreadable`); continue; }
  const faqs = vm.runInNewContext("(" + fm[1] + ")");
  const dm = html.match(/const DETAILS=(\{[\s\S]*?\n\});/);
  const details = dm ? vm.runInNewContext("(" + dm[1] + ")") : {};

  for (const q of Object.keys(details)) {
    if (!faqs.some((f) => f.q === q)) fail(`${dir}: DETAILS entry for a deleted question — ${q}`);
  }
  for (const f of faqs) {
    compared++;
    const hit = arts.find((a) => a.product === key && a.title.trim() === f.q.trim());
    if (!hit) { fail(`${dir}: "${f.q}" has no article`); continue; }
    if (hit.answer !== f.a) fail(`${hit.id}: answer differs from the product page`);
    const wantMore = (details[f.q] || []).join("|");
    if ((hit.more || []).join("|") !== wantMore) fail(`${hit.id}: extra paragraphs differ`);
    if ((hit.steps || []).join("|") !== (f.steps || []).join("|")) fail(`${hit.id}: steps differ`);
  }
  const extra = arts.filter((a) => a.product === key && !faqs.some((f) => f.q.trim() === a.title.trim()));
  for (const a of extra) fail(`${a.id}: in the hub data but not on ${dir}`);
}
notes.push(`   ${compared} questions compared, answers/steps/extra paragraphs all match`);

/* ------------------------------------------------------------- 5. all links */
section("5. links");
const articleIdRe = /article\.html\?id=([A-Za-z0-9%._~-]+)/g;
for (const p of PAGES) {
  const html = read(p);
  for (const m of html.matchAll(articleIdRe)) {
    const id = decodeURIComponent(m[1]);
    if (id.includes("${")) continue; // template expression, checked below
    if (!ids.has(id)) fail(`${p}: link to a non-existent article — ${id}`);
  }
}
// the discovery rails were removed; nothing may render or populate them
for (const p of ["index.html", "article.html"]) {
  const html = read(p);
  if (hasMarkup(html, 'class="hc-rail"') || hasMarkup(html, 'id="ar-rail"'))
    fail(`${p}: a removed discovery rail is back in the markup`);
  if (/getElementById\('(hc-popular|hc-latest|ar-rail)'\)/.test(html))
    fail(`${p}: still populating a removed rail`);
  if (/rail\.innerHTML/.test(html)) fail(`${p}: still writing to a removed rail`);
}
notes.push("   discovery rails absent from the hub and the article page");

// the hero headline is static; nothing may animate it again
{
  const hub = read("index.html");
  if (hasScript(hub, "typingPhrases") || hasScript(hub, "getElementById('hc-typed')"))
    fail("index.html: the hero headline is being animated again");
  if (hasMarkup(hub, "hc-typing-caret")) fail("index.html: the headline caret is back");
  if (!hasMarkup(hub, '<span class="hc-typing-line">get answers faster.</span>'))
    fail("index.html: the static hero headline is missing or has changed");
  notes.push("   hero headline is static");
}

// the article breadcrumb bar and the hub welcome heading were removed
{
  const art = read("article.html");
  if (hasMarkup(art, "ar-crumbs") || hasScript(art, "crumbs.innerHTML"))
    fail("article.html: the breadcrumb bar is back");
  const hub = read("index.html");
  if (hasMarkup(hub, "hc-welcome") || hub.includes("One knowledge base for your entire firm"))
    fail("index.html: the welcome heading is back");
  // it held the result count, which render() writes to on every keystroke
  if (!hasMarkup(hub, 'id="hc-count"'))
    fail("index.html: the result count element is missing; searching would throw");
  notes.push("   breadcrumbs and welcome heading absent, result count present");
}

// the section navigator's collapse label has to say what it does
{
  const art = read("article.html");
  if (hasScript(art, "Show nearby articles"))
    fail('article.html: the collapse label still says "Show nearby articles"');
  if (hasScript(art, "function compactSection()") && !hasScript(art, "'Show fewer articles'"))
    fail("article.html: the navigator toggle has no collapse label");
  notes.push("   navigator collapse label reads plainly");
}

// product page id maps
for (const [key, dir] of Object.entries(DIRS)) {
  const html = read(dir + "/index.html");
  const im = html.match(/const ARTICLE_IDS=(\{.*?\});/s);
  if (!im) { fail(`${dir}: ARTICLE_IDS missing`); continue; }
  const map = vm.runInNewContext("(" + im[1] + ")");
  const faqs = vm.runInNewContext("(" + html.match(/const FAQS=(\[[\s\S]*?\n\]);/)[1] + ")");
  for (const f of faqs) {
    if (!map[f.q]) fail(`${dir}: no article id for "${f.q}"`);
    else if (!ids.has(map[f.q])) fail(`${dir}: "${f.q}" maps to missing ${map[f.q]}`);
  }
  for (const [q, id] of Object.entries(map)) {
    if (!faqs.some((f) => f.q === q)) fail(`${dir}: ARTICLE_IDS has a stale entry — ${q}`);
    if (!ids.has(id)) fail(`${dir}: ARTICLE_IDS points at missing ${id}`);
  }
  notes.push(`   ${dir}: ${Object.keys(map).length} question→article ids, all resolve`);
}
// relative paths that must exist
for (const p of PAGES) {
  const html = read(p);
  const dir = path.dirname(p);
  for (const m of html.matchAll(/href="((?!https?:|mailto:|#|data:)[^"]+\.html)[^"]*"/g)) {
    const target = path.normalize(path.join(dir, m[1]));
    if (!exists(target)) fail(`${p}: href to a missing file — ${m[1]}`);
  }
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
    const target = path.normalize(path.join(dir, m[1]));
    if (!exists(target)) fail(`${p}: script src missing — ${m[1]}`);
  }
}

/* -------------------------------------------------------------- 6. support */
section("6. support routes");
for (const p of PAGES) {
  const html = read(p);
  if (!/mailto:support@assureone\.ai/.test(html)) fail(`${p}: no mailto link`);
  // the hub builds its header inside a JS string, so either region counts
  if (!hasMarkupOrScript(html, 'class="hdr-copy"') && !hasMarkupOrScript(html, 'class=\\"hdr-copy\\"'))
    fail(`${p}: no header copy button`);
  if (!hasScript(html, "function copyNow(text)")) fail(`${p}: shared copy routine missing`);
  const open = html.indexOf("<!-- hdr-support:start -->");
  const close = html.indexOf("<!-- hdr-support:end -->");
  if (open < 0 || close < 0) { fail(`${p}: copy handler markers missing`); continue; }
  const handler = html.slice(open, close);
  const sync = handler.indexOf("if(copyNow(EMAIL))");
  const asyncAt = handler.indexOf("navigator.clipboard.writeText");
  if (sync < 0) fail(`${p}: no synchronous copy attempt`);
  if (asyncAt > -1 && sync > asyncAt) fail(`${p}: async clipboard is tried before the synchronous copy`);
  // only one handler per page
  const handlers = countIn(html, "script", "function copyNow(text)");
  if (handlers !== 1) fail(`${p}: ${handlers} copy routines, expected 1`);
  const legacy = html.replace(handler, "");
  if (/querySelectorAll\('\.help-cta-copy'\)/.test(legacy)) fail(`${p}: legacy copy handler still present`);
  if (/initCopy/.test(legacy)) fail(`${p}: legacy initCopy still present`);
}
notes.push(`   all ${PAGES.length} pages: mailto + copy button + one shared handler`);

/* ------------------------------------------------------ 7. hub search rules */
section("7. hub search");
{
  const html = read("index.html");
  for (const [needle, label] of [
    ["SEARCH_STOPWORDS", "stopword list"],
    ["const usePhrase=raw.length>2", "phrase-first"],
    ["const rank=f=>f.titlePhrase", "relevance ranking"],
    ["titleWords:whole.length>0", "whole-word title preference"],
  ]) if (!html.includes(needle)) fail(`index.html: ${label} missing`);
  if (html.includes("const terms=query.toLowerCase()")) fail("index.html: old substring search still present");
  if (!html.includes("function link(article){return 'article.html?id='")) fail("index.html: links not pointing at article.html");
  if (!html.includes("Deep links from the article pages")) fail("index.html: ?q/?product/?category handling missing");
  if (/productPageLink|hc-product-page/.test(html))
    fail("index.html: the removed product help-centre link is back");
  notes.push("   stopwords, word-boundary, phrase-first, ranking, deep links, product link");
}

/* ---------------------------------------------------- 8. deleted content gone */
section("8. removed content");
const GONE = "Engagement Letter area";
for (const p of [...PAGES, ...CHUNKS]) {
  if (read(p).includes(GONE)) fail(`${p}: still references the removed question`);
}
notes.push(`   "What is the ${GONE}?" absent from every page and data file`);

/* ------------------------------------------------- 9. product page alignment */
section("9. product pages");
for (const dir of Object.values(ALL_DIRS).concat("assureaudit")) {
  const html = read(dir + "/index.html");
  if (!hasStyle(html, "/* Aligned with the knowledge-base design */")) fail(`${dir}: design overrides missing`);
  if (!hasMarkup(html, 'class="top-actions"')) fail(`${dir}: header actions missing`);
  if (/>\s*\d+ questions\s*</.test(html) || /\$\{count\} questions/.test(html))
    fail(`${dir}: a question count is still rendered`);
  if (/category-badge">\d/.test(html)) fail(`${dir}: numbering badge still present`);
  if (!/mailto:support@assureone\.ai/.test(html)) fail(`${dir}: support link missing`);

  const published = Object.values(DIRS).includes(dir);
  if (published) {
    // the answer link is produced by a template literal, so it lives in script
    if (!hasScript(html, '<a class="answer-link" href="../article.html?id='))
      fail(`${dir}: answer-link template missing`);
  } else {
    if (html.includes("const FAQS=")) fail(`${dir}: unpublished but still carries its questions`);
    if (!html.includes("Coming soon")) fail(`${dir}: unpublished with no coming-soon notice`);
  }
}
notes.push(`   published: ${Object.values(DIRS).join(", ")}; awaiting review: ${UNPUBLISHED.concat("assureaudit").join(", ")}`);

// nothing an unpublished product wrote may survive in a deployed file
for (const dir of UNPUBLISHED) {
  const draft = path.join(ROOT, "drafts", `${dir}-index.html`);
  if (!fs.existsSync(draft)) { warn(`${dir}: no draft kept, so its answers cannot be restored`); continue; }
  const m = fs.readFileSync(draft, "utf8").match(/const FAQS=(\[[\s\S]*?\n\]);/);
  if (!m) continue;
  const answers = [...m[1].matchAll(/a:"((?:[^"\\]|\\.){40,})"/g)].map((x) => x[1].slice(0, 40));
  for (const p of PAGES.concat(CHUNKS)) {
    const html = read(p);
    const leaked = answers.filter((a) => html.includes(a));
    if (leaked.length) fail(`${p}: carries ${leaked.length} ${dir} answers that are not published`);
  }
}
notes.push("   no unpublished answer appears in any deployed file");
notes.push("   all four aligned, no counts, no numbering, answer links present");

/* --------------------------------------------------------- 10. hygiene */
section("10. hygiene");
for (const p of PAGES) {
  const html = read(p);
  const opens = (html.match(/<script/g) || []).length;
  const closes = (html.match(/<\/script>/g) || []).length;
  if (opens !== closes) fail(`${p}: ${opens} <script> vs ${closes} </script>`);
  if ((html.match(/<style/g) || []).length !== (html.match(/<\/style>/g) || []).length) fail(`${p}: style tags unbalanced`);
  if (hasStyle(html, "hdr-note")) fail(`${p}: dead hdr-note rule left behind`);
  if (/@media\([^)]*\)\{\s*\}/.test(html)) fail(`${p}: an empty @media block was left behind`);
  if (/\bTODO\b|\bFIXME\b/.test(html)) warn(`${p}: contains TODO/FIXME`);
  if (!/<title>/.test(html)) fail(`${p}: no <title>`);
  if (countIn(html, "markup", 'class="site-copyright"') !== 1)
    fail(`${p}: expected exactly one copyright element in the markup`);
  if (!hasStyleRule(html, ".site-copyright")) fail(`${p}: copyright styles missing`);
  if (html.includes("Answers are maintained by the AssureOne team")) fail(`${p}: old footer note still present`);
  if (!/lang="en"/.test(html)) warn(`${p}: no lang attribute`);
  if (!/name="viewport"/.test(html)) fail(`${p}: no viewport meta`);
}
notes.push("   tags balanced, titles and viewport present, no dead rules");

/* ------------------------------------------------------- 11. clean URLs */
section("11. clean URLs");
{
  if (!exists("vercel.json")) fail("vercel.json missing — the web copy would serve /index.html");
  else {
    let cfg;
    try { cfg = JSON.parse(read("vercel.json")); }
    catch (e) { fail("vercel.json is not valid JSON: " + e.message); }
    if (cfg) {
      if (cfg.cleanUrls !== true) fail("vercel.json: cleanUrls must be true");
      if (cfg.trailingSlash !== false) fail("vercel.json: trailingSlash must be false");
    }
  }
  for (const p of PAGES) {
    const html = read(p);
    const copies = (html.match(/<!-- clean-links:start -->/g) || []).length;
    if (copies !== 1) fail(`${p}: ${copies} clean-link scripts, expected 1`);
    if (!hasScript(html, "location.protocol==='file:'")) fail(`${p}: clean-link script is not guarded for file://`);
    if (!hasScript(html, "method:'HEAD'")) fail(`${p}: clean-link rewriting is not gated on the host supporting it`);
    // an absolute .html href would break the downloadable copy
    for (const m of html.matchAll(/href="(\/[^"]*\.html[^"]*)"/g)) {
      fail(`${p}: absolute href ${m[1]} would break the local copy`);
    }
    // every internal href must stay relative so the local copy works
    for (const m of html.matchAll(/href="((?!https?:|mailto:|#|data:|\/\/)[^"]+\.html[^"]*)"/g)) {
      if (m[1].startsWith("/")) fail(`${p}: ${m[1]} is absolute`);
    }
  }
  notes.push("   vercel.json sets cleanUrls, every page rewrites links on the web only");
}

/* -------------------------------------------------------------- report */
console.log(notes.join("\n"));
console.log("\n" + "=".repeat(58));
if (warns.length) {
  console.log(`\nWARNINGS (${warns.length}):`);
  warns.forEach((w) => console.log("  ! " + w));
}
if (fails.length) {
  console.log(`\nFAILURES (${fails.length}):`);
  fails.forEach((f) => console.log("  x " + f));
  process.exit(1);
}
console.log("\nQC PASSED — no failures.");
