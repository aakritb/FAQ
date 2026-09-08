# TaxDome Help Center — structural analysis

Captured 2026-09-08 from https://help.taxdome.com, for reference when redesigning the AssureOne help center. Everything below was verified directly against the live site (DOM inspection, computed styles, sitemap), not guessed from a screenshot.

## Scale, for context

| | TaxDome | AssureOne (current) |
|---|---|---|
| Top-level sections | 7 | 1 hub, 4 product pages |
| Categories (all levels) | 142 | 13 (AssurePro only) |
| Articles | 515 | 166 (AssurePro; 3 products unpublished) |
| Nesting depth | Up to 4 levels (Section → Category → Subcategory → Article) | 1 level (Category → Article) |

TaxDome's help center is an order of magnitude larger and covers a multi-product suite with role-based journeys. Not everything here is worth copying at AssureOne's current scale — noted inline where something is a function of size rather than a design choice worth borrowing.

## 1. Information architecture — organized by *who you are*, not by *feature*

This is the single most important structural difference from AssureOne's current hub, which organizes by feature area (Platform, Settings, Clients, Documents, Workflow...). TaxDome's top level organizes by **audience and journey stage** first:

1. **Get started as a firm owner** — onboarding journey for the buyer/admin
2. **Get started as a team member** — a *separate, parallel* onboarding journey for staff, with its own "Core concepts" and "Quick-start tutorials" categories that partially overlap in content with #1 (e.g. "Finding your way around TaxDome" is linked from both) but are curated separately per audience
3. **Work with clients** — day-to-day task-based work (the largest section: adding clients, pipelines, tasks, jobs, calendar)
4. **Run your firm** — firm-level admin operations (team, billing, reporting, website, subscription)
5. **TaxDome for your practice** — the same platform sliced by **vertical/practice type** (bookkeeping, tax preparation, payroll) — task-oriented content re-packaged for a specific kind of firm
6. **Reference & support** — the catch-all: account management, feature reference, FAQs, troubleshooting
7. **What's new** — release notes, feature-rollout-stage explainer, and a link out to an ideas/voting board

Takeaway for AssureOne: a role/journey split (firm owner vs. team member vs. client-facing work) or at least a distinct "Getting started" front door separate from the feature-reference material would mirror this. Right now AssureOne's hub mixes onboarding-style questions ("What is AssurePro?") into the same flat category list as deep reference questions ("Is multi-factor authentication available...?").

### Full category slug list (142)

Saved in full at the bottom of this document in case exact naming/URL conventions are useful later — see Appendix A.

## 2. Homepage anatomy

Three stacked sections inside `<main>`, no icons anywhere on the homepage — everything is typographic:

1. **Hero** — H1 "TaxDome Help Center", one-line subtitle ("Type your question below or browse the knowledge base"), then the search bar. No hero image, no illustration.
2. **Featured articles** — 4 cards, title-only (no description), linking straight to specific articles (not categories). Picked editorially, not by popularity metric visible to the user.
3. **"Get to know TaxDome"** — the 7 top-level sections as cards: bold title (`<h3>`) + one-line description (`<p>`), no icon, no article count badge. Plain text link cards in a grid.

Footer is minimal: wordmark, "4.7/5 across 6,200+ reviews" (social proof), copyright. No link columns, no sitemap-in-footer, no newsletter signup.

Header: logo + "Help Center" wordmark, two dropdown menus (**Resources**: onboarding training, community, webinars — all external; **About us**: about, trust center, testimonials, contact sales — all external), Sign up / Log in buttons. So the help center's own header pulls the reader *out* to marketing/community properties — it doesn't try to contain everything.

## 3. Persistent left sidebar — the real navigation backbone

The nested category tree (all 7 sections → their categories → their subcategories → article titles) is **not** only on the homepage — it's a permanent left sidebar present on every category and article page (`<aside class="sidebar sticky">`), built as a multi-level accordion:

