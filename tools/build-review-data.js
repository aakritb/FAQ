/**
 * Regenerate the data behind the AssurePro question-review document from the
 * product page, which is the source of truth.
 *
 * Writes assurepro.json next to the document builder. Run this before building
 * the document so the two cannot drift: the document promises that a Ref
 * identifies a question across rewordings, so it has to be built from what is
 * actually live.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const out = process.argv[2] || path.join(ROOT, "..", "assurepro.json");
const html = fs.readFileSync(path.join(ROOT, "assurepro", "index.html"), "utf8");

const grab = (re, what) => {
  const m = html.match(re);
  if (!m) throw new Error("could not read " + what + " from the product page");
  return vm.runInNewContext("(" + m[1] + ")");
};

const FAQS = grab(/const FAQS=(\[[\s\S]*?\n\]);/, "FAQS");
const DETAILS = grab(/const DETAILS=(\{[\s\S]*?\n\});/, "DETAILS");
const CATEGORIES = grab(/const CATEGORIES=(\[[\s\S]*?\]);/, "CATEGORIES");
const IDS = grab(/const ARTICLE_IDS=(\{.*?\});/s, "ARTICLE_IDS");

const groups = [];
const placed = new Set();
for (const [id, label] of CATEGORIES) {
  const items = FAQS.filter((f) => f.c === id).map((f) => {
    placed.add(f.q);
    const d = DETAILS[f.q];
    return {
      q: f.q,
      a: f.a,
      more: Array.isArray(d) ? d : d ? [d] : [],
      steps: f.steps || [],
      alsoSettings: !!f.settings,
      keywords: f.k || f.keywords || "",
      ref: IDS[f.q] || null,
    };
  });
  if (items.length) groups.push({ id, label, items });
}

const problems = [];
const missed = FAQS.filter((f) => !placed.has(f.q));
if (missed.length) problems.push(`${missed.length} question(s) belong to no listed category: ${missed.map((f) => f.c).join(", ")}`);
const counted = groups.reduce((n, g) => n + g.items.length, 0);
if (counted !== FAQS.length) problems.push(`${counted} questions grouped but the page has ${FAQS.length}`);
const noRef = groups.flatMap((g) => g.items).filter((i) => !i.ref);
if (noRef.length) problems.push(`${noRef.length} question(s) have no Ref, so an edit could not be matched back`);
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));

fs.writeFileSync(out, JSON.stringify({ total: FAQS.length, groups }, null, 2));
console.log(`  ok  ${FAQS.length} questions across ${groups.length} categories -> ${out}`);
for (const g of groups) console.log(`        ${String(g.items.length).padStart(3)}  ${g.label}`);
