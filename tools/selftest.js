/**
 * Prove the checks can fail.
 *
 * A check that cannot fail is worse than no check: it reports success and
 * hides the thing it was meant to catch. That happened twice here — a guard
 * meant to ask "is this element on the page?" was satisfied by a CSS rule with
 * the same class name, so the element was never added and every check agreed
 * it had been.
 *
 * This runs each tool against a deliberately broken copy of the site and
 * requires it to complain. Every scenario names one region — markup, style or
 * script — and breaks only that, which is exactly the case the old guards
 * could not see.
 *
 *     node tools/selftest.js
 *
 * Nothing here touches the real files: each scenario works on a fresh copy in
 * a temporary directory.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const COPY = ["index.html", "article.html", "vercel.json",
  "questions-1.js", "questions-2.js", "questions-3.js",
  "questions-4.js", "questions-5.js", "questions-6.js",
  "assurepro/index.html", "assurebooks/index.html",
  "assuretax/index.html", "assureaudit/index.html",
  "tools/qc.js", "tools/sync-articles.js", "tools/add-copyright.js",
  "tools/fix-merged-build.js", "tools/add-clean-links.js",
  "tools/remove-discovery-rails.js", "tools/static-hero-headline.js",
  "tools/trim-page-chrome.js", "tools/set-published-products.js",
  "tools/add-dashboard-category.js",
  "tools/lib/regions.js",
  "tools/fix-sticky-header.js",
  ".vercelignore"];

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "assureone-selftest-"));
  // drafts hold the answers an unpublished product will be restored from
  const drafts = path.join(ROOT, "drafts");
  if (fs.existsSync(drafts)) {
    fs.mkdirSync(path.join(dir, "drafts"), { recursive: true });
    for (const f of fs.readdirSync(drafts)) fs.copyFileSync(path.join(drafts, f), path.join(dir, "drafts", f));
  }
  for (const rel of COPY) {
    const to = path.join(dir, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), to);
  }
  return dir;
}

function run(dir, tool) {
  try {
    const out = execFileSync(process.execPath, [path.join(dir, "tools", tool)],
      { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const edit = (dir, rel, fn) => {
  const f = path.join(dir, rel);
  fs.writeFileSync(f, fn(fs.readFileSync(f, "utf8")));
};

/* Each scenario: break one region, then say what must happen. */
const SCENARIOS = [
  {
    name: "one stray closing brace in the hub stylesheet",
    why: "what actually happened: the stray brace ate the very next rule, .topbar{position:sticky}, so the header and its search scrolled away while every other rule still worked",
    break: (dir) => edit(dir, "index.html", (h) =>
      h.replace("min-height:1.12em;color:#5c45e7}", "min-height:1.12em;color:#5c45e7}}")),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "stray }" },
      { tool: "fix-sticky-header.js", mustFail: false, thenRestores: "color:#5c45e7}\n", in: "index.html" },
    ],
  },
  {
    name: "the sticky header rule deleted outright",
    why: "the search in the header is only reachable while the header stays put",
    break: (dir) => edit(dir, "index.html", (h) =>
      h.replace(".topbar{position:sticky;top:0;z-index:30}", "")),
    expect: [{ tool: "qc.js", mustFail: true, mentions: "search scrolls away" }],
  },
  {
    name: "an archive left in the folder while .vercelignore only excludes drafts",
    why: "the state this was actually in: a zip holding 63 held-back answers was downloadable from the shared URL, and QC passed because it only inspected the files it already knew about",
    break: (dir) => {
      fs.writeFileSync(path.join(dir, ".vercelignore"), "drafts/\n");
      fs.writeFileSync(path.join(dir, "AssureOne-Help-Center.zip"), "PK\u0003\u0004 stands in for the real archive");
    },
    expect: [{ tool: "qc.js", mustFail: true, mentions: "must carry only the site" }],
  },
  {
    name: "a review document at the top level, with *.docx dropped from .vercelignore",
    why: "one of those documents lists every AssureBooks and AssureTax answer",
    break: (dir) => {
      edit(dir, ".vercelignore", (t) => t.replace("*.docx\n", ""));
      fs.writeFileSync(path.join(dir, "AssureOne-FAQ-Question-Review.docx"), "stands in for the review document");
    },
    expect: [{ tool: "qc.js", mustFail: true, mentions: "must carry only the site" }],
  },
  {
    name: "a held-back answer pasted into a file nothing links to",
    why: "the leak check must cover whatever would deploy, not a fixed list of pages",
    break: (dir) => {
      const draft = fs.readFileSync(path.join(dir, "drafts", "assurebooks-index.html"), "utf8");
      const a = draft.match(/a:"((?:[^"\\]|\\.){80,})"/)[1];
      fs.writeFileSync(path.join(dir, "handover-notes.txt"), "draft copy for later:\n" + a + "\n");
    },
    expect: [{ tool: "qc.js", mustFail: true, mentions: "held back for review" }],
  },
  {
    name: "copyright element deleted, its CSS left in place",
    why: "the exact bug: a guard keyed on the class name would see the CSS and skip",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace('<span class="site-copyright">&copy; 2026 AssureOne Technologies LLC. All rights reserved.</span>', "")),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "copyright element" },
      { tool: "add-copyright.js", mustFail: false, thenRestores: 'class="site-copyright"', in: "article.html" },
    ],
  },
  {
    name: "copyright CSS deleted, its element left in place",
    why: "the mirror case — the rule must be restored, not assumed from the markup",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace(".site-copyright{display:block;color:#8b8fa3;font-size:.78rem;line-height:1.6}\n", "")),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "copyright styles missing" },
      { tool: "add-copyright.js", mustFail: false, thenRestores: ".site-copyright{", in: "article.html" },
    ],
  },
  {
    name: "answer-link template removed from a product page",
    why: "its CSS class stays behind, which is what fooled the check the first time",
    break: (dir) => edit(dir, "assurepro/index.html", (h) =>
      h.replace('<a class="answer-link" href="../article.html?id=', '<a class="answer-link" href="BROKEN')),
    expect: [{ tool: "qc.js", mustFail: true, mentions: "answer-link" }],
  },
  {
    name: "copy button reverted to falling back inside a promise",
    why: "the defect that made every copy button do nothing outside an ideal browser",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace("      if(fallbackCopy(EMAIL)){setSupportState(support,true);}\n      else if(navigator.clipboard&&navigator.clipboard.writeText){",
                "      if(navigator.clipboard&&navigator.clipboard.writeText){")),
    expect: [{ tool: "fix-merged-build.js", mustFail: true, mentions: "expected form" }],
  },
  {
    name: "the [hidden] rule removed from the section navigator",
    why: "without it the navigator silently shows every article",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace(".ar-side-list a[hidden],.ar-related a[hidden],.ar-side-list [hidden],.ar-rail [hidden]{display:none!important}\n", "")),
    expect: [{ tool: "fix-merged-build.js", mustFail: false, thenRestores: ".ar-side-list a[hidden]", in: "article.html" }],
  },
  {
    name: "an article id pointed at something that does not exist",
    why: "a dead link inside the app looks like a working one until it is clicked",
    break: (dir) => edit(dir, "assurepro/index.html", (h) =>
      h.replace(/"pro-what-is-assurepro-1"/, '"pro-does-not-exist-999"')),
    expect: [{ tool: "qc.js", mustFail: true, mentions: "" }],
  },
  {
    name: "an answer changed on a product page but the index not rebuilt",
    why: "the hub would search and display text the product page no longer says",
    break: (dir) => edit(dir, "assurepro/index.html", (h) =>
      h.replace('a:"AssurePro is AssureOne\'s practice-management foundation.',
                'a:"Something else entirely, long enough to be a real answer.')),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "differs from the product page" },
      { tool: "sync-articles.js", mustFail: false, thenRestores: "Something else entirely", inAnyOf: ["questions-1.js", "questions-2.js", "questions-3.js", "questions-4.js", "questions-5.js", "questions-6.js"] },
    ],
  },
  {
    name: "the mailto link removed from a page",
    why: "support has to stay reachable on every page",
    break: (dir) => edit(dir, "assurebooks/index.html", (h) =>
      h.replace(/mailto:support@assureone\.ai/g, "#")),
    expect: [{ tool: "qc.js", mustFail: true, mentions: "mailto" }],
  },
  {
    name: "the old footer note put back on the article page",
    why: "it was removed on request; it must not creep back",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace("<p class=\"ar-foot\">", "<p class=\"ar-foot\">Answers are maintained by the AssureOne team. ")),
    expect: [{ tool: "qc.js", mustFail: true, mentions: "old footer note" }],
  },
  {
    name: "a discovery rail put back on the hub",
    why: "the rails were removed on request; an empty or repopulated rail must not return",
    break: (dir) => edit(dir, "index.html", (h) =>
      h.replace("</main>", '<aside class="hc-rail"><div id="hc-popular"></div></aside></main>')),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "discovery rail" },
      { tool: "remove-discovery-rails.js", mustFail: false, thenRestores: "rails-removed:start", in: "index.html" },
    ],
  },
  {
    name: "the article page writing to a rail that no longer exists",
    why: "a leftover write would throw on every article and blank the page",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace("  initSearch();  // the support-copy handler", "  rail.innerHTML='x';\n  initSearch();  // the support-copy handler")),
    expect: [{ tool: "qc.js", mustFail: true, mentions: "removed rail" }],
  },
  {
    name: "the hero headline animation put back",
    why: "the headline was made static on request; a typing loop must not return",
    break: (dir) => edit(dir, "index.html", (h) =>
      h.replace('<span class="hc-typing-line">get answers faster.</span>',
        '<span class="hc-typing-line" aria-hidden="true"><span id="hc-typed">create a client.</span></span>')),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "headline" },
      { tool: "static-hero-headline.js", mustFail: false, thenRestores: '<span class="hc-typing-line">get answers faster.</span>', in: "index.html" },
    ],
  },
  {
    name: "the article breadcrumb bar put back",
    why: "removed on request; the article meta line already carries that context as links",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace("<div class=\"ar-shell\">", '<nav class="ar-crumbs"><div id="ar-crumbs"></div></nav><div class="ar-shell">')),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "breadcrumb" },
      { tool: "trim-page-chrome.js", mustFail: false, thenRestores: "ar-shell", in: "article.html" },
    ],
  },
  {
    name: "the hub result count deleted along with its old container",
    why: "render() writes to it on every keystroke, so losing it breaks search entirely",
    break: (dir) => edit(dir, "index.html", (h) =>
      h.replace('<span class="hc-count" id="hc-count"></span>', "")),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "result count" },
      { tool: "trim-page-chrome.js", mustFail: false, thenRestores: 'id="hc-count"', in: "index.html" },
    ],
  },
  {
    name: "the navigator's collapse label reverted to jargon",
    why: "\"Show nearby articles\" does not tell a reader that pressing it shows less",
    break: (dir) => edit(dir, "article.html", (h) =>
      h.replace("'Show fewer articles'", "'Show nearby articles'")),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "Show nearby articles" },
      { tool: "fix-merged-build.js", mustFail: false, thenRestores: "'Show fewer articles'", in: "article.html" },
    ],
  },
  {
    name: "an unpublished product's answers put back on its live page",
    why: "the whole point is that nobody reads them before review",
    break: (dir) => {
      const draft = fs.readFileSync(path.join(ROOT, "drafts", "assurebooks-index.html"), "utf8");
      fs.writeFileSync(path.join(dir, "assurebooks", "index.html"), draft);
    },
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "unpublished" },
      { tool: "set-published-products.js", mustFail: false, thenRestores: "Coming soon", in: "assurebooks/index.html" },
    ],
  },
  {
    name: "the Dashboard category refiled back into Getting Started",
    why: "eleven dashboard questions would go back to hiding in a 39-question bucket",
    break: (dir) => edit(dir, "questions-1.js", (h) =>
      h.replace(/"category": "Dashboard"/g, '"category": "Getting Started"')),
    expect: [
      { tool: "qc.js", mustFail: false },
      { tool: "add-dashboard-category.js", mustFail: false, thenRestores: '"category": "Dashboard"', inAnyOf: ["questions-1.js", "questions-2.js", "questions-3.js", "questions-4.js", "questions-5.js", "questions-6.js"] },
    ],
  },
  {
    name: "the hub's empty state reverted to \"try another filter\"",
    why: "a deep link to a product in review would tell the reader to try a different filter",
    break: (dir) => edit(dir, "index.html", (h) =>
      h.replace("      const soon=SOON_PRODUCTS[product];\n", "")),
    expect: [
      { tool: "qc.js", mustFail: true, mentions: "" },
      { tool: "set-published-products.js", mustFail: false, thenRestores: "SOON_PRODUCTS[product]", in: "index.html" },
    ],
  },
  {
    name: "a question deleted but its DETAILS entry left behind",
    why: "an orphaned entry means the answer and its extra paragraphs disagree",
    break: (dir) => edit(dir, "assurepro/index.html", (h) =>
      h.replace(/\{c:"platform",q:"What is AssurePro\?"[\s\S]*?\},\n/, "")),
    expect: [{ tool: "sync-articles.js", mustFail: true, mentions: "DETAILS" }],
  },
];

