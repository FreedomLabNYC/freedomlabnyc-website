# Freedom Lab SEO / Analytics Change Log

Running reference for Wren. Keep entries concise; include what changed, why, and verification.

## 2026-05-25 — GA4/GSC + sitewide analytics
- Verified GA4/GSC connector: GSC `https://freedomlab.nyc/`, GA4 property `538027221`.
- Verified primary conversion/key event: `join_waitlist_submit` (`properties/538027221/conversionEvents/14945303707`).
- Added/verified conversion fires only after successful `/join/` waitlist submit.
- Added sitewide analytics for Luma, donate, contact, join, and outbound clicks via `js/analytics-events.js` / footer loading.
- Added UTMs to Luma/social outbound links.

## 2026-05-25 — Low-lift search snippet metadata
- Updated metadata only for `/classes-events/`: title/meta/social descriptions target Bitcoin, privacy, self-hosting, open-source AI, freedom tech events in NYC.
- Updated metadata only for `/contact/`: title/meta/social descriptions target visit/contact/collaborate/NYC freedom tech space intent.
- Updated metadata only for `/resources/`: title/meta/social descriptions target Bitcoin, privacy, self-hosting guides.
- No visible page body copy or design changed in this metadata pass.

## 2026-05-25 — Technical SEO cleanup
- Shortened overlong meta descriptions on homepage and resource pages so snippets are less likely to truncate.
- Added missing canonical tags to `/onion/`, `/thankyou/`, and `/poll/`.
- Re-ran generated SEO metadata/sitemap after fixes.

## 2026-05-26 — Event pages, resource schema, media accessibility protocol
- Added durable /events/<date-title>/ pages generated from Luma events JSON; Luma remains RSVP/ticketing CTA/source of truth.
- Added media accessibility audit for alt text, lazy loading, and video labels/captions.
- Extended SEO generator to enrich resource TechArticle schema with audience/time/prerequisites/outcomes when present.
- Generated 26 event pages and updated sitemap to include 72 URLs.
## 2026-05-29 — SEO stewardship pilot baseline

- Ran initial autonomy-gradient SEO/website-health baseline for Freedom Lab.
- GSC monitor: 72 sitemap URLs inspected from cached/current Search Console data; sitemap submitted, not pending, last downloaded 2026-05-28; no actionable canonical/robots/duplicate/blocking errors found. Most unindexed URLs are waiting on Google (Discovered/Unknown/Crawled currently not indexed).
- Technical audits: `scripts/audit-media-accessibility.py` passed; JSON-LD parse check passed across HTML pages.
- Green fix: aligned generated event-page OG/Twitter preview images with the site-wide rectangular Freedom Lab signature preview required by `scripts/audit-shared-styles.py`, while preserving per-event cover images in visible page content and Event JSON-LD.
- Verification: patched 26 event pages narrowly for preview metadata; `python3 scripts/audit-shared-styles.py` passed; `python3 scripts/audit-media-accessibility.py` passed; JSON-LD parse failures: 0.
- Note: `python3 scripts/apply-seo.py` currently mutates some resource JSON-LD incorrectly; reverted those generated changes and left script repair as a follow-up before using it in automated stewardship.
## 2026-05-29 — Agent-readable public index

- Expanded root `llms.txt` from a simple resource list into a public agent-readable index for Freedom Lab.
- Added canonical facts, public/private boundary notes, agent interaction policy, public data feeds, task-organized learning paths, and downloadable `.skill` links where available.
- Purpose: help AI assistants route users to accurate public Freedom Lab events/resources without inventing venue, membership, RSVP, or internal details.
- Verification: root `llms.txt` fetchable locally; publish/live verification recorded with the related commit.
## 2026-05-29 — Public agent response guide

- Added `/agent-guide/` as a public canonical response/routing guide for AI assistants.
- Linked it from `llms.txt` and added it to `sitemap.xml`.
- The guide defines one-sentence/one-paragraph descriptions, routing for common user intents, claims agents should not make, citation preferences, and machine-readable public links.
- Verification: shared style/media audits, JSON-LD parse check, deploy, and live no-cache fetch.
## 2026-05-30 — Freedom tech in NYC AI-search landing page

- Added `/freedom-tech-nyc/` as a dedicated public answer page for users/agents asking where to go in NYC for freedom tech.
- Linked it from the homepage, `agent-guide`, `llms.txt`, and `sitemap.xml`.
- Goal: make Freedom Lab NYC easier for AI/search systems to include for queries about Bitcoin, Nostr, privacy, open-source AI, self-hosting, mesh/decentralized infrastructure, and hacker/community spaces in NYC.
