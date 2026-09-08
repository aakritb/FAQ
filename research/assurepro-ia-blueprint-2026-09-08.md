# AssurePro Knowledge Base — Restructuring Blueprint (Phase 1)

Prepared 2026-09-08. Scope: information architecture only — no article rewrites, no new article inventory. Reviews the **deployed** implementation at `assureone-knowledgebase.vercel.app` (git commit `9bfcae3`), not any newer local work-in-progress, since that is the version currently live for real readers. External references: TaxDome Help Center (deep DOM/structure audit already on file at `research/taxdome-help-center-analysis.md`), DataSnipper Knowledge Base, Atlassian Support — all fetched and reviewed for this phase.

---

## A. Current-state findings

**Scale verified:** 166 published AssurePro articles, 17 top-level collections, 88 guides (sub-categories), 1 flat level of nesting below "guide" (Collection → Guide → Article). 3 sibling products (AssureBooks, AssureAudit, AssureTax) exist only as non-navigating "Coming soon" entries.

### 1. Every article title is question-style — 166/166
Sampled the full live article set. **100% of titles are phrased as questions**: "How do I…", "What is…", "Can…", "Does…", "Are…". Examples pulled directly from the deployed data:
- "Can the firm export its data if it cancels its AssurePro subscription?"
- "How are teams, members, invitations, and roles managed?"
- "Does a client set a password for the client portal, or use a passwordless link?"

None currently use the instructional pattern requested ("Set up…", "Create and manage…", "Track…"). This is a full-inventory rewrite, not a spot-fix — flagged here for the article-table phase, not attempted now.

### 2. Repeated/overlapping module names
- **"Work & Workflow" → "Workflow" → "Workflow Tasks"** — the collection, one of its guides, and a second guide all repeat "Workflow" with no added meaning between levels. This is the exact anti-pattern named in the brief.
- **Two separate, overlapping security modules**: "Security & Access" (Account Security, Firm User Access, Client Access, Credentials, Tax Connector) and "Security, Compliance & Data" (Data Security, Compliance, Data Retention & Export) sit as two different top-level collections. A reader has no way to predict which one holds a given security question.
- **"Time & Billing" and "Services" are split** into two unrelated top-level collections (2 guides and 4 guides respectively) even though Service → Time Entry → Invoice → Payment is one continuous firm workflow.
- **"Subscription & Firm Payments" and "Referrals"** are each a single-guide, single-topic top-level collection — thinner than every other module by an order of magnitude, and both are firm-administration concerns wearing their own top-level billing.

### 3. Duplication between "Getting Started" and the homepage journeys
The "Getting Started" collection contains both generic onboarding (*Getting started with AssurePro*, *Account & login*, *Navigate AssurePro*) **and** two role-specific guides — *Get started as a firm administrator* and *Get started as a team member* — that are also, word for word, the titles of two of the six homepage journey cards. A reader can reach "get started as a firm administrator" from the homepage journey **or** by browsing into Getting Started, and nothing marks these as the same destination beyond the URL happening to match. This is the duplication risk named in Principle 2, already latent in the live structure.

### 4. Technical/internal terms used as reader-facing labels
- "Clients & CRM" — "CRM" is internal software vocabulary; a firm user thinks "prospects and clients," not "CRM."
- "Integrations" as a top-level label, with provider-name guides underneath (QuickBooks, Twilio, ProdAff) — fine as internal reference, but the module label itself doesn't tell a reader what they can *do*.
- "Reports & Insights" and "Troubleshooting & Support" both pair a plain word with a vaguer one that adds no information.

### 5. Empty modules with no completed content
16 guides currently resolve to "This guide is still being written": *Get started as a team member*, *Email* (comms), *Calls*, *Overview by Role*, *Email* (integrations), *Document Storage*, *QuickBooks*, *Twilio*, *ProdAff*, *Integrations troubleshooting*, *Client Access*, and all five Troubleshooting & Support sub-guides (*Account Issues*, *Client Portal Issues*, *Communication Issues*, *Integration Issues*, *Billing Issues*). These are honestly labeled "Soon" rather than dead links, but they represent real, unfilled destinations a reader can walk into today.

