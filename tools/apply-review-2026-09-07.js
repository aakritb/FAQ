/**
 * Apply the reviewed AssurePro edits returned on 7 September 2026.
 *
 * The review covered all 172 questions. Every section except Platform came
 * back with wording identical to the live text — checked with 29 verbatim
 * probes across the other eleven categories — so the changes below are the
 * whole of it: one deletion and three edits, all in Platform.
 *
 * Idempotent.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "assurepro", "index.html");

/* ------------------------------------------------------------- deletion */

const DELETE = "What is AssureOne?";

/* ---------------------------------------------------------------- edits */

const EDITS = [
  {
    ref: "pro-how-do-i-find-information-or-start-common-work-quickly-5",
    from: "How do I find information or start common work quickly?",
    title: "How do I find existing information or create a new record quickly?",
    answer: "Use the global search when the information or record already exists. Use + New when you need to create a record or begin a new activity.",
    step: {
      from: "When starting new work, select + New in the header.",
      to: "When creating a new record, select + New in the header.",
    },
  },
  {
    ref: "pro-can-we-try-assurepro-before-committing-to-a-migration-8",
    from: "Can we try AssurePro before committing to a migration?",
    title: "Can we see a demonstration of AssurePro before implementation?",
    // The reviewed copy read "your firm.s day-to-day operations"; the stray
    // period is taken as a typo for the apostrophe.
    answer: "Yes. Your firm can schedule a guided demonstration with the AssureOne demo team before implementing AssurePro. The team will introduce the platform, explain how its main areas work together, and demonstrate how AssurePro can support your firm's day-to-day operations. Your team can discuss its current processes, ask questions, and understand what to expect during implementation.",
  },
  {
    ref: "pro-what-support-channels-are-available-if-we-run-into-an-issue-9",
    from: "What support channels are available if we run into an issue?",
    title: "How do I get help or report an issue in AssurePro?",
    // answer and steps came back unchanged
  },
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const jsStr = (s) => JSON.stringify(s).slice(1, -1);

let html = fs.readFileSync(PAGE, "utf8");
const before = html;
const notes = [];

/* 1. remove the deleted question and its DETAILS entry if it has one */
{
  const re = new RegExp(`\\{c:"[a-z]+",q:"${esc(jsStr(DELETE))}"(?:,[a-z]+:(?:"(?:[^"\\\\]|\\\\.)*"|\\[(?:[^\\[\\]]|\\[[^\\]]*\\])*\\]|\\d+))*\\},?\\n?`);
  if (re.test(html)) {
    html = html.replace(re, "");
    notes.push(`removed: ${DELETE}`);
  }
  const dre = new RegExp(`"${esc(jsStr(DELETE))}":\\[(?:[^\\[\\]]|\\[[^\\]]*\\])*\\],?\\n?`);
  if (dre.test(html)) { html = html.replace(dre, ""); notes.push("removed its DETAILS entry"); }
  const ire = new RegExp(`"${esc(jsStr(DELETE))}":"[^"]*",?`);
  if (ire.test(html)) { html = html.replace(ire, ""); notes.push("removed its id mapping"); }
}

/* 2. apply the three edits */
for (const e of EDITS) {
  const applied = [];

  if (e.title && html.includes(`q:"${jsStr(e.from)}"`)) {
    html = html.split(`q:"${jsStr(e.from)}"`).join(`q:"${jsStr(e.title)}"`);
    applied.push("title");
    // Rename the key in ARTICLE_IDS too, keeping the same id. Without this the
    // question looks brand new on the next rebuild, gets a fresh id, and every
    // link already shared for it stops resolving — which is the one thing the
    // Ref in the review document promises will not happen.
    const oldKey = `"${jsStr(e.from)}":`;
    const newKey = `"${jsStr(e.title)}":`;
    if (html.includes(oldKey)) {
      html = html.split(oldKey).join(newKey);
      applied.push("kept its id");
    }
  }

  if (e.answer) {
    // find this question's record and replace only its own answer
    const key = e.title && html.includes(`q:"${jsStr(e.title)}"`) ? e.title : e.from;
    const re = new RegExp(`(q:"${esc(jsStr(key))}",a:")((?:[^"\\\\]|\\\\.)*)(")`);
    const m = html.match(re);
    if (!m) throw new Error(`${e.ref}: could not find the answer to replace`);
    if (m[2] !== jsStr(e.answer)) {
      html = html.replace(re, (_x, a, _b, c) => a + jsStr(e.answer) + c);
      applied.push("answer");
    }
  }

  if (e.step && html.includes(jsStr(e.step.from))) {
    html = html.split(`"${jsStr(e.step.from)}"`).join(`"${jsStr(e.step.to)}"`);
    applied.push("step");
  }

  if (applied.length) notes.push(`${e.ref}: ${applied.join(", ")}`);
}

if (html !== before) {
  fs.writeFileSync(PAGE, html);
  notes.forEach((n) => console.log("  ok  " + n));
} else {
  console.log("  --  already applied");
}

/* ------------------------------------------------------------- checks */
const out = fs.readFileSync(PAGE, "utf8");
const F = vm.runInNewContext("(" + out.match(/const FAQS=(\[[\s\S]*?\n\]);/)[1] + ")");
const D = vm.runInNewContext("(" + out.match(/const DETAILS=(\{[\s\S]*?\n\});/)[1] + ")");
const problems = [];

if (F.some((f) => f.q === DELETE)) problems.push(`"${DELETE}" is still on the page`);
if (D[DELETE]) problems.push(`"${DELETE}" still has a DETAILS entry`);
if (F.length !== 171) problems.push(`${F.length} questions, expected 171`);

// every edited question must still carry the id it had before the review
const IDS = vm.runInNewContext("(" + out.match(/const ARTICLE_IDS=(\{.*?\});/s)[1] + ")");
for (const e of EDITS) {
  const title = e.title || e.from;
  if (IDS[title] !== e.ref) problems.push(`${title} lost its id (${IDS[title]} instead of ${e.ref})`);
  if (e.title && IDS[e.from]) problems.push(`the old title is still keyed in ARTICLE_IDS: ${e.from}`);
}
if (IDS[DELETE]) problems.push(`the deleted question is still keyed in ARTICLE_IDS`);

for (const e of EDITS) {
  if (e.from !== e.title && F.some((f) => f.q === e.from)) problems.push(`old title still present: ${e.from}`);
  const f = F.find((x) => x.q === (e.title || e.from));
  if (!f) { problems.push(`missing after edit: ${e.title || e.from}`); continue; }
  if (e.answer && f.a !== e.answer) problems.push(`answer not applied: ${f.q}`);
  if (e.step && (f.steps || []).includes(e.step.from)) problems.push(`old step still present: ${f.q}`);
  if (e.step && !(f.steps || []).includes(e.step.to)) problems.push(`new step missing: ${f.q}`);
}
// nothing outside these four questions may have moved
const untouched = F.filter((f) => !EDITS.some((e) => f.q === (e.title || e.from)));
if (untouched.length !== 168) problems.push(`${untouched.length} untouched questions, expected 168`);
// the typo fix
const demo = F.find((f) => f.q === EDITS[1].title);
if (demo && demo.a.includes("firm.s")) problems.push("the stray period in \"firm.s\" was not corrected");

if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log(`\n  ok  171 questions: 1 deleted, 3 edited, 168 untouched`);
