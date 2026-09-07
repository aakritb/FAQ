/**
 * Rebuild the hub's article index from the product pages.
 *
 * The product pages (assurepro/, assurebooks/, assuretax/) are the source of
 * truth for questions and answers. This regenerates questions-*.js from them,
 * so a question edited or deleted on a product page propagates to the hub's
 * search and to its article page.
 *
 * Run it after editing a product page:
 *     node tools/sync-articles.js
 *     node tools/qc.js
 *
 * Existing articles keep their id, category, description and read time, so
 * links stay valid and hand-written descriptions survive. A question that is
 * new to the hub gets a generated record; one that has been deleted is
 * dropped. Both are reported.
 *
 * Safe to run repeatedly: with no content changes it rewrites the same bytes.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CHUNKS = ["questions-1.js", "questions-2.js", "questions-3.js",
  "questions-4.js", "questions-5.js", "questions-6.js"];

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// The hub keeps its own, coarser category list; a new article has to be filed
// under one of these or the hub cannot show it.
const HUB_CATEGORIES = (() => {
  const m = read("index.html").match(/const categories=\[([^\]]*)\]/);
  return m ? m[1].split(",").map((s) => s.trim().replace(/^'|'$/g, "")) : [];
})();
/* Only products whose pages still carry their questions are indexed. A product
 * taken off the site by tools/set-published-products.js has no FAQS array, so
 * its answers cannot be searched on the hub or opened at article.html either.
 * Its records stay in drafts/ and come back when it is published. */
const ALL_PRODUCTS = { pro: "assurepro", books: "assurebooks", tax: "assuretax" };
const DIR_FOR = Object.fromEntries(Object.entries(ALL_PRODUCTS).filter(
  ([, dir]) => read(dir + "/index.html").includes("const FAQS=")));
const PRODUCT_ORDER = Object.keys(ALL_PRODUCTS).filter((k) => DIR_FOR[k]);

const FIELD_ORDER = ["id", "product", "category", "title", "description",
  "answer", "more", "steps", "search", "read", "path"];

/* -------------------------------------------------------------- read input */

function readExisting() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const c of CHUNKS) vm.runInContext(read(c), ctx);
  return ctx.window.ASSUREONE_ARTICLES || [];
}

function readProductFaqs() {
  const out = {};
  for (const [key, dir] of Object.entries(DIR_FOR)) {
    const html = read(dir + "/index.html");
    const fm = html.match(/const FAQS=(\[[\s\S]*?\n\]);/);
    if (!fm) throw new Error(`${dir}: FAQS not found`);
    const faqs = vm.runInNewContext("(" + fm[1] + ")");

    // Extra paragraphs live in a separate DETAILS map, merged in as `more`.
    const dm = html.match(/const DETAILS=(\{[\s\S]*?\n\});/);
    const details = dm ? vm.runInNewContext("(" + dm[1] + ")") : {};
    const orphans = Object.keys(details).filter((q) => !faqs.some((f) => f.q === q));
    if (orphans.length) {
      throw new Error(
        `${dir}: DETAILS still has entries for deleted questions:\n  ` +
        orphans.join("\n  ") + "\nDelete those entries too."
      );
    }
    for (const f of faqs) if (details[f.q]) f.more = details[f.q];

    // The page's own title→id map. Matching on it means a question whose
    // wording was reworded keeps its id, its category and its description
    // instead of being read as one deletion and one new question.
    const im = html.match(/const ARTICLE_IDS=(\{.*?\});/s);
    const ids = im ? vm.runInNewContext("(" + im[1] + ")") : {};
    for (const f of faqs) if (ids[f.q]) f.id = ids[f.q];

    out[key] = faqs;
  }
  return out;
}

/* ------------------------------------------------------------------ derive */

// Matches the original id scheme, including its habit of keeping a trailing
// hyphen when a long title is cut at 70 characters.
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

function categories(dir) {
  const m = read(dir + "/index.html").match(/const CATEGORIES=(\[[\s\S]*?\]);/);
  return m ? vm.runInNewContext("(" + m[1] + ")") : null;
}

function derive(existing, faqs) {
  const byKey = new Map(existing.map((a) => [a.product + "||" + a.title.trim(), a]));
  const byId = new Map(existing.map((a) => [a.id, a]));
  const seen = new Set();
  const seenIds = new Set();
  const articles = [];
  const added = [];
  const retitled = [];

  for (const product of PRODUCT_ORDER) {
    // New ids continue past the highest this product has used, so a deletion
    // never lets a later article inherit a retired id.
    let next = existing
      .filter((a) => a.product === product)
      .reduce((max, a) => Math.max(max, parseInt(a.id.match(/-(\d+)$/)[1], 10) + 1), 0);
    const labels = categories(DIR_FOR[product]);

    for (const f of faqs[product] || []) {
      const key = product + "||" + f.q.trim();
      seen.add(key);
      const steps = Array.isArray(f.steps) && f.steps.length ? f.steps.slice() : undefined;
      const more = Array.isArray(f.more) && f.more.length ? f.more.slice() : undefined;
      // id first, so a reworded question is recognised as the same article
      const prior = (f.id && byId.get(f.id)) || byKey.get(key);
      if (prior) seenIds.add(prior.id);

      if (prior) {
        if (prior.title !== f.q) retitled.push({ id: prior.id, from: prior.title, to: f.q });
        const rec = Object.assign({}, prior);
        rec.title = f.q;
        rec.answer = f.a;
        if (more) rec.more = more; else delete rec.more;
        if (steps) rec.steps = steps; else delete rec.steps;
        rec.search = [f.a].concat(more || [], steps || []).join(" ");
        articles.push(rec);
        continue;
      }

      const productLabel = labels
        ? (labels.find((c) => (Array.isArray(c) ? c[0] === f.c : c.id === f.c)) || [])[1]
        : null;
      // The product page and the hub use different category names, so only
      // use the product's label when the hub actually lists it.
      const label = productLabel && HUB_CATEGORIES.includes(productLabel) ? productLabel : null;
      const rec = {
        id: product + "-" + slug(f.q) + "-" + next++,
        product,
        category: label || "Getting Started",
        title: f.q,
        description: f.a.length > 200 ? f.a.slice(0, 200).replace(/\s+\S*$/, "") + "…" : f.a,
        answer: f.a,
        search: [f.a].concat(more || [], steps || []).join(" "),
        read: "2 min",
        path: DIR_FOR[product] + "/index.html",
      };
      if (more) rec.more = more;
      if (steps) rec.steps = steps;
      articles.push(rec);
      added.push(rec);
    }
  }

  // Records for a product that is no longer indexed are withdrawn, not deleted:
  // they are still in drafts/ and return when the product is published.
  const withdrawn = existing.filter((a) => !PRODUCT_ORDER.includes(a.product));
  const removed = existing.filter((a) =>
    PRODUCT_ORDER.includes(a.product) &&
    !seenIds.has(a.id) &&
    !seen.has(a.product + "||" + a.title.trim()));
  return { articles, added, removed, withdrawn, retitled };
}