### 6. No "Product Updates" / release-notes module at all
Neither a changelog, a "What's new," nor a release-notes pattern exists anywhere in the current site — the one module every reference site (TaxDome, DataSnipper, Atlassian) treats as a standard, separate top-level fixture.

### 7. What's already working and should be kept
- The article-page sidebar already auto-expands and highlights the reader's current collection/guide, matching TaxDome's "always show where you are" pattern.
- Cross-linking a guide from more than one homepage journey (e.g. *Navigate AssurePro* appears in both the firm-admin and team-member journeys today) is implemented as a **link to one canonical guide**, not a copy — this already satisfies the no-duplication principle and should be preserved, not rebuilt.
- Firm-user / client-user distinctions are already drawn inside article bodies where it matters (Client Portal articles are explicit about what a client sees vs. what a firm user configures) — this discipline should carry forward into headers, not just body copy.
- Almost no article currently over-uses "AssurePro" in its own title — the one verified exception ("...cancels its AssurePro subscription?") is a necessary, specific reference, not filler.

---

## B. Recommended hierarchy

Two structures, kept deliberately separate per Principle 1: a **learning-journey homepage** (7 entry points, role/goal-based) and a **feature index** ("Browse all AssurePro help," 13 modules, exhaustive). A journey links into the feature index's guides; it never forks its own copy of a guide.

```
HOMEPAGE JOURNEYS (curated entry points — links only, no owned content)
├─ Get started as a firm administrator
├─ Get started as a team member
├─ Work with prospects and clients
├─ Deliver client work
├─ Run your firm
├─ Use AI and automation
└─ Find help and reference information

BROWSE ALL ASSUREPRO HELP (the complete, exhaustive feature index)
├─ Start Here
│  ├─ AssurePro explained
│  ├─ Sign in and account basics
│  └─ Find your way around AssurePro
├─ Prospects & Clients
│  ├─ Prospects & Pipeline
│  ├─ Clients
│  └─ Client Portal
├─ Engagements, Workflows & Tasks
│  ├─ Engagements
│  ├─ Workflows & stages
│  ├─ Task templates
│  ├─ Tasks
│  └─ SOPs
├─ Documents & Client Requests
│  ├─ Document workspace & folders
│  ├─ Uploads & imports
│  └─ Document requests
├─ Engagement Letters
│  ├─ Getting started & setup
│  ├─ Services & pricing
│  ├─ Agreement terms
│  ├─ Review & send
│  ├─ Signing
│  └─ Status & audit
├─ Client Communications
│  ├─ Inbox & portal messages
│  ├─ Email
│  ├─ SMS & calls
│  └─ Automated reminders
├─ Time, Services & Billing
│  ├─ Time tracking
│  ├─ Services & pricing
│  └─ Billing & invoices
├─ Overview & Reports
│  ├─ Overview & dashboards
│  ├─ Reports
│  └─ Report alerts
├─ AI & Automation
│  ├─ AI Agent
│  ├─ Daily Briefing
│  └─ AI Credits
├─ Firm Setup & Administration
│  ├─ Firm profile & client portal branding
│  ├─ Team, roles & capacity
│  ├─ Engagement types, templates & tags
│  ├─ Notifications
│  ├─ Subscription & payments
│  └─ Referrals
├─ Connect Your Tools
│  ├─ Getting started with connections
│  ├─ Email
│  ├─ Calendar
│  ├─ Document storage
│  ├─ Payments
│  ├─ QuickBooks
│  ├─ Twilio
│  ├─ ProdAff
│  └─ Tax Connector
├─ Security & Data
│  ├─ Account security
│  ├─ Access & permissions
│  └─ Data security & compliance
├─ Help & Troubleshooting
│  ├─ Account issues
│  ├─ Client portal issues
│  ├─ Communication issues
│  ├─ Integration issues
│  ├─ Billing issues
│  └─ Get support
└─ Product Updates  [new — no current equivalent]
   └─ Release notes by month/quarter
```

