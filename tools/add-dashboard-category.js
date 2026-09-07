/**
 * Give the dashboard a category of its own.
 *
 * Eleven questions are about the Overview dashboard — what is on it, how to
 * build one, how to arrange its widgets, how to share it. They were split
 * between Platform and Reporting on the product page, and all eleven sat under
 * "Getting Started" on the hub, which is where 39 of AssurePro's 172 questions
 * were already piling up. Someone looking for dashboard help had to guess.
 *
 * The site keeps two category lists, so both are updated:
 *   - the product page's own topics (Platform, Settings, Reporting, ...)
 *   - the hub's coarser list (Getting Started, Clients, Billing, ...)
 *
 * Nothing is reworded. This only changes where the eleven are filed.
 *
 * Idempotent.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const { hasScript } = require("./lib/regions");

const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "assurepro", "index.html");
const CHUNKS = ["questions-1.js", "questions-2.js", "questions-3.js",
  "questions-4.js", "questions-5.js", "questions-6.js"];

const HUB_LABEL = "Dashboard";
const PAGE_KEY = "dashboard";
const PAGE_LABEL = "Dashboard";
const PAGE_META = "Understand the Overview dashboard, its widgets, and building or sharing your own.";

/* The dashboard is the subject of these, not an aside. Questions that merely
 * mention it — "How is the Reports area organized?", "Can report and dashboard
 * data be exported?" — stay where they are, because the Reports area and
 * exporting are what they are actually about. */
const MOVE = [
  "What is on the AssurePro Overview?",
  "Can the Overview dashboard be customized?",
  "What reports are available on Overview?",
  "What happens when I select Full report on an Overview card?",
  "Which starter dashboards are available?",
  "How do I build a custom dashboard?",
  "How can report widgets be arranged?",
  "How do I share or manage a custom dashboard?",
  "Which report-widget categories can I use?",
  "How does the dashboard help identify work needing attention?",
  "What is available in My Report?",
];

const notes = [];

/* ------------------------------------------------- the product page topics */
{
  let html = fs.readFileSync(PAGE, "utf8");
  const before = html;

  // 1. the topic itself, filed straight after Platform
  const AFTER_PLATFORM = '["platform","Platform"],';
  if (!html.includes(`["${PAGE_KEY}","${PAGE_LABEL}"]`)) {
    if (!html.includes(AFTER_PLATFORM)) throw new Error("assurepro: the Platform topic is not where expected");
    html = html.replace(AFTER_PLATFORM, () => AFTER_PLATFORM + `["${PAGE_KEY}","${PAGE_LABEL}"],`);
    notes.push("topic added");
  }

  // 2. its description, which the topic card shows
  if (!html.includes(`${PAGE_KEY}:"${PAGE_META}"`)) {
    const anchor = "const CATEGORY_META={";
    if (!html.includes(anchor)) throw new Error("assurepro: CATEGORY_META not found");
    html = html.replace(anchor, () => anchor + `${PAGE_KEY}:"${PAGE_META}",`);
    notes.push("description added");
  }

  // 3. refile the eleven
  let refiled = 0;
  for (const q of MOVE) {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\{c:"(?!${PAGE_KEY}")[a-z]+",q:"${esc}"`);
    const m = html.match(re);
    if (m) { html = html.replace(re, () => `{c:"${PAGE_KEY}",q:"${q}"`); refiled++; }
    else if (!html.includes(`{c:"${PAGE_KEY}",q:"${q}"`)) {
      throw new Error(`assurepro: could not find the question to refile — ${q}`);
    }
  }
  if (refiled) notes.push(`${refiled} questions refiled on the product page`);

  if (html !== before) fs.writeFileSync(PAGE, html);
  else notes.push("product page already done");
}

/* ------------------------------------------------------ the hub's own list */
{
  const file = path.join(ROOT, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  const AFTER = "'Getting Started',";
  if (!html.includes(`'${HUB_LABEL}'`)) {
    if (!html.includes(AFTER)) throw new Error("index.html: the hub category list is not where expected");
    html = html.replace(AFTER, () => AFTER + `'${HUB_LABEL}',`);
    notes.push("hub category added");
  }

  if (html !== before) fs.writeFileSync(file, html);
  else notes.push("hub list already done");
}

/* --------------------------------------------- the index the hub searches */
{
  // The index keeps each article's hub category, and sync-articles preserves
  // it, so it is set here once.
  let changed = 0;
  for (const chunk of CHUNKS) {
    const file = path.join(ROOT, chunk);
    let src = fs.readFileSync(file, "utf8");
    const before = src;
    for (const q of MOVE) {
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`("category": ")[^"]*(",\\n    "title": "${esc}")`);
      if (re.test(src)) { src = src.replace(re, `$1${HUB_LABEL}$2`); changed++; }
    }
    if (src !== before) fs.writeFileSync(file, src);
  }
  if (changed) notes.push(`${changed} articles refiled in the index`);
}

notes.forEach((n) => console.log("  ok  " + n));

/* ------------------------------------------------------------- checks */
const problems = [];
{
  const page = fs.readFileSync(PAGE, "utf8");
  if (!page.includes(`["${PAGE_KEY}","${PAGE_LABEL}"]`)) problems.push("assurepro: the Dashboard topic is missing");
  if (!page.includes(`${PAGE_KEY}:"${PAGE_META}"`)) problems.push("assurepro: the Dashboard topic has no description");

  const faqs = vm.runInNewContext("(" + page.match(/const FAQS=(\[[\s\S]*?\n\]);/)[1] + ")");
  const filed = faqs.filter((f) => f.c === PAGE_KEY).map((f) => f.q);
  const missing = MOVE.filter((q) => !filed.includes(q));
  if (missing.length) problems.push(`assurepro: not filed under Dashboard — ${missing.join(" | ")}`);
  const extra = filed.filter((q) => !MOVE.includes(q));
  if (extra.length) problems.push(`assurepro: unexpected question under Dashboard — ${extra.join(" | ")}`);

  const hub = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  if (!hasScript(hub, `'${HUB_LABEL}'`)) problems.push("index.html: Dashboard is not in the hub category list");

  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const c of CHUNKS) vm.runInContext(fs.readFileSync(path.join(ROOT, c), "utf8"), ctx);
  const arts = ctx.window.ASSUREONE_ARTICLES || [];
  const dash = arts.filter((a) => a.category === HUB_LABEL).map((a) => a.title);
  const notInIndex = MOVE.filter((q) => !dash.includes(q));
  if (notInIndex.length) problems.push(`index: not under Dashboard — ${notInIndex.join(" | ")}`);
  if (dash.length !== MOVE.length) problems.push(`index: ${dash.length} articles under Dashboard, expected ${MOVE.length}`);

  // every article still has a category the hub can show
  const listed = (hub.match(/const categories=\[([^\]]*)\]/) || [])[1] || "";
  const unknown = [...new Set(arts.map((a) => a.category))].filter((c) => !listed.includes(`'${c}'`));
  if (unknown.length) problems.push(`index: categories the hub does not list — ${unknown.join(", ")}`);
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log(`\n  ok  ${MOVE.length} dashboard questions filed under Dashboard on the product page and the hub`);
