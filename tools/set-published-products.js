/**
 * Control which products' answers are on the live site.
 *
 * Flip a product to false and its answers leave the site entirely: the page
 * becomes a coming-soon notice, the content script that held the questions is
 * removed, and the hub's article index is rebuilt without them. They are not
 * merely hidden with CSS — hiding still ships every answer in the page source,
 * which is no use when the point is that nobody reads them before review.
 *
 * The whole page is copied to drafts/ first, so publishing later is a matter
 * of flipping the flag back and re-running. Nothing is rewritten by hand.
 *
 *     node tools/set-published-products.js
 *     node tools/sync-articles.js     # rebuild the index for what is published
 *     node tools/qc.js
 *
 * Idempotent in both directions.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DRAFTS = path.join(ROOT, "drafts");

/* Which products' answers are live. */
const PUBLISHED = {
  pro: true,
  books: false,
  tax: false,
  audit: false,   // never had content
};

const PRODUCTS = {
  pro: { dir: "assurepro", name: "AssurePro" },
  books: { dir: "assurebooks", name: "AssureBooks" },
  tax: { dir: "assuretax", name: "AssureTax" },
  audit: { dir: "assureaudit", name: "AssureAudit" },
};

const SOON_LEDE = (name) =>
  `${name} answers are being reviewed before we publish them. ` +
  `The help center for ${name} will follow shortly.`;

const soonSection = (name) => `<main class="page">
<section class="category-browser" aria-labelledby="browse-title" style="text-align:center;padding:60px 24px">
<p class="section-kicker">Coming soon</p>
<h2 class="section-title" id="browse-title">The ${name} help center is on its way</h2>
<p class="section-copy" style="max-width:540px;margin:12px auto 0">We are reviewing every ${name} answer before it goes out, the same way we did for AssurePro. Check back soon, or reach out to your account team in the meantime.</p>
<p style="margin-top:28px"><a href="../index.html" style="color:var(--violet-dark);font-weight:700;text-decoration:none">&larr; Back to AssureOne Support</a></p>
</section>
</main>`;

const notes = [];

/** The inline script that carries FAQS is the whole content + rendering half. */
function stripContentScript(html) {
  const re = /<script(?![^>]*src)[^>]*>(?:(?!<\/script>)[\s\S])*?const FAQS=[\s\S]*?<\/script>\n?/;
  return re.test(html) ? html.replace(re, "") : html;
}

