# Freedom Lab writing guide

This is the starting point for Freedom Lab NYC copy. It is deliberately broad. The current site has a limited amount of original editorial writing, so these are working patterns, not permanent rules.

## Source and scope

The first version of this guide was built from every sitemap page outside `/resources/`:

- 10 editorial pages
- 26 generated event pages
- 36 pages total

The generated source corpus lives at `docs/freedom-lab-writing-corpus.generated.md`.

Not every page carries equal weight. The homepage, Classes & Events, Contact, Donate, Join, and What is Freedom Tech are the clearest voice samples. Agent-facing pages and generated event pages are useful for terminology and operational copy, but repeated template language should not define the whole voice. Consulting is more promotional than the core community pages and should be treated as a secondary sample.

## The voice

Freedom Lab copy is plainspoken, practical, and hopeful.

It usually does one of three things:

- explains what Freedom Lab is;
- tells people what they can learn, use, or do;
- gives the next action.

The writing tends to use `we` for the community and `you` when speaking directly to the reader. It talks about freedom as something people learn, build, practice, and use. Abstract ideas are usually tied to concrete tools, events, or actions.

Prefer specific nouns and verbs:

- learn, teach, build, use, host, join, apply, donate;
- Bitcoin, Nostr, Linux, encryption, self-hosting, open-source AI;
- classes, workshops, events, community, co-working, hackerspace.

## Headers

Use simple headers by default.

Strong patterns already on the site include:

- `Contact`
- `Donate`
- `Consulting`
- `Classes & Events`
- `The Mission`
- `What is Freedom Tech?`
- `How it works`
- `What you get`
- `Why Donate?`
- `Where we are`

A header should name the section or ask the question the section answers. It should not try to summarize the entire argument or create a cinematic mood.

Prefer:

- `Featured guests`
- `Community`
- `Classes & Events`
- `Sponsorship tiers`
- `How we started`
- `Where we are`
- `Where we’re going`

Avoid by default:

- poetic or campaign-like headers;
- long descriptive headers;
- dramatic fragments;
- a small kicker that repeats or decorates the real header.

### No eyebrow text by default

Do not add eyebrow, kicker, overline, or pre-title text in websites, apps, decks, posters, or other designed materials unless Harrison asks for it. Start with the actual header.

## Body copy

Lead with the point. Most Freedom Lab paragraphs are short and direct.

Good default structure:

1. Say what the thing is.
2. Say why it is useful or different.
3. Give the next action when one is needed.

Keep paragraphs to one idea. One to three sentences is usually enough for public pages. Longer explanations are appropriate when the page must establish boundaries, instructions, or source-of-truth rules.

Concrete examples are better than category language. `Run a Bitcoin node` is stronger than `explore decentralized infrastructure`. `Your data stays on your machine` is stronger than `privacy-first architecture`.

Short fragments can work when they are functional, such as pricing details or operational labels. Do not use fragments only to make prose sound punchy.

## Calls to action

Calls to action are direct verbs with little decoration:

- `Apply for Early Access`
- `Explore Classes & Events`
- `RSVP on Luma`
- `Donate with BTCPay`
- `Subscribe`
- `Contact`

Use one clear primary action per section. Supporting copy should explain the action or remove uncertainty, not repeat the button label.

## Event copy

Event titles say what the event is and what someone will do or learn.

Useful title structures include:

- `Beginner’s Workshop: [task]`
- `Hands-On Class: [task]`
- `Office Hours: [topic]`
- `[topic] Show and Tell`
- `[topic] Night`

Operational event copy should stay literal:

- when;
- where;
- RSVP or ticketing source;
- any real prerequisite or material to bring.

Luma is the source of truth for registration, capacity, and changes. Do not inflate an event page with generic promotional copy when the title and logistics already explain it.

## Tone and claims

Freedom Lab is ambitious, but the copy should distinguish the present from the goal.

Say:

- Freedom Lab hosts events at various venues.
- Freedom Lab is building toward a co-working / hackerspace.
- Freedom Lab teaches and experiments with practical freedom technology.

Do not claim a permanent public venue, fixed membership terms, sponsor relationship, event capacity, or official commitment unless the current public source supports it.

The strongest conviction in the existing writing comes from plain statements, not superlatives. Avoid default phrases such as `world-class`, `groundbreaking`, `cutting-edge ecosystem`, `unparalleled`, or `the future of everything`.

## Style details

- Use sentence case for headers.
- Use `Freedom Lab NYC` for the organization and `Freedom Lab` when context is clear.
- Use `Freedom Tech` when naming the field or branded concept; use `freedom-tech` as a compound modifier when needed.
- Preserve technical names and acronyms when they matter: Bitcoin, Nostr, P2P, Linux, Luma.
- Prefer active voice.
- Use contractions when they sound natural.
- Use lists for real sets of actions, benefits, rules, or requirements.
- Do not add helper text that restates an obvious header or control.
- Do not add emoji, eyebrow text, or slogan-like microcopy by default.
- Fix typos and grammar without sanding away plain language.

## Examples

### Header

Before:

> Practitioners with real-world stakes

After:

> Featured guests

### Abstract claim

Before:

> A curriculum you can see

After:

> Classes & Events

### Technical marketing

Before:

> A sovereign, privacy-first intelligence layer built for the next generation of business.

After:

> An open-source AI assistant that runs on hardware you control.

### Repeated helper copy

Before:

> Community momentum
>
> An open door with a real core

After:

> Community

## Drafting checklist

Before publishing, check:

- Is the header the simplest accurate name for the section?
- Did we add an eyebrow or kicker without being asked?
- Does the first sentence say what the thing is or does?
- Can an abstract phrase be replaced with a tool, action, place, or outcome?
- Is any claim ahead of the current public reality?
- Does the CTA use a direct verb?
- Is helper text doing a job that the header, field, or button does not already do?
- Would this still sound natural read aloud by someone at a Freedom Lab event?

## Updating this guide

Use this workflow when Harrison adds meaningful new copy or corrects the voice:

1. Add or update the public page in the website repo.
2. Run:

   ```bash
   python3 scripts/audit-writing-style.py
   ```

3. Review the changed section in `docs/freedom-lab-writing-corpus.generated.md`.
4. Decide whether the change is:
   - page-specific;
   - a repeated pattern;
   - an explicit preference or correction from Harrison.
5. Update this guide only for repeated patterns or explicit preferences. Do not turn one line from one page into a universal rule.
6. Add or revise an example when it makes the rule easier to apply.
7. Run:

   ```bash
   python3 scripts/audit-writing-style.py --check
   ```

8. Review the guide and the rendered page together before publishing.

When new evidence conflicts with this guide, Harrison’s latest explicit direction wins. Update the guide rather than keeping both rules.

## Change log

### 2026-08-22

- Created the guide from 36 non-resource sitemap pages.
- Established simple headers as the default.
- Established that eyebrow and kicker text are opt-in only.
- Added a repeatable corpus-generation and update workflow.
