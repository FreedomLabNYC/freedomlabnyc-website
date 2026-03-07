# Freedom Lab NYC — Performance Plan

## Current State (March 7, 2026)

### What we already fixed tonight
- ✅ Homepage/shared images converted to WebP (3.2MB → 700KB)
- ✅ `<picture>` tags with PNG fallbacks on all 37 pages
- ✅ Removed 3 unused Google Fonts (VT323, Silkscreen, Playfair Display)
- ✅ Switched `display=block` → `display=swap` (text visible immediately)
- ✅ Lazy-loaded Luma embed iframe

### What still needs fixing (prioritized)

---

## Priority 1: Tutorial Images (BIGGEST win)

**The problem:** 75 images across tutorial pages, totaling ~64MB. Zero have `loading="lazy"`. The Jade Wallet tutorial alone loads 21MB of PNGs upfront — on bad WiFi that's minutes of waiting.

**Worst offenders:**
- `bitaxe-supra-motherboard.png` — **25MB** (single image!)
- `vibecode.png` — 3.6MB
- `cyberian-mine-logo.png` — 2.3MB
- 15+ Jade Wallet screenshots at 600KB-1.9MB each

**Fix (two parts):**

### A. Add `loading="lazy"` to ALL tutorial images
- Zero-effort, huge impact. Browser only loads images as you scroll to them.
- Keeps first page load to just HTML + CSS + above-fold content.
- Skip lazy on the first 1-2 images per page (hero/intro images should load immediately).

### B. Convert tutorial PNGs to WebP
- Same technique as homepage — `cwebp` conversion + `<picture>` fallbacks.
- Expected savings: 60-80% reduction. 64MB → ~15MB total.
- The 25MB bitaxe image alone will probably drop to 2-3MB.
- Can do this with a batch script in one pass.

**Impact:** Pages that currently take 30+ seconds on bad WiFi → 2-3 seconds for initial render.

---

## Priority 2: Self-Host Fonts

**The problem:** Every page load makes 2-3 requests to `fonts.googleapis.com` then `fonts.gstatic.com` to download font files. On bad WiFi, this adds 1-3 seconds of render-blocking time even with `display=swap` — the DNS lookup + TLS handshake to Google's servers is the bottleneck.

**Fix:**
1. Download the WOFF2 files for Press Start 2P and Space Grotesk (latin subset only — ~60KB total)
2. Host them at `static/fonts/`
3. Replace Google Fonts `<link>` tags with local `@font-face` declarations in `styles.css`
4. Remove all `fonts.googleapis.com` and `fonts.gstatic.com` references
5. Add `font-display: swap` to each `@font-face`

**Impact:** Eliminates 2-3 external DNS lookups + connections per page load. Fonts served from same CDN as the site.

---

## Priority 3: Cloudflare CDN (Free Tier)

**The problem:** GitHub Pages has a fixed 10-minute cache TTL and no custom cache headers. Every visit re-downloads everything. On bad WiFi, repeat visits are just as slow as first visits.

**Fix:**
1. Move DNS from Namecheap (`registrar-servers.com`) to Cloudflare (free tier)
2. Keep GitHub Pages as origin — Cloudflare sits in front as CDN/cache
3. Cloudflare free tier gives you:
   - **Global edge caching** — assets served from nearest PoP (NYC has several)
   - **Custom cache rules** — set images/fonts to cache for 1 year, HTML for 1 hour
   - **Auto-minification** — CSS/JS/HTML minified on the fly
   - **Brotli compression** — better than gzip, ~15-20% smaller
   - **HTTP/2 + HTTP/3** — multiplexed connections, faster on bad WiFi
   - **Always Online** — serves cached version if GitHub Pages is down

**Impact:** Repeat visitors load in <500ms. First-time visitors benefit from edge caching (content closer to them).

**Effort:** ~15 minutes to set up. Change two nameservers at Namecheap, configure cache rules in Cloudflare dashboard.

---

## Priority 4: Service Worker (Offline Cache)

**The problem:** Once someone visits the site, if their connection drops or degrades, they get nothing. For a Freedom Tech site, offline resilience is on-brand.

**Fix:**
1. Add a simple service worker (`sw.js`) that caches:
   - All CSS and JS files (precache on first visit)
   - The homepage and main page shells
   - Visited pages and their images (cache-on-navigate)
2. Stale-while-revalidate strategy: serve cached version instantly, update in background
3. Offline fallback page for unvisited pages

**Impact:** Return visits load instantly regardless of connection. Pages you've visited before work offline. Very on-brand for Freedom Tech.

**Effort:** ~50 lines of JS. No build tools needed.

---

## Priority 5: Footer WebP + Minor Fixes

**The problem:** `footer.js` still loads `nostr_logo.png` and `tor_logo.png` (small — 18-22KB each, but easy fix). Also, some mobile-specific issues from the audit.

**Fix:**
- Update `footer.js` to use WebP with PNG fallback
- Add 480px breakpoint to classes-events page
- Reduce Luma iframe height on mobile (550px → 400px)
- Verify Press Start 2P heading doesn't overflow on 320px screens

---

## Future Considerations

### AVIF format
- Even smaller than WebP (30-50% smaller) but Safari only added support in 2023
- Could add as a third `<source>` in `<picture>` tags: AVIF → WebP → PNG
- Wait until browser support is >95%

### Image CDN
- Services like Cloudflare Images or imgix can serve optimally-sized images per device
- Overkill for this site size, but worth considering if tutorial count grows significantly

### Critical CSS inlining
- Extract above-the-fold CSS and inline it in `<head>`, load the rest async
- Eliminates the render-blocking CSS request
- More complex to maintain — only do this if Lighthouse still complains after the above fixes

---

## Implementation Order

1. **Tutorial images: lazy loading** (30 min, massive impact)
2. **Tutorial images: WebP conversion** (1 hour with batch script)
3. **Self-host fonts** (30 min)
4. **Cloudflare CDN** (15 min setup, Harrison needs to change nameservers)
5. **Service worker** (1 hour)
6. **Footer + mobile fixes** (20 min)

Total estimated time: ~3.5 hours for everything.
Expected result: Site loads in 1-2 seconds on good WiFi, 3-5 seconds on bad WiFi (down from 10-30+ seconds currently).