Notes on what moved and why (full detail in the consolidation map):
- *Workload & Capacity* moves out of Engagements/Workflow into **Team, roles & capacity** — it's a staffing concern, not a delivery-workflow concern.
- *Report Alerts* moves out of Firm Administration into **Overview & Reports** — it's alert-on-a-report, not a firm setting.
- *Tax Connector* moves out of Security into **Connect Your Tools** — it's a connection, not an access-control topic.
- *Integrations troubleshooting* moves out of Connect Your Tools into **Help & Troubleshooting**, merged with *Integration Issues* — one troubleshooting home, not two.
- The two role-specific "Getting started as a firm administrator / team member" guides are **retired as feature-index destinations** — they become homepage journeys only, so the same content isn't reachable two structurally different ways under two different labels.

---

## C. Consolidation map

| Current section | Recommended section | Action | Reason |
|---|---|---|---|
| Getting Started (generic guides only) | Start Here | Rename | Plain-language, and no longer mixes generic onboarding with role-specific paths |
| Getting Started → *Get started as a firm administrator* / *…team member* | Homepage journey only | Move | Eliminates the duplicate destination named in Finding A.3 |
| Clients & CRM | Prospects & Clients | Rename | Drops internal "CRM" term (Principle 4) |
| Work & Workflow | Engagements, Workflows & Tasks | Rename + Split | Fixes the "Workflow → Workflow Tasks" repeated label (Principle 3) |
| Work & Workflow → Workload & Capacity | Firm Setup & Administration → Team, roles & capacity | Move | Staffing/capacity is a firm-management topic, not delivery workflow (Principle 5) |
| Documents | Documents & Client Requests | Rename | States the client-facing half of the workflow, not just the noun (Principle 4) |
| Engagement Letters & E-Signature | Engagement Letters | Keep (rename) | Already well-organized; drop redundant "E-Signature" since Signing is already a sub-topic |
| Communications | Client Communications | Rename | Matches proposed index; clarifies these are client-facing, not internal team chat |
| Time & Billing | Time, Services & Billing | Merge | Reunites Service → Time Entry → Invoice → Payment into one workflow home (Principle 5) |
| Services | Time, Services & Billing | Merge | Same reason — was arbitrarily split from Time & Billing |
| Reports & Insights | Overview & Reports | Rename | Plain-language (Principle 4) |
| Firm Administration → Report Alerts | Overview & Reports | Move | An alert on a report belongs with reports, not firm settings |
| AI Features | AI & Automation | Rename | Matches proposed index; folds in the "automation" framing already used for reminders/AI-assisted work |
| Firm Administration (remaining) | Firm Setup & Administration | Rename | Plain-language |
| Subscription & Firm Payments | Firm Setup & Administration → Subscription & payments | Merge | Was a single-guide top-level module — too thin to stand alone |
| Referrals | Firm Setup & Administration → Referrals | Merge | Same reason — single-guide module |
| Integrations | Connect Your Tools | Rename | Verb-first, plain-language (Principle 4) |
| Integrations → Integrations troubleshooting | Help & Troubleshooting → Integration issues | Merge | One troubleshooting home instead of two (Principle 5) |
| Security & Access | Security & Data | Merge | Was a duplicate of Security, Compliance & Data (Finding A.2) |
| Security & Access → Tax Connector | Connect Your Tools | Move | It's a connection, not an access-control setting |
| Security, Compliance & Data | Security & Data | Merge | See above |
| Troubleshooting & Support | Help & Troubleshooting | Rename | Plain-language |
| *(none — does not exist today)* | Product Updates | Add | Every reference site treats release notes as a standard, separate top-level module |
| Homepage journeys (firm-admin / team-member / clients / run-firm / ai / reference) | 7 journeys per Section B | Rename + Split | "Work with clients" splits into "Work with prospects and clients" and "Deliver client work" so pipeline/CRM work and active delivery work aren't the same journey; "AI & automation" and "Reference & support" become their own journeys instead of folded into "Run your firm" |