- Clicking a section header expands/collapses its children (only one branch open at a time per level — opening a sibling closes the previous one, based on the toggle script).
- On an **article** page, the sidebar auto-expands every ancestor of the current article and marks the current article `class="current-page"` — so the reader always sees exactly where they are in the full tree without needing breadcrumbs to do that job.
- It's `position: sticky`, so it stays visible while the article body scrolls.
- A thin breadcrumb (`Home / Category name`) also exists at the top of category pages, but on article pages the sidebar does the "where am I" work; the breadcrumb is secondary.

Takeaway: this is a meaningfully different navigation model from AssureOne's current article reader, which has no persistent category tree at all — just a compact "nearby articles" list scoped to one category. TaxDome's approach scales better for a large, deep taxonomy; AssureOne's flatter, single-product structure may not need the full accordion, but the *auto-expand-and-highlight-current-location* idea is worth keeping regardless of depth.

## 4. Article page anatomy

In reading order:

1. **Title** (H1)
2. **In-content "Table of Contents"** — a plain jump-link list built from the article's own H2 headings (e.g. "Homepage / Sidebar menu / The New button / Global search bar / Top bar / Account settings"), sitting at the very top of the article body, above the first paragraph. Anchors are `#1`, `#2`, `#3`... (matching heading order, not slugified heading text).
3. **Body**, structured with real `<h2>` sections matching the TOC. Long articles (the one inspected had 6 H2 sections and 14 embedded images/GIFs) mix prose, inline links to other articles/glossary terms, and screenshots/animated GIFs demonstrating the UI directly in the flow — not off to a side rail.
4. **"Was this article helpful?" — Yes/No** feedback widget (two icon buttons, thumbs-up/down style SVGs), sits right after the body, before related content.
5. **Share widget** — "Share" label + three icon buttons: copy-link (with a "Link copied" confirmation), LinkedIn, Facebook. No Twitter/X, no email option. Marked `no-print` (there's a dedicated print stylesheet).
6. **Related articles** — same card/heading component (`_topText_` + `<h2>`) reused from the homepage's "Featured articles"/"Get to know TaxDome" sections — link list, title only, no description. 4 links in the example inspected.

No callout/tip/warning boxes were found in the one article inspected (worth checking a second article before concluding these don't exist at all in the pattern library — the CSS bundle names suggest a fairly small, consistent component set, so likely genuinely absent and callouts are folded into regular prose sentences instead).

## 5. Search

- **Instant AJAX dropdown** on the homepage's hero search input (`data-index="help_center_docs_en"` — the naming convention strongly suggests a hosted search service such as Algolia rather than something homegrown).
- Typing populates a dropdown with: an **"Ask AI"** row at the top that echoes the literal typed query ("Ask AI 'invite client'") — an explicit invitation to hand the query to an AI answer rather than the index, not just a fallback for zero results; a **"Relevant articles"** label; up to ~5 results as title + one-line description snippet; an **"All results"** link to a dedicated `/search/` page.
- Result relevance was loose/fuzzy rather than strict keyword matching — a query for "invite client" surfaced "Hide invoices from clients" among lower-ranked hits, suggesting typo-tolerant/semantic matching (or shared-token overlap) rather than exact-phrase-only ranking.
- No visible category filter or faceting in the dropdown — it searches across the entire 515-article corpus at once.

## 6. Visual design tokens

Verified via computed styles, not eyeballed:

- **Typeface:** `Suisse, Inter, Arial, sans-serif` (Suisse Int'l is a paid/custom font; Inter is the reasonable free fallback if reproducing this)
- **Body text color:** `#000724` (near-black navy, not pure black)
- **Accent / link / primary-button color:** `#2851F5` (a saturated blue)
- **Corner radius:** 10px on both the search input and primary buttons — consistent, moderate rounding, not pill-shaped and not sharp
- **H1 size/weight:** 56px / 600 — large, confident hero heading, no gradient or decorative background treatment behind it
- **Cards:** the homepage category/featured cards have **no background, no border, no shadow** in the default state — they read as plain text blocks in a grid, not boxed "cards" in the visual sense despite functioning as click targets. (Confirmed via computed style: `background: transparent; border: none; box-shadow: none; border-radius: 0`.) This is a notably restrained, editorial visual style compared to AssureOne's current boxed/shadowed card treatment.
- Built on **Astro** (static-site generator) — file naming (`_astro/*.css`, scoped CSS-module-style class hashes like `_category_nkva5_29`) confirms component-scoped CSS rather than one global stylesheet.

## 7. "What's new" / release notes format

Not a series of one-post-per-item entries — release notes for an entire year live on **one article**, with a TOC of month names (`August 2026, July 2026, ... January 2026`) linking to H2 sections. Each entry within a month follows a consistent micro-pattern: **Bold feature name:** one-to-three sentence plain-language description of the change and why it matters, occasionally naming the specific UI location. No screenshots inline in the release notes themselves (unlike regular articles, which are screenshot-heavy).

The "What's new" section also links out to a **feature-lifecycle explainer** (why some users see features before others — staged rollout) and a **public ideas/voting board** for feature requests — both framed as trust/expectation-setting content, not just a changelog.

## Things that are a function of TaxDome's size, not necessarily worth copying at AssureOne's current scale

- The 4-level-deep sidebar accordion — AssureOne's flat 13-category, single-product structure doesn't need that much nesting yet. The *auto-expand-and-highlight* behavior is the reusable idea, not the depth.
- Splitting "get started" content across two near-duplicate journeys (firm owner vs. team member) — only worth doing once AssureOne has enough content that role-specific curation earns its keep; right now it would just fragment 166 questions into two thin paths.
- The practice-vertical section ("TaxDome for your practice": bookkeeping/tax/payroll) — this is the AssureBooks/AssureTax/AssureAudit split waiting to happen once those products are actually published; it's a preview of AssureOne's own likely future shape once more than AssurePro is live.

## Open questions worth checking before committing to a redesign

- Whether callout/tip/warning boxes genuinely don't exist anywhere in TaxDome's article body pattern (only one article was inspected in depth)
- The exact `/search/` full-results page layout (couldn't get results to render outside the live search-box interaction — the query hand-off to that page happens client-side, not via a URL parameter)
- Mobile layout specifics (not inspected — the browser session used here couldn't render/interact visually; everything above was verified via DOM/computed-style inspection rather than screenshots)

---

## Appendix A — full category slug list (142), as found in the sitemap

```
71-getting-started, 73-workflow-automation, 74-crm-clients, 75-documents, 77-apps,
78-billings, 80-site-management, 81-legal, 82-troubleshooting, 440-team-communication,
442-organizers, 801-tax-preparation-with-taxdome, 808-bookkeeping-in-taxdome,
809-payroll-in-taxdome, 1167-signatures, 1208-guides, 1324-proposals,
1341-team-members-essentials, 1359-reporting, 1441-release-notes,
account-access-team, account-access-troubleshooting, account-roles,
accounting-bookkeeping, add-and-organize-clients, analyze-data, automate-billing,
automate-client-communication, automate-docs, automate-info-docs,
billing-firm-operations, billing-templates, bookkeeping-operations,
browser-system-setup, client-chats, client-communication,
client-communication-overview, client-portal, client-profile,
client-troubleshooting, common-integrations, communication-integrations,
communication-templates, configure-invoicing, core-concepts, crm-client-portal,
crm-communication-troubleshooting, crm-setup, custom-domain, desktop,
docs-migration, document-management, documents-signatures-troubleshooting, email,
email-sync-setup, faqs, features-explained, files-folders, firm-mobile,
firm-operations, germany, import-contacts, integrations-workflow-troubleshooting,
intro, invoices, irs, job-recurrences, job-statuses, jobs, juno, manage-account,
manage-all-your-work, manage-billing, manage-communication, manage-firm-portal,
manage-organizers, manage-subscription, manage-workflows, marketplace,
more-integrations, payment-providers, payments, pipeline-automation-guides,
pipeline-automation-use-cases, platforms-access, preferences-notifications,
prepare-organizers, quickbooks, quickbooks-bookkeeping, recurring-invoices,
reference, reference-activity-audit, reference-billing, reference-clients,
reference-communications, reference-documents, reference-organizers,
reference-reporting, reference-team-chat, reference-templates,
reference-workflow, reporting, request-docs-info, roles-permissions, security,
security-access, services, set-up-pipelines, settings, sms, start,
start-reports, stripe, subscription-plans, support-options, system-wide,
system-wide-features, tags, tasks, tax-prep-operations,
tax-preparation-integrations, tax-return-delivery, taxdome-integrations,
taxdome-payments, taxdome-universe, team-capacity, team-collaboration,
team-core-concepts, team-management, team-member-accounts,
team-pipelines-setup, team-quick-start-tutorials, time-tracking, troubleshooting,
uk, understand-pricing, upload-documents, web-builder, work-with-documents,
workflow-automation, workflow-templates, zapier
```

## Appendix B — top-level sidebar tree (partial, as captured for sections 1–3)

```
Get started as a firm owner (/category/71-getting-started)
├─ Core concepts & firm setup (/category/core-concepts)
│  ├─ Finding your way around TaxDome
│  ├─ Ways to access TaxDome
│  ├─ TaxDome Dictionary
│  ├─ Set up your TaxDome account as a firm owner
│  ├─ Contacts and accounts explained
│  └─ Set up TaxDome Payments
├─ Get your first workflow running (/category/team-pipelines-setup)
│  ├─ Pipelines explained
│  ├─ Workflow explained
│  └─ Get started with pipelines
├─ Get ready to invite clients (/category/crm-setup)
│  ├─ Try TaxDome with demo clients
│  ├─ Test your setup before going live
│  └─ Introduce TaxDome to your clients
├─ Import your client data (/category/import-contacts)
│  ├─ Get your CRM ready before import
│  ├─ Migrate CRM data to TaxDome in 3 steps
│  ├─ Export your client list from your current software
│  ├─ Prepare your CSV file for import
│  ├─ Import your client data to TaxDome
│  └─ Import a CSV file with taxpayer and spouse on one row
├─ Migrate docs (/category/docs-migration)
│  ├─ Migrate docs to TaxDome in 3 steps
│  ├─ Import documents using the web migration tool
│  ├─ Migrate docs from Canopy / Drake / FileCabinet / Google Drive / Karbon / ShareFile / SmartVault
└─ Quick-start tutorials (/category/intro)
   ├─ What you can do in TaxDome
   ├─ Learn basics in practice
   ├─ Set up pipelines in practice
   └─ Invite and onboard your clients

Get started as a team member (/category/1341-team-members-essentials)
├─ Core concepts & account setup (/category/team-core-concepts)
│  ├─ Finding your way around TaxDome
│  ├─ Ways to access TaxDome
│  ├─ Team member's registration & set-up
│  ├─ TaxDome Dictionary
│  ├─ Contacts and accounts explained
│  └─ Workflow explained
└─ Quick-start tutorials (/category/team-quick-start-tutorials)
   ├─ Get started as a team member in TaxDome
   ├─ What you can do in TaxDome
   └─ Learn basics in practice

Work with clients (/category/start)
├─ Add & organize clients (/category/add-and-organize-clients)
│  ├─ Add clients (/category/74-crm-clients) — 9 articles
│  ├─ Manage tags & custom fields (/category/tags) — 9 articles
│  ├─ Set up client profiles (/category/client-profile) — 6 articles
│  └─ Organize your client data (/category/client-portal) — 4 articles
└─ Work with pipelines (/category/73-workflow-automation)
   ├─ Workflow explained
   ├─ Work with jobs (/category/jobs) — 6 articles
   ├─ Work with tasks (/category/tasks) — 4 articles
   └─ Manage all your work (/category/manage-all-your-work) — ...
```

Note: some category names repeat verbatim across audiences ("Core concepts & firm setup" / "Core concepts & account setup" both link to "Finding your way around TaxDome", "TaxDome Dictionary", etc.) — the same articles are cross-listed under multiple parent categories rather than duplicated as separate content. Worth confirming whether that's true site-wide (a genuine many-to-many category/article relationship) before assuming AssureOne's one-article-one-category model needs to change.
