# tools

Run order after any content or design change:

```
node tools/sync-articles.js          # rebuild the article index from the product pages
node tools/fix-merged-build.js       # re-apply the copy and navigator fixes
node tools/add-copyright.js          # re-apply the footer copyright
node tools/remove-discovery-rails.js # keep the right-hand rails out
node tools/static-hero-headline.js   # keep the hero headline static
node tools/qc.js                     # check everything
node tools/selftest.js               # check that the checks still work
```

Every script is idempotent: running it on unchanged files rewrites the same
bytes.

## `sync-articles.js`

Rebuilds the hub's article index (`questions-*.js`) from the product pages.

The product pages — `assurepro/`, `assurebooks/`, `assuretax/` — are the source
of truth for questions and answers. Each holds them in a `FAQS` array, plus a
separate `DETAILS` map of extra paragraphs keyed by question. Edit a page, then
run this to propagate the change to the hub's search and the article pages.

Existing articles keep their id, category, description and read time, so links
stay valid. A deleted question is dropped; a new one gets a generated record.
Both are reported. Retired ids are never reused, so deleting a question and
adding it back gives it a new id — any link shared earlier stops resolving
rather than quietly landing on a different article. When deleting a question,
remove its `DETAILS` entry too; the script refuses to run while an orphan
remains.

## `fix-merged-build.js`

Two fixes that a rebuild of the design layer can undo:

- **Copy buttons must call `execCommand` synchronously inside the click.**
  Reaching it from a promise callback is too late — the click's user
  activation is gone — so wherever the async Clipboard API is unavailable the
  button silently does nothing.
- **The section navigator needs a `[hidden]` rule of its own.** It hides
  entries with the `hidden` attribute, whose `display:none` lives only in the
  user-agent stylesheet, and `.ar-side-list a{display:block}` outranks it.

## `add-copyright.js`

Puts `© 2026 AssureOne Technologies LLC. All rights reserved.` at the foot of
every page, and keeps the old "Answers are maintained by…" note from returning.

## `remove-discovery-rails.js`

Keeps the right-hand rails out. The hub carried "Popular now" and "Latest
articles"; the article page carried "Related articles". Those were the only
cards in either rail, so both rails were removed and the grids collapsed to
two columns, with the reading column taking the freed width.

The layout is corrected by a rule appended last rather than by unpicking the
four style layers that size those grids — they overwrite each other, and a
combined selector like `.hc-sidebar,.hc-rail{...}` cannot be edited safely by
pattern. The rail CSS that remains targets nothing; it is dead but harmless.

## `static-hero-headline.js`

Keeps the hero headline static. It used to type and delete its way through five
phrases behind a blinking caret; it now reads "Hi! Let's help you get answers
faster." and stays there.

The animated half carried `aria-hidden` with a screen-reader-only duplicate
beside it, because text that rewrites itself cannot be read aloud. Both are
gone, so the heading is simply read as written — with a space between its two
spans, or it is announced as "youget".

## `qc.js`

Checks the whole site: files present, all JavaScript parses, article data
complete and matching the product pages, every internal link resolving, support
routes on every page, the hub's search rules, the footer, clean-URL handling,
and balanced tags. Exits non-zero on any failure.

## `selftest.js`

Checks that `qc.js` and the fix scripts can actually fail.

This exists because of a specific mistake. A script that adds an element guards
itself with "have I already done this?" — and when that guard looked for a bare
class name, the stylesheet the same script had just added satisfied it. The
element was never added, the script reported success, and a check written the
same way agreed. It happened twice, with `answer-link` and `site-copyright`.

`selftest.js` breaks one thing at a time in a throwaway copy of the site and
requires a tool to notice. Each scenario damages a single region — markup,
style or script — which is exactly the case those guards could not see. It
found two real bugs the first time it ran: `add-copyright.js` could not repair
a deleted element, and `qc.js` missed a deleted `.site-copyright` rule because
its needle also matched `.footer .site-copyright`.

## `lib/regions.js`

Splits a page into markup, style and script so a check can say which region it
means: `hasMarkup`, `hasStyle`, `hasStyleRule`, `hasScript`,
`hasMarkupOrScript`, `countIn`. Use these rather than a bare
`html.includes(...)` for anything that asserts an element, a rule, or code
exists — that is what prevents the mistake above.

`hasStyleRule` is the stricter form: `hasStyle(html, ".foo{")` also matches
`.bar .foo{`, so a deleted base rule can pass unnoticed.

## `add-clean-links.js`

Rewrites in-page links to clean paths when the site is served over http, and
leaves them alone when the folder is opened from disk.