---

## D. Naming dictionary

| Term | Definition (as used in this knowledge base) |
|---|---|
| **AssureOne** | The complete product suite. Never used as a synonym for AssurePro. |
| **AssurePro** | The practice-management foundation within AssureOne. Supports initial firm setup and connects operational work across other enabled AssureOne products (AssureBooks, AssureAudit, AssureTax). |
| **Firm administrator** | A firm user with configuration-level access — firm profile, team roles, engagement types, subscription, integrations. Always specified by name, never shortened to "admin" in a title if "user" would be ambiguous. |
| **Firm user** | Any person signing in on the firm's side of AssurePro — administrators, partners, managers, reviewers, and team members. Used only when the instruction applies across all of those roles; otherwise the specific role is named. |
| **Client user** | A person signing in through the separate Client Portal. Never referred to as a "user" alone when a firm-user action is also being described in the same passage. |
| **Prospect** | A potential client tracked before conversion. Distinct from a Client — a prospect has not yet been won. |
| **Prospect Pipeline** | The staged view that tracks a Prospect from first contact through Won or Lost. Manages *pre*-conversion activity only. Never used interchangeably with Engagement Workflow. |
| **Client** | A won prospect, or a record added directly, with an active relationship to the firm. Has a Client Workspace and, optionally, Client Portal access. |
| **Engagement** | A unit of client-service work, created for a Client, that moves through a Workflow. Distinct from a Service (the catalog offering it's based on) and a Task (a single unit of work inside it). |
| **Engagement Type** | The configured category an Engagement is created from (e.g. tax return, bookkeeping cleanup) — defines its default Workflow, fields, and templates. |
| **Workflow** | The staged process an Engagement moves through from creation to completion. Distinct from Prospect Pipeline — Workflow manages service *delivery*, not pre-conversion sales activity. |
| **Workflow stage** | One step in a Workflow. An Engagement occupies exactly one stage at a time. |
| **Task** | A single unit of work, optionally required before its Workflow stage can advance. Created from a Task Template or added ad hoc. |
| **Service** | A catalog offering (with its own pricing and SOP) that an Engagement is built around. Distinct from Engagement Type, which governs workflow/fields rather than pricing. |
| **Engagement Letter** | The signable agreement generated for a Client, covering services, pricing, and terms, that can produce Billing once signed. |
| **Document Request** | A firm-initiated ask for a Client to upload a specific document through the Client Portal. Distinct from an Upload, which either party can do without a formal request. |
| **Client Portal** | The separate, client-facing surface where Client users sign in — distinct from the firm-facing AssurePro application itself. |
| **AI Agent** | The conversational AI feature inside AssurePro that firm users can ask to find, summarize, or act on firm/client data, subject to AI Credits and auto-approve settings. |
| **AI Credits** | The consumable unit that AI Agent (and related AI features) draw down; tracked, purchasable, and subject to firm-level caps. |

---

## E. Duplication rules

1. **One guide, one URL, one canonical location.** Every article belongs to exactly one guide in the feature index. A homepage journey may *link* to a guide's articles; it never hosts a second copy of the article or a second URL for it. (This is already how the live site's journey-to-guide linking works — the rule is to keep building on that mechanism, not introduce a second one.)
2. **Role-specific "getting started" content lives in exactly one place: the journey.** It is not also duplicated as a feature-index topic group under a generic "Getting Started" module (this is the Finding A.3 fix). Start Here holds only role-agnostic basics.
3. **A module's own name may not reappear as one of its topic-group names** unless the repetition adds information the parent name didn't have (e.g. "Engagement Letters → Signing" is fine; "Work & Workflow → Workflow" is not).
4. **Before adding a new guide, check whether an existing guide already answers the same reader need** — measured by the task the reader is trying to complete, not by which product screen the feature happens to live on. Two guides in different modules should never both be the obvious answer to the same question.
5. **A module name is retired, not aliased, when it's renamed.** "Clients & CRM," "Work & Workflow," and "Reports & Insights" stop existing anywhere — including in old links, breadcrumbs, or cross-references — once "Prospects & Clients," "Engagements, Workflows & Tasks," and "Overview & Reports" replace them. No two names should ever resolve to the same destination.
6. **"AssurePro," "firm," "client," "workflow," and "manage" are trimmed from a title whenever the surrounding structure already says it.** Inside the AssurePro Help Center, an article doesn't need "in AssurePro" in its own title; inside "Prospects & Clients," a title doesn't need to restate "client" if the guide it's under already says so. They stay only when needed to distinguish a firm-side action from a client-side one, or one product's term from another's.