function unpublish(key) {
  const { dir, name } = PRODUCTS[key];
  const file = path.join(ROOT, dir, "index.html");
  let html = fs.readFileSync(file, "utf8");

  if (!html.includes("const FAQS=")) return null;      // already a notice

  fs.mkdirSync(DRAFTS, { recursive: true });
  const draft = path.join(DRAFTS, `${dir}-index.html`);
  fs.writeFileSync(draft, html);

  const MAIN = /<main class="page">[\s\S]*?<\/main>/;
  if (!MAIN.test(html)) throw new Error(`${dir}: no <main class="page"> to replace`);
  // Keep the support block and the copyright, which live inside main.
  const main = html.match(MAIN)[0];
  const footer = main.match(/<section class="help-cta[\s\S]*?<\/footer>/);
  const replacement = footer
    ? soonSection(name).replace("</main>", footer[0] + "\n</main>")
    : soonSection(name);
  html = html.replace(MAIN, () => replacement);

  html = stripContentScript(html);

  const LEDE = /<p class="lede">[\s\S]*?<\/p>/;
  if (LEDE.test(html)) html = html.replace(LEDE, () => `<p class="lede">${SOON_LEDE(name)}</p>`);

  fs.writeFileSync(file, html);
  return { draft: path.relative(ROOT, draft), from: fs.readFileSync(draft, "utf8").length, to: html.length };
}

function publish(key) {
  const { dir } = PRODUCTS[key];
  const draft = path.join(DRAFTS, `${dir}-index.html`);
  const file = path.join(ROOT, dir, "index.html");
  const html = fs.readFileSync(file, "utf8");
  if (html.includes("const FAQS=")) return null;       // already live
  if (!fs.existsSync(draft)) {
    throw new Error(`${dir}: marked published but ${path.relative(ROOT, draft)} is missing — nothing to restore from`);
  }
  fs.copyFileSync(draft, file);
  return { restored: path.relative(ROOT, draft) };
}

for (const key of Object.keys(PRODUCTS)) {
  const { dir } = PRODUCTS[key];
  if (PUBLISHED[key]) {
    const r = publish(key);
    notes.push(r ? `${dir}: restored from ${r.restored}` : `${dir}: published, unchanged`);
  } else {
    const r = unpublish(key);
    notes.push(r
      ? `${dir}: answers moved to ${r.draft}, page is now a notice (${r.from} → ${r.to} bytes)`
      : `${dir}: already a notice`);
  }
}

/* The hub's product picker: an unpublished product must say so rather than
 * filter to an empty list. */
{
  const file = path.join(ROOT, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  for (const [key, { dir }] of Object.entries(PRODUCTS)) {
    const plain = `<button class="hc-product" type="button" data-product="${key}">`;
    const soon = `<button class="hc-product hc-product-soon" type="button" data-product="${key}" data-soon="${dir}">`;
    if (PUBLISHED[key]) {
      if (html.includes(soon)) html = html.split(soon).join(plain);
    } else {
      if (html.includes(plain)) html = html.split(plain).join(soon);
    }
  }
  // and the label each soon button carries
  html = html.replace(/(<button class="hc-product hc-product-soon"[^>]*>)([A-Za-z]+)(?:<span class="hc-soon">Soon<\/span>)?(<\/button>)/g,
    (_m, open, label, close) => `${open}${label}<span class="hc-soon">Soon</span>${close}`);
  html = html.replace(/(<button class="hc-product" type="button" data-product="[a-z]*">)([A-Za-z]+)<span class="hc-soon">Soon<\/span>(<\/button>)/g,
    (_m, open, label, close) => `${open}${label}${close}`);

  // clicking one opens its notice instead of filtering to nothing
  const HANDLER_OLD = "document.getElementById('hc-products').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;product=product===b.dataset.product?'':b.dataset.product;visibleLimit=12;render();});";
  const HANDLER_NEW = "document.getElementById('hc-products').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.soon){location.href=b.dataset.soon+'/index.html';return;}product=product===b.dataset.product?'':b.dataset.product;visibleLimit=12;render();});";
  if (html.includes(HANDLER_OLD)) html = html.replace(HANDLER_OLD, () => HANDLER_NEW);

  if (!html.includes(".hc-soon{")) {
    const at = html.lastIndexOf("</style>");
    html = html.slice(0, at) +
      "\n/* A product whose answers are still in review says so on its button. */\n" +
      ".hc-product-soon{color:#6f7390}\n" +
      ".hc-soon{margin-left:7px;padding:2px 6px;border-radius:5px;background:#efedff;color:#5545c7;font-size:.62rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;vertical-align:1px}\n" +
      html.slice(at);
  }

  if (html !== before) { fs.writeFileSync(file, html); notes.push("index.html: product picker marks unpublished products"); }
}

/* drafts/ must never reach the deployment */
{
  const file = path.join(ROOT, ".vercelignore");
  const line = "drafts/";
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (!current.split(/\r?\n/).includes(line)) {
    fs.writeFileSync(file, (current ? current.replace(/\n*$/, "\n") : "") + line + "\n");
    notes.push(".vercelignore: drafts/ excluded from the deployment");
  }
}

/* a note next to the drafts so their status is obvious */
if (fs.existsSync(DRAFTS)) {
  const readme = path.join(DRAFTS, "README.md");
  const body = `# drafts

Product pages whose answers are not published yet. Each file is the complete
page as it was when the product was taken off the site, so publishing is a
restore, not a rewrite.

To publish a product, set it to \`true\` in \`PUBLISHED\` at the top of
\`tools/set-published-products.js\`, then:

    node tools/set-published-products.js
    node tools/sync-articles.js
    node tools/qc.js

\`.vercelignore\` keeps this directory out of the deployment.
`;
  if (!fs.existsSync(readme) || fs.readFileSync(readme, "utf8") !== body) {
    fs.writeFileSync(readme, body);
  }
}

notes.forEach((n) => console.log("  ok  " + n));

/* ------------------------------------------------------------- checks */
const problems = [];
for (const [key, { dir, name }] of Object.entries(PRODUCTS)) {
  const html = fs.readFileSync(path.join(ROOT, dir, "index.html"), "utf8");
  if (PUBLISHED[key]) {
    if (!html.includes("const FAQS=")) problems.push(`${dir}: published but has no questions`);
  } else {
    if (html.includes("const FAQS=")) problems.push(`${dir}: unpublished but the page still carries its questions`);
    if (!html.includes("Coming soon")) problems.push(`${dir}: no coming-soon notice`);
    if (!html.includes("mailto:support@assureone.ai")) problems.push(`${dir}: support link lost`);
    if (!html.includes("site-copyright")) problems.push(`${dir}: copyright lost`);
    // and none of the answers may survive anywhere in the page
    const draft = path.join(DRAFTS, `${dir}-index.html`);
    if (fs.existsSync(draft)) {
      const m = fs.readFileSync(draft, "utf8").match(/const FAQS=(\[[\s\S]*?\n\]);/);
      if (m) {
        const answers = [...m[1].matchAll(/a:"((?:[^"\\]|\\.){40,})"/g)].map((x) => x[1].slice(0, 40));
        const leaked = answers.filter((a) => html.includes(a));
        if (leaked.length) problems.push(`${dir}: ${leaked.length} answers are still in the live page`);
      }
    }
  }
}
{
  const hub = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  for (const [key, { dir }] of Object.entries(PRODUCTS)) {
    const marked = hub.includes(`data-soon="${dir}"`);
    if (PUBLISHED[key] && marked) problems.push(`index.html: ${dir} is published but still marked Soon`);
    if (!PUBLISHED[key] && !marked) problems.push(`index.html: ${dir} is unpublished but not marked Soon`);
  }
  if (!hub.includes("if(b.dataset.soon)")) problems.push("index.html: a Soon button would still filter to an empty list");
  if (!hub.includes(".hc-soon{")) problems.push("index.html: Soon badge styling missing");
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
const live = Object.keys(PUBLISHED).filter((k) => PUBLISHED[k]).map((k) => PRODUCTS[k].name);
console.log(`\n  ok  published: ${live.join(", ") || "none"} — every other product's answers are off the site and kept in drafts/`);