/* ------------------------------------------------------------------- write */

function writeChunks(articles) {
  const per = Math.ceil(articles.length / CHUNKS.length);
  let cursor = 0;
  CHUNKS.forEach((file, i) => {
    const slice = articles.slice(cursor, cursor + per);
    cursor += slice.length;
    const records = slice.map((a) => {
      const ordered = {};
      for (const k of FIELD_ORDER) if (a[k] !== undefined) ordered[k] = a[k];
      for (const k of Object.keys(a)) if (!(k in ordered)) ordered[k] = a[k];
      return JSON.stringify(ordered, null, 2).split("\n").map((l) => "  " + l).join("\n");
    });
    fs.writeFileSync(path.join(ROOT, file),
      (i === 0 ? "window.ASSUREONE_ARTICLES=[];\n" : "") +
      "window.ASSUREONE_ARTICLES.push(...[\n" + records.join(",\n") + "\n]);\n");
  });
  if (cursor !== articles.length) throw new Error(`wrote ${cursor} of ${articles.length}`);
}

/* Each product page maps its questions to article ids so every answer can link
 * to its own page. That map is regenerated here too. */
function writeIdMaps(articles) {
  for (const [key, dir] of Object.entries(DIR_FOR)) {
    const file = path.join(ROOT, dir, "index.html");
    let html = fs.readFileSync(file, "utf8");
    const mine = articles.filter((a) => a.product === key);
    const map = "const ARTICLE_IDS=" + JSON.stringify(
      Object.fromEntries(mine.map((a) => [a.title, a.id]))) + ";";
    const re = /const ARTICLE_IDS=\{.*?\};/s;
    if (!re.test(html)) throw new Error(`${dir}: ARTICLE_IDS not found`);
    const next = html.replace(re, () => map);
    if (next !== html) {
      fs.writeFileSync(file, next);
      console.log(`  ok  ${dir}: article id map refreshed`);
    }
  }
}

/* -------------------------------------------------------------------- main */

const existing = readExisting();
const faqs = readProductFaqs();
console.log(`product pages: ${PRODUCT_ORDER.map((k) => k + "=" + (faqs[k] || []).length).join(" ")}`);

const { articles, added, removed, withdrawn, retitled } = derive(existing, faqs);
console.log(`indexing: ${PRODUCT_ORDER.join(", ") || "nothing"}`);
if (withdrawn.length) {
  const by = {};
  withdrawn.forEach((a) => { by[a.product] = (by[a.product] || 0) + 1; });
  console.log(`  ok  withdrawn from the index: ${Object.entries(by).map(([p, n]) => `${p}=${n}`).join(" ")} (kept in drafts/)`);
}
console.log(`  ok  ${articles.length} articles derived (was ${existing.length})`);
for (const a of removed) console.log(`      removed: ${a.product} | ${a.title}`);
for (const a of added) console.log(`      added:   ${a.product} | ${a.title}  ->  ${a.id}`);
for (const r of retitled) console.log(`      retitled (id kept ${r.id}):\n        was: ${r.from}\n        now: ${r.to}`);

const short = articles.filter((a) => !a.answer || a.answer.trim().length < 15);
if (short.length) throw new Error("articles with no usable answer:\n  " + short.map((a) => a.id).join("\n  "));

const ids = new Set(articles.map((a) => a.id));
if (ids.size !== articles.length) throw new Error("duplicate article ids");

// every extra paragraph has to survive
const lost = [];
for (const product of PRODUCT_ORDER) {
  for (const f of faqs[product] || []) {
    if (!f.more) continue;
    const hit = articles.find((a) => a.product === product && a.title.trim() === f.q.trim());
    if (!hit || (hit.more || []).join("|") !== f.more.join("|")) lost.push(`${product} | ${f.q}`);
  }
}
if (lost.length) throw new Error("extra paragraphs did not survive:\n  " + lost.join("\n  "));

writeChunks(articles);
console.log(`  ok  questions-*.js rewritten (${articles.filter((a) => a.more).length} with extra paragraphs, ${articles.filter((a) => a.steps).length} with steps)`);
writeIdMaps(articles);
console.log("\nNow run:  node tools/qc.js");
