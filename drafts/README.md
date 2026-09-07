# drafts

Product pages whose answers are not published yet. Each file is the complete
page as it was when the product was taken off the site, so publishing is a
restore, not a rewrite.

To publish a product, set it to `true` in `PUBLISHED` at the top of
`tools/set-published-products.js`, then:

    node tools/set-published-products.js
    node tools/sync-articles.js
    node tools/qc.js

## Review documents

`AssurePro-Questions-Review.docx` and `AssureOne-FAQ-Question-Review.docx` are
the question-review documents. Both are superseded: the AssurePro round-trip is
complete and the live text no longer matches either file. They are kept only as
a record of what was reviewed and are safe to delete.

They live here because they were previously downloadable from the shared URL,
and the AssureOne-FAQ one lists every AssureBooks and AssureTax answer.

## Why this directory exists

`.vercelignore` keeps it out of the deployment, so nothing here is reachable
from the URL shared with customers. It is readable in the git repo, which is
fine — the URL is the thing that must not carry it.
