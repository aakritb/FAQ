/**
 * Split an HTML page into its three regions, so a check can say which one it
 * means.
 *
 * This exists because of a bug worth not repeating. A script that adds an
 * element guards itself with "have I already done this?" — and if that guard
 * looks for a bare class name, the stylesheet the same script added will
 * satisfy it. The element then never gets added, the script reports success,
 * and a check written the same way agrees. It happened twice: once with
 * `answer-link` and once with `site-copyright`.
 *
 * The rule these helpers enforce: say the region.
 *
 *   hasMarkup(html, '<span class="site-copyright">')  // an element exists
 *   hasStyle(html, '.site-copyright{')                // a rule exists
 *   hasScript(html, 'function copyNow(text)')         // code exists
 *
 * `markup` here means "outside <style> and <script>". A page that builds its
 * markup inside a JS string — the hub's header does — will carry that markup
 * in the script region, so use hasMarkupOrScript for anything that might be
 * written either way.
 */

function regions(html) {
  const style = [];
  const script = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) style.push(m[1]);
  for (const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) script.push(m[1]);
  const markup = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  return { style: style.join("\n"), script: script.join("\n"), markup };
}

const hasStyle = (html, needle) => regions(html).style.includes(needle);
const hasScript = (html, needle) => regions(html).script.includes(needle);
const hasMarkup = (html, needle) => regions(html).markup.includes(needle);

function hasMarkupOrScript(html, needle) {
  const r = regions(html);
  return r.markup.includes(needle) || r.script.includes(needle);
}

/** Count occurrences in one region, for "exactly one of these" checks. */
function countIn(html, region, needle) {
  const text = regions(html)[region];
  if (text === undefined) throw new Error(`unknown region "${region}"`);
  let n = 0, i = 0;
  while ((i = text.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
  return n;
}

/**
 * Does the stylesheet declare this exact selector as a rule of its own?
 *
 * hasStyle(html, ".site-copyright{") also matches ".footer .site-copyright{",
 * so deleting the base rule can go unnoticed. This requires the selector to
 * start the rule.
 */
function hasStyleRule(html, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(?:^|[}\\n;,])\\s*" + esc + "\\s*\\{").test(regions(html).style);
}

module.exports = { regions, hasStyle, hasScript, hasMarkup, hasMarkupOrScript, countIn, hasStyleRule };
