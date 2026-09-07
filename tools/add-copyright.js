/**
 * Put one copyright line at the foot of every page.
 *
 * The article page used to end with "Answers are maintained by the AssureOne
 * team..." — that is replaced. The product pages keep their product-guide
 * note and gain the copyright beneath it. The knowledge base had no footer at
 * all and gets one.
 *
 * Idempotent.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LINE = "&copy; 2026 AssureOne Technologies LLC. All rights reserved.";

const CSS =
  "\n/* One copyright line at the foot of every page. */\n" +
  ".site-copyright{display:block;color:#8b8fa3;font-size:.78rem;line-height:1.6}\n" +
  ".footer .site-copyright{margin-top:14px}\n" +
  ".site-footer{max-width:1240px;margin:34px auto 0;padding:20px 28px 42px;border-top:1px solid #ecebf3}\n" +
  "@media(max-width:760px){.site-footer{padding:18px 18px 34px}}\n";

function addCss(html, page) {
  if (html.includes(".site-copyright{")) return html;
  // The pages carry several <style> blocks now; append to the last one so the
  // rule also sits after the design layers in the cascade.
  const at = html.lastIndexOf("</style>");
  if (at < 0) throw new Error(`${page}: no </style> to append to`);
  return html.slice(0, at) + CSS + html.slice(at);
}

const results = [];

/* --------------------------------------------------- the knowledge base */
{
  const page = "index.html";
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = addCss(html, page);
  if (!html.includes('class="site-copyright"')) {
    // Straight after the visible shell, ahead of the hidden legacy markup.
    const anchor = "</main>\n";
    if (html.split(anchor).length < 2) throw new Error(`${page}: </main> anchor not found`);
    html = html.replace(anchor, () =>
      anchor + `<footer class="site-footer"><span class="site-copyright">${LINE}</span></footer>\n`);
  }
  if (html !== before) { fs.writeFileSync(file, html); results.push(`${page}: footer added`); }
  else results.push(`${page}: already done`);
}

/* ---------------------------------------------------------- the article */
{
  const page = "article.html";
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = addCss(html, page);
  const OLD = '<p class="ar-foot">Answers are maintained by the AssureOne team. If something here does not match what you see in the product, email <a href="mailto:support@assureone.ai">support@assureone.ai</a>.</p>';
  const NEW = `<p class="ar-foot"><span class="site-copyright">${LINE}</span></p>`;
  if (html.includes(OLD)) html = html.replace(OLD, () => NEW);
  else if (!html.includes(NEW)) throw new Error(`${page}: the old footer line is not in either expected form`);
  if (html !== before) { fs.writeFileSync(file, html); results.push(`${page}: line replaced`); }
  else results.push(`${page}: already done`);
}

/* ----------------------------------------------------- the product pages */
for (const dir of ["assurepro", "assurebooks", "assuretax", "assureaudit"]) {
  const page = `${dir}/index.html`;
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  html = addCss(html, page);
  // Key this off the markup: the CSS added above also contains the name.
  if (!html.includes('class="site-copyright"')) {
    const close = "</footer>";
    if (html.split(close).length !== 2) throw new Error(`${page}: expected exactly one </footer>`);
    html = html.replace(close, () => `<span class="site-copyright">${LINE}</span>${close}`);
  }
  if (html !== before) { fs.writeFileSync(file, html); results.push(`${page}: appended to footer`); }
  else results.push(`${page}: already done`);
}

results.forEach((r) => console.log("  ok  " + r));

/* ------------------------------------------------------------- checks */
const PAGES = ["index.html", "article.html", "assurepro/index.html",
  "assureaudit/index.html", "assurebooks/index.html", "assuretax/index.html"];
const problems = [];
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  const n = (html.match(/class="site-copyright"/g) || []).length;
  if (n !== 1) problems.push(`${page}: ${n} copyright lines, expected 1`);
  if (!html.includes(LINE)) problems.push(`${page}: copyright text missing`);
  if (!html.includes(".site-copyright{")) problems.push(`${page}: copyright styles missing`);
  if (html.includes("Answers are maintained by the AssureOne team")) problems.push(`${page}: old footer line still present`);
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log(`\n  ok  ${PAGES.length} pages carry exactly one copyright line, old line gone`);
