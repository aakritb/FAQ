# Question-review document

Rebuilds `AssurePro-Questions-Review.docx` from the product page, so the
document and the site cannot drift. The document promises that a question's
`Ref` identifies it even after rewording, which only holds if the document was
built from what is actually live.

    node tools/build-review-data.js tools/review-doc/assurepro.json
    cd tools/review-doc && npm i docx && node build-document.js

`assurepro.json` is generated — do not edit it. The finished document belongs in
`drafts/`, which is excluded from the deployment.

The latest round-trip is complete: the approved 8 September 2026 review copy
matches the 166 AssurePro questions now used by the Help Center.
