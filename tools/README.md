# AssureOne Help Center maintenance

The published experience is composed of three shared templates:

- `index.html` — discovery homepage with search, product status, goal-based paths, featured articles, and all AssurePro topics.
- `category.html` — reusable goal and topic browser. It reads either `?journey=` or `?topic=` from the URL.
- `article.html` — reusable article template with contextual navigation, readable content, numbered procedures, optional media, feedback, and previous/next links.

Shared presentation and behavior live in `assets/css/help-center.css` and
`assets/js/help-center.js`. The six `questions-*.js` files contain the
published AssurePro article index.

## Content workflow

`assurepro/index.html` remains the approved source for questions, answers,
supporting explanations, steps, and stable article ids. After editing its
`FAQS` or `DETAILS` data, rebuild and verify the site:

```text
node tools/sync-articles.js
node tools/build-review-data.js tools/review-doc/assurepro.json
node tools/qc.js
node tools/selftest.js
```

AssureTax, AssureAudit, and AssureBooks are deliberately shown as non-linking
“Coming soon” controls on the homepage. Their unpublished material must not be
added to the shared article index.

## Adding screenshots and videos

The article template accepts optional media without changing page structure.
Add an article `media` object with an `overview` asset and/or `steps` array.
Each asset may provide `src`, `alt`, and `caption`. Store product media under
`assets/media/assurepro/<article-id>/` so assets remain easy to replace when
the interface changes.

## Quality checks

`qc.js` verifies template integrity, all 166 published articles, stable ids,
content synchronization with the approved AssurePro source, client-facing
terminology, unpublished-product boundaries, search/navigation support, media
readiness, and local asset links.

`selftest.js` makes controlled changes in temporary copies and confirms that
the QC catches design, content, product-boundary, media, and support-control
regressions.
