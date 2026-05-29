#!/usr/bin/env python3
"""Generate indexable Freedom Lab event landing pages from Luma event JSON.

UX pattern: Freedom Lab owns the durable, crawlable context page; Luma remains the RSVP/ticketing source of truth.
"""
from __future__ import annotations
import json, re
from datetime import datetime, timezone
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://freedomlab.nyc"
EVENTS_JSON = ROOT / "classes-events" / "events.json"
EVENTS_DIR = ROOT / "events"
DEFAULT_IMAGE = f"{SITE}/static/img/FL%20Signature%20Rectangular2.png"

def slugify(name: str, date: str) -> str:
    d = date[:10] if date else "event"
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:64].strip("-")
    return f"{d}-{s}"

def dt_label(value: str) -> str:
    if not value: return "Time TBA"
    dt = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone()
    return dt.strftime("%B %-d, %Y · %-I:%M %p")

def topic_tags(name: str) -> list[str]:
    n=name.lower(); tags=[]
    if any(x in n for x in ["bitcoin", "node", "lightning", "wallet"]): tags.append("Bitcoin")
    if any(x in n for x in ["ai", "agent", "openclaw", "skill"]): tags.append("Open-source AI")
    if any(x in n for x in ["nostr", "privacy", "tor", "encrypted"]): tags.append("Privacy")
    if not tags: tags.append("Freedom tech")
    return tags

def page(ev: dict) -> tuple[str, str]:
    slug=slugify(ev.get('name','Freedom Lab event'), ev.get('date',''))
    url=f"{SITE}/events/{slug}/"
    title=f"{ev.get('name','Freedom Lab event')} | Freedom Lab NYC"
    desc=f"Freedom Lab NYC event: {ev.get('name','hands-on freedom tech gathering')} at {ev.get('venue') or 'a New York City venue'}. RSVP and tickets remain on Luma."
    cover=ev.get('cover') or DEFAULT_IMAGE
    preview=DEFAULT_IMAGE
    tags=topic_tags(ev.get('name',''))
    schema={
      "@context":"https://schema.org","@type":"Event","@id":url+"#event","name":ev.get('name'),
      "description":desc,"url":url,"sameAs":ev.get('url'),"image":cover,
      "startDate":ev.get('date'),"endDate":ev.get('end'),"eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode","eventStatus":"https://schema.org/EventScheduled",
      "organizer":{"@type":"Organization","name":"Freedom Lab NYC","url":SITE+"/"},
      "location":{"@type":"Place","name":ev.get('venue') or "Freedom Lab NYC event venue","address":ev.get('location') or "New York, NY"},
      "offers":{"@type":"Offer","url":ev.get('url'),"price":ev.get('price') or "0","availability":"https://schema.org/InStock"}
    }
    breadcrumb={
      "@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
        {"@type":"ListItem","position":2,"name":"Classes & Events","item":SITE+"/classes-events/"},
        {"@type":"ListItem","position":3,"name":ev.get('name','Freedom Lab event'),"item":url},
      ]
    }
    tag_html=''.join(f'<span class="tutorial-tag">{escape(t)}</span>' for t in tags)
    html=f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{escape(desc)}">
  <title>{escape(title)}</title>
  <link rel="canonical" href="{escape(url)}">
  <link rel="icon" href="../../static/img/torch transparent icocrop2.png" type="image/png">
  <link rel="stylesheet" href="../../css/styles.css">
  <link rel="stylesheet" href="../../css/fonts.css">
  <link rel="stylesheet" href="../../css/tutorial-page.css">
  <meta property="og:type" content="event">
  <meta property="og:url" content="{escape(url)}">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(desc)}">
  <meta property="og:image" content="{escape(preview)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{escape(title)}">
  <meta name="twitter:description" content="{escape(desc)}">
  <meta name="twitter:image" content="{escape(preview)}">
  <script type="application/ld+json">{json.dumps(schema, ensure_ascii=False, indent=2)}</script>
  <script type="application/ld+json">{json.dumps(breadcrumb, ensure_ascii=False, indent=2)}</script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5L8YH7QGBD"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-5L8YH7QGBD',{{anonymize_ip:true}});</script>
</head>
<body>
<header class="header"><a href="/" class="logo"><img src="../../static/img/FLNYC 2LINE+LOGO.png" alt="Freedom Lab NYC" class="logo-wide"></a><nav class="nav-menu"><a href="/classes-events/" class="nav-link active">Classes & Events</a><a href="/resources/" class="nav-link">Resources</a><a href="/contact/" class="nav-link">Contact</a><a href="/join/" class="nav-btn">Join</a></nav></header>
<main class="tutorial-content">
  <div class="tutorial-header">
    <div class="tutorial-breadcrumb"><a href="/classes-events/">Classes & Events</a><span>›</span><span>{escape(ev.get('name','Event'))}</span></div>
    <h1 class="tutorial-title">{escape(ev.get('name','Freedom Lab event'))}</h1>
    <div class="tutorial-meta"><span class="tutorial-type-tag class">Event</span>{tag_html}</div>
    <p class="tutorial-intro"><strong>When:</strong> {escape(dt_label(ev.get('date','')))}</p>
    <p><strong>Where:</strong> {escape(ev.get('venue') or 'New York City')} · {escape(ev.get('location') or 'Venue details on Luma')}</p>
    <p><strong>RSVP:</strong> Registration, capacity, and attendee updates are handled on Luma.</p>
    <p><a class="btn btn-primary" href="{escape(ev.get('url') or 'https://luma.com/freedomlab')}" target="_blank" rel="noopener">RSVP on Luma</a></p>
    <img loading="lazy" src="{escape(cover)}" alt="Event cover for {escape(ev.get('name','Freedom Lab event'))}" style="width:100%;border-radius:16px;">
  </div>
  <section class="tutorial-section"><h2>About this Freedom Lab event</h2><p>This is a durable Freedom Lab NYC event page for search, sharing, and archive context. Luma remains the live RSVP and ticketing system, while this page helps people discover the event through Freedom Lab’s own site.</p></section>
</main><script src="../../js/footer.js"></script></body></html>'''
    return slug, html

def main():
    data=json.loads(EVENTS_JSON.read_text())['events']
    EVENTS_DIR.mkdir(exist_ok=True)
    changed=[]
    for ev in data:
        slug, html = page(ev)
        d=EVENTS_DIR/slug; d.mkdir(exist_ok=True)
        p=d/'index.html'
        if not p.exists() or p.read_text()!=html:
            p.write_text(html); changed.append(f"events/{slug}/index.html")
    print(f"Event pages generated: {len(changed)} changed / {len(data)} total")
    for c in changed: print(' -', c)
if __name__=='__main__': main()