/* ------------------------------------------------------------------ run */

let passed = 0;
const failures = [];

console.log("Each scenario breaks one thing and requires a tool to notice.\n");

for (const s of SCENARIOS) {
  const dir = sandbox();
  s.break(dir);
  const notes = [];
  let ok = true;

  for (const step of s.expect) {
    const r = run(dir, step.tool);
    if (step.mustFail) {
      if (r.ok) { ok = false; notes.push(`${step.tool} passed but should have failed`); continue; }
      if (step.mentions && !r.out.includes(step.mentions)) {
        ok = false;
        notes.push(`${step.tool} failed, but not about "${step.mentions}"`);
        continue;
      }
      notes.push(`${step.tool} reported it`);
    } else {
      if (!r.ok) { ok = false; notes.push(`${step.tool} errored: ${r.out.split("\n").find((l) => l.includes("Error")) || "?"}`); continue; }
      if (step.thenRestores) {
        const where = step.inAnyOf || [step.in];
        const found = where.some((rel) =>
          fs.readFileSync(path.join(dir, rel), "utf8").includes(step.thenRestores));
        if (!found) {
          ok = false;
          notes.push(`${step.tool} ran but did not restore "${step.thenRestores}" in ${where.join(" / ")}`);
          continue;
        }
        notes.push(`${step.tool} repaired it`);
      }
    }
  }

  fs.rmSync(dir, { recursive: true, force: true });
  if (ok) { passed++; console.log(`  ok    ${s.name}\n          ${notes.join("; ")}`); }
  else { failures.push([s.name, notes]); console.log(`  FAIL  ${s.name}\n          ${notes.join("; ")}`); }
}

console.log("\n" + "=".repeat(64));
console.log(`${passed}/${SCENARIOS.length} scenarios behaved as required.`);
if (failures.length) {
  console.log("\nThese checks did not catch what they are supposed to catch:");
  failures.forEach(([n, notes]) => console.log(`  - ${n}: ${notes.join("; ")}`));
  process.exit(1);
}
console.log("\nEvery check demonstrated it can fail.");
