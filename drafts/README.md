# drafts

Product pages whose answers are not published yet. Each file is the complete
page as it was when the product was taken off the site, so publishing is a
restore, not a rewrite.

To publish a product, set it to `true` in `PUBLISHED` at the top of
`tools/set-published-products.js`, then:

    node tools/set-published-products.js
    node tools/sync-articles.js
    node tools/qc.js

`.vercelignore` keeps this directory out of the deployment.
