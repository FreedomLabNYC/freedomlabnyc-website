# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Freedom Lab NYC website - a static HTML/CSS/JS site for NYC's Freedom Tech community space. No build process required.

**Live site:** https://freedomlab.nyc

## Development Commands

```bash
# Start local server (Python - recommended)
python3 -m http.server 8000

# Start local server (Node.js alternative)
npm run serve
```

Visit http://localhost:8000 after starting. Changes reflect on page refresh.

## Architecture

**Static Site Structure:**
- Each page uses directory-based routing (`/contact/index.html` → `/contact/`)
- `index.html` - Homepage
- `classes-events/index.html` - Classes & Events page
- `contact/index.html` - Contact page
- `join/index.html` - Membership page
- `resources/index.html` - Resources page
- `404.html` - Custom 404 page

**CSS Organization:**
- `css/styles.css` - Global styles shared across all pages
- `css/home.css` - Homepage-specific styles
- `css/classes.css`, `css/contact.css`, `css/join.css` - Page-specific styles

**Centralized Configuration:**
- `js/social-config.js` - Social media links (X, LinkedIn, Nostr, Email) used site-wide. Update links here to change them across all pages.

**Static Assets:**
- `static/img/` - Images and logos
- `CNAME` - Custom domain configuration for GitHub Pages

## Deployment

Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/pages.yml`. No manual build steps needed.

## Code Style

- Semantic HTML5 elements
- Maintain accessibility (alt text, ARIA labels)
- Test responsive design on mobile and desktop
- Test in Chrome, Firefox, and Safari before PRs