---

## F. Gaps requiring platform verification

Everything below is a real, empty or thin destination in the live structure. None of it is invented to fill a gap — it's listed here specifically so it *isn't* invented later.

- **Per-connection setup articles**: Email (Gmail/Outlook), Document Storage (Dropbox/OneDrive), QuickBooks, Twilio, and ProdAff each currently have **zero** articles. Writing "Connect QuickBooks to AssurePro," for example, requires walking the actual OAuth/connection flow in the product — not something this phase can verify from existing article content.
- **Troubleshooting scenarios**: Account Issues, Client Portal Issues, Communication Issues, Integration Issues, and Billing Issues are all empty. Real troubleshooting content requires known error states and their fixes, which must come from the product or support team, not be inferred.
- **Client-side onboarding to Client Portal**: existing content describes how a firm invites a client and what a client *can* do, but no article walks a client user through their own first-login/activation experience end to end — worth confirming whether that's genuinely unbuilt in the product or just undocumented.
- **Bulk actions**: the brief asks to identify what can be done in bulk (bulk client import exists — "How do I import multiple clients?" — and bulk engagement-letter sending is mentioned — "Can engagement letters be created and sent in bulk?"). Whether bulk actions exist elsewhere (bulk task assignment, bulk document requests, bulk invoicing) is not confirmed by any existing article and needs a platform check before Start Here or the relevant module promises it.
- **Audit-history depth**: engagement letters have a confirmed audit log ("magic link and audit log for a sent engagement letter"); whether an equivalent audit trail exists for Workflow stage changes, Task completion, or Document access is not confirmed anywhere in current content.
- **Release-notes source**: Product Updates is proposed as a new top-level module, but no changelog content exists today anywhere in the repository or product to seed it from — this needs an actual release-notes feed or process before the module can hold anything.
- **"Overview by Role"** guide (under Overview & Reports) is empty — unclear whether AssurePro's Overview dashboard actually varies by role today, or whether this guide should be retired rather than filled.

---

## Acceptance-criteria check

- Every verified AssurePro product area has a home in Section B. ✅
- Prospect Pipeline and Engagement Workflow are separate modules/guides, never merged. ✅ (Naming dictionary D also locks the distinction in writing.)
- No top-level module overlaps another (Security & Access / Security, Compliance & Data merge resolves the one duplicate found). ✅
- No topic group repeats its parent label without adding meaning (Work & Workflow → Workflow fix). ✅
- No article needs duplicating across journeys — journeys link, they don't own content (Rule E.1). ✅
- Firm-administrator and team-member each get a complete, separate path (two homepage journeys, feature index no longer forks the same content under a third name). ✅
- Client-user actions stay distinguishable from firm-user actions (Naming dictionary D; existing article-body discipline carried into the header phase). ✅
- Structure leaves room for AssureBooks/AssureAudit/AssureTax without reorganizing AssurePro — the feature index is entirely AssurePro-scoped and doesn't reference the other products structurally. ✅
- Unbuilt sibling products stay non-navigating "Coming soon," unchanged from current behavior. ✅

Stopping here per the brief. Nothing above touches article content, and nothing has been deployed — this is a local planning document only. Waiting for approval before generating the article-level table.
