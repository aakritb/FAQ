# tools

## `node tools/sync-articles.js`

Rebuilds the hub's article index (`questions-*.js`) from the product pages.

The product pages — `assurepro/`, `assurebooks/`, `assuretax/` — are the source
of truth for questions and answers. Each holds them in a `FAQS` array, plus a
separate `DETAILS` map of extra paragraphs keyed by question. Edit a page, then
run this to propagate the change to the hub's search and to the article pages.

Existing articles keep their id, category, description and read time, so links
stay valid. A deleted question is dropped; a new one gets a generated record.
Both are reported.

Retired ids are never reused, so deleting a question and adding it back gives
it a new id — any link shared earlier will stop resolving rather than quietly
land on a different article.

When deleting a question, remove its `DETAILS` entry too; the script refuses to
run while an orphaned entry remains.

## `node tools/qc.js`

Checks the whole site: files present, all JavaScript parses, article data
complete and matching the product pages, every internal link resolving, support
routes on every page, the hub's search rules in place, and no unbalanced tags.
Exits non-zero on any failure. Run it after `sync-articles.js`.

## Typical flow

```
# edit assurepro/index.html (or another product page)
node tools/sync-articles.js
node tools/qc.js
git add -A && git commit && git push
vercel --prod
```
