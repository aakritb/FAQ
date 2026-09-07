/**
 * Two fixes applied on top of the design drop that introduced the
 * functional-polish and article-navigation-v2 blocks.
 *
 * 1. Copy buttons never worked outside an ideal browser.
 *
 *    A copy button has two routes: the async Clipboard API, and the older
 *    document.execCommand('copy'). execCommand only works while the browser
 *    still holds the "user activation" granted by the click, and that
 *    activation is gone by the time a promise callback runs. So this shape
 *
 *        navigator.clipboard.writeText(v).then(ok, function(){ fallbackCopy(v) })
 *
 *    can never recover: wherever the Clipboard API is unavailable — a
 *    sandboxed frame, a page served over http, an unfocused document, some
 *    enterprise policies — the click silently fails. Trying execCommand
 *    first, synchronously inside the click, works in both cases.
 *
 * 2. The compact section navigator did not compact.
 *
 *    It hides the articles outside the current window with the `hidden`
 *    attribute, which the browser styles as display:none — but only in the
 *    user-agent stylesheet, which any author rule outranks. `.ar-side-list a`
 *    sets `display:block`, so every hidden item stayed on screen: the sidebar
 *    still showed the whole category and "View all" did nothing. The same
 *    applies to `.ar-related a`.
 *
 * Idempotent — safe to re-run after another rebuild.
 */
const fs = require("fs");
const path = require("path");
const { hasStyle, hasScript } = require("./lib/regions");

const ROOT = path.resolve(__dirname, "..");
const PAGES = ["index.html", "article.html", "assurepro/index.html",
  "assureaudit/index.html", "assurebooks/index.html", "assuretax/index.html"];

/* ---------------------------------------------------- 1. copy on click */

const SUPPORT_OLD =
  "      if(navigator.clipboard&&navigator.clipboard.writeText){\n" +
  "        navigator.clipboard.writeText(EMAIL).then(function(){setSupportState(support,true);},function(){setSupportState(support,fallbackCopy(EMAIL));});\n" +
  "      }else setSupportState(support,fallbackCopy(EMAIL));";
const SUPPORT_NEW =
  "      // execCommand first, synchronously, while the click still grants\n" +
  "      // permission to copy; the async API is the second attempt.\n" +
  "      if(fallbackCopy(EMAIL)){setSupportState(support,true);}\n" +
  "      else if(navigator.clipboard&&navigator.clipboard.writeText){\n" +
  "        navigator.clipboard.writeText(EMAIL).then(function(){setSupportState(support,true);},function(){setSupportState(support,false);});\n" +
  "      }else setSupportState(support,false);";

const LINK_OLD =
  "      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(function(){done(true);},function(){done(fallbackCopy(value));});\n" +
  "      else done(fallbackCopy(value));";
const LINK_NEW =
  "      if(fallbackCopy(value)){done(true);}\n" +
  "      else if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(function(){done(true);},function(){done(false);});\n" +
  "      else done(false);";

const HELPER_OLD =
  "  function fallbackCopy(text){\n" +
  "    var area=document.createElement('textarea');\n" +
  "    area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';\n" +
  "    document.body.appendChild(area);area.select();\n" +
  "    var ok=false;try{ok=document.execCommand('copy');}catch(e){}\n" +
  "    area.remove();return ok;\n" +
  "  }";
const HELPER_NEW =
  "  function fallbackCopy(text){\n" +
  "    var area=document.createElement('textarea');\n" +
  "    area.value=text;area.setAttribute('readonly','');area.setAttribute('aria-hidden','true');\n" +
  "    area.style.position='fixed';area.style.left='-9999px';area.style.top='0';area.style.opacity='0';\n" +
  "    document.body.appendChild(area);\n" +
  "    // Put back whatever the reader had highlighted.\n" +
  "    var sel=document.getSelection();\n" +
  "    var previous=(sel&&sel.rangeCount)?sel.getRangeAt(0):null;\n" +
  "    area.focus({preventScroll:true});area.select();\n" +
  "    try{area.setSelectionRange(0,text.length);}catch(e){}\n" +
  "    var ok=false;try{ok=document.execCommand('copy');}catch(e){}\n" +
  "    area.remove();\n" +
  "    if(previous&&sel){try{sel.removeAllRanges();sel.addRange(previous);}catch(e){}}\n" +
  "    return ok;\n" +
  "  }";

/* ------------------------------------------- 2. make [hidden] actually hide */

const HIDDEN_CSS =
  "\n/* The section navigator and related list hide entries with the hidden\n" +
  "   attribute. The browser's own [hidden] rule loses to the display rules\n" +
  "   above, so state it here or nothing is ever hidden. */\n" +
  ".ar-side-list a[hidden],.ar-related a[hidden],.ar-side-list [hidden],.ar-rail [hidden]{display:none!important}\n";
const HIDDEN_ANCHOR = "</style>\n<script id=\"article-navigation-v2-script\">";

/* ----------------------------------------------------------------- apply */

let changed = 0;
for (const page of PAGES) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const notes = [];

  for (const [oldText, newText, label] of [
    [SUPPORT_OLD, SUPPORT_NEW, "support copy"],
    [LINK_OLD, LINK_NEW, "copy-link"],
    [HELPER_OLD, HELPER_NEW, "fallbackCopy"],
  ]) {
    if (html.includes(newText)) continue;
    if (!html.includes(oldText)) throw new Error(`${page}: ${label} is not in either expected form`);
    html = html.replace(oldText, () => newText);
    notes.push(label);
  }

  if (html.includes(HIDDEN_ANCHOR) && !hasStyle(html, ".ar-side-list a[hidden]")) {
    html = html.replace(HIDDEN_ANCHOR, () => HIDDEN_CSS + HIDDEN_ANCHOR);
    notes.push("[hidden] honoured");
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    console.log(`  ok  ${page}: ${notes.join(", ")}`);
    changed++;
  } else {
    console.log(`  --  ${page}: already fixed`);
  }
}

/* ---------------------------------------------------------------- checks */

const problems = [];
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");

  if (/function\(\)\{setSupportState\(support,fallbackCopy\(/.test(html))
    problems.push(`${page}: support copy still falls back inside a promise`);
  if (/function\(\)\{done\(fallbackCopy\(/.test(html))
    problems.push(`${page}: copy-link still falls back inside a promise`);

  for (const [needle, label] of [["if(fallbackCopy(EMAIL))", "support"], ["if(fallbackCopy(value))", "copy-link"]]) {
    const sync = html.indexOf(needle);
    if (sync < 0) { problems.push(`${page}: no synchronous ${label} copy`); continue; }
    const asyncAt = html.indexOf("navigator.clipboard.writeText", sync);
    if (asyncAt > -1 && asyncAt < sync) problems.push(`${page}: async ${label} copy runs first`);
  }
  if (!hasScript(html, "sel.addRange(previous)")) problems.push(`${page}: selection not restored`);

  // Only the article page carries the section navigator and its markup; the
  // shared CSS is copied to every page, so key the check off the script.
  if (hasScript(html, "function compactSection()") && !hasStyle(html, ".ar-side-list a[hidden]"))
    problems.push(`${page}: hides nav items but no [hidden] rule outranks the display rule`);
}
if (problems.length) throw new Error("checks failed:\n  " + problems.join("\n  "));
console.log(`\n  ok  ${PAGES.length} pages: copy works on first click, hidden items actually hide`);
