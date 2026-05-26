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
