/**
 * Static QC for the whole help centre. Reports every problem it finds rather
 * than stopping at the first, and exits non-zero if anything failed.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = require("path").resolve(__dirname, "..");
const PAGES = ["index.html", "article.html", "assurepro/index.html",
  "assureaudit/index.html", "assurebooks/index.html", "assuretax/index.html"];
const CHUNKS = ["questions-1.js", "questions-2.js", "questions-3.js",
  "questions-4.js", "questions-5.js", "questions-6.js"];
const DIRS = { pro: "assurepro", books: "assurebooks", tax: "assuretax" };
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
// rails
for (const listName of ["popular", "latest"]) {
  const m = read("index.html").match(new RegExp("const " + listName + "=\\[(.*?)\\]"));
  if (!m) { fail(`index.html: ${listName} rail not found`); continue; }
  const list = m[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")).filter(Boolean);
  for (const id of list) if (!ids.has(id)) fail(`index.html: ${listName} rail points at missing ${id}`);
  notes.push(`   ${listName} rail: ${list.length} ids, all resolve`);
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
  if (!/class=\\?"hdr-copy\\?"/.test(html)) fail(`${p}: no header copy button`);
  if (!html.includes("function copyNow(text)")) fail(`${p}: shared copy routine missing`);
  const open = html.indexOf("<!-- hdr-support:start -->");
  const close = html.indexOf("<!-- hdr-support:end -->");
  if (open < 0 || close < 0) { fail(`${p}: copy handler markers missing`); continue; }
  const handler = html.slice(open, close);
  const sync = handler.indexOf("if(copyNow(EMAIL))");
  const asyncAt = handler.indexOf("navigator.clipboard.writeText");
  if (sync < 0) fail(`${p}: no synchronous copy attempt`);
  if (asyncAt > -1 && sync > asyncAt) fail(`${p}: async clipboard is tried before the synchronous copy`);
  // only one handler per page
  const handlers = (html.match(/function copyNow\(text\)/g) || []).length;
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
  if (!html.includes("productPageLink")) fail("index.html: product help-centre link missing");
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
for (const dir of Object.values(DIRS).concat("assureaudit")) {
  const html = read(dir + "/index.html");
  if (!html.includes("/* Aligned with the knowledge-base design */")) fail(`${dir}: design overrides missing`);
  if (!html.includes('class="top-actions"')) fail(`${dir}: header actions missing`);
  if (!/\d+ questions/.test(html) === false) fail(`${dir}: a question count is still rendered`);
  if (/category-badge">\d/.test(html)) fail(`${dir}: numbering badge still present`);
  if (dir !== "assureaudit" && !html.includes('<a class="answer-link" href="../article.html?id=')) {
    fail(`${dir}: answer-link template missing`);
  }
}
notes.push("   all four aligned, no counts, no numbering, answer links present");

/* --------------------------------------------------------- 10. hygiene */
section("10. hygiene");
for (const p of PAGES) {
  const html = read(p);
  const opens = (html.match(/<script/g) || []).length;
  const closes = (html.match(/<\/script>/g) || []).length;
  if (opens !== closes) fail(`${p}: ${opens} <script> vs ${closes} </script>`);
  if ((html.match(/<style/g) || []).length !== (html.match(/<\/style>/g) || []).length) fail(`${p}: style tags unbalanced`);
  if (html.includes("hdr-note")) fail(`${p}: dead hdr-note rule left behind`);
  if (/\bTODO\b|\bFIXME\b/.test(html)) warn(`${p}: contains TODO/FIXME`);
  if (!/<title>/.test(html)) fail(`${p}: no <title>`);
  if (!/lang="en"/.test(html)) warn(`${p}: no lang attribute`);
  if (!/name="viewport"/.test(html)) fail(`${p}: no viewport meta`);
}
notes.push("   tags balanced, titles and viewport present, no dead rules");

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
