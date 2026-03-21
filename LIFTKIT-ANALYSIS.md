# LiftKit Design System — Deep Analysis

_What's worth stealing for Freedom Lab, and what to skip._

## The Core Idea

LiftKit's entire system is built on **one number: φ (phi) = 1.618** — the golden ratio. Everything — font sizes, spacing, padding, line heights — scales by multiplying or dividing by 1.618 (or its square root, quarter-root, etc.).

This isn't decorative. It means every element on the page is mathematically related to every other element, which is why things "look right" without manual tweaking.

## The Scale System (the best part)

```
Scale factor: 1.618 (golden ratio)
Whole step:   × 1.618
Half step:    × 1.272 (√1.618)
Quarter step: × 1.128 (⁴√1.618)
Eighth step:  × 1.062 (⁸√1.618)
```

### Size Scale (from base = 1em = 16px)

| Token | Formula | Computed | Use |
|-------|---------|----------|-----|
| 3xs | base ÷ φ⁴ | ~2.3px | — |
| 2xs | base ÷ φ³ | ~3.8px | Micro gaps |
| xs | base ÷ φ² | ~6.1px | Small spacing |
| sm | base ÷ φ | ~9.9px | Compact padding |
| **md** | **base** | **16px** | **Body text, default spacing** |
| lg | base × φ | ~25.9px | Section padding |
| xl | base × φ² | ~41.9px | Large gaps |
| 2xl | base × φ³ | ~67.8px | Hero spacing |
| 3xl | base × φ⁴ | ~109.6px | Major sections |
| 4xl | base × φ⁵ | ~177.3px | Full-page landmarks |

**Why this matters:** Instead of picking arbitrary values (padding: 12px here, 20px there, 32px there), every spacing value is a φ-step from every other one. The eye perceives the harmony even if you can't articulate why.

## Typography Scale

Font sizes also scale by φ, with intermediate steps for finer control:

| Token | Formula | ~Size | Use |
|-------|---------|-------|-----|
| caption | base ÷ √φ | ~12.6px | Fine print |
| label | base ÷ ⁴√φ ÷ ⁸√φ | ~13.3px | Labels |
| callout | base ÷ ⁸√φ | ~15.1px | Callouts |
| **body** | **base** | **16px** | **Body text** |
| heading | base × ⁴√φ | ~18px | Section headings |
| subheading | base ÷ ⁴√φ | ~14.2px | Subheadings |
| title3 | base × √φ | ~20.3px | Small titles |
| title2 | base × φ | ~25.9px | Section titles |
| title1 | base × φ × √φ | ~32.9px | Page titles |
| display2 | base × φ² | ~41.9px | Hero display |
| display1 | base × φ³ | ~67.8px | Giant display |

### Line Heights
- Display/title text: **1.272** (half step) — tight, elegant
- Body text: **1.618** (whole step) — generous, readable
- Display1 only: **1.128** (quarter step) — ultra-tight for giant text

### Letter Spacing
- Display/title: **-0.022em** (tightened for large text)
- Body/smaller: **0** (default)

## Optical Corrections (the clever part)

LiftKit calculates **optical padding offsets** per typography tier:

```css
--body-offset: calc(body-font-size / φ);
--title2-offset: calc(title2-font-size × (title2-line-height / φ));
```

This solves the classic problem: a card with `padding: 24px` on all sides *looks* like it has more padding on top than bottom, because the line-height creates visual whitespace above the first line of text. LiftKit computes per-font-size corrections to make padding look optically even.

## Color System (Material Design 3 influenced)

Uses the Material Design 3 color token structure:
- **Surface hierarchy:** surface → surfaceContainer → surfaceContainerHigh → surfaceContainerHighest
- **Semantic pairs:** primary/onPrimary, secondary/onSecondary, error/onError, etc.
- **Dark mode:** Full set of dark variants that auto-swap via `prefers-color-scheme`

The color values themselves are fine but generic (corporate blue). The *structure* — having named semantic tokens with on-color pairs — is the valuable part.

## Shadow System

Clean, multi-layered shadows that increase in drama:

```css
shadow-sm: 0 0 1px 0 (just definition)
shadow-md: 4px blur + 2px blur + 1px outline (subtle lift)
shadow-lg: 11px blur + 2px blur + outline (card elevation)
shadow-xl: 20px blur + 5px blur + outline (modal/dropdown)
shadow-2xl: 25px blur + 9px blur + outline (hero float)
```

Each shadow uses **3 layers** — a large soft shadow for depth, a smaller tight shadow for crispness, and a 1px outline for definition. This is better than most systems' single-layer shadows.

## Components (skip these)

The actual React components (Card, Button, etc.) are over-engineered for what they do and tied to Next.js. The README admits they need a rewrite. Not worth importing.

## Glass Material

They have a `MaterialLayer` component that does glassmorphism via backdrop-filter. The concept is fine but the implementation is too coupled to their component tree.

---

## What to Apply to Freedom Lab

### ✅ Adopt: The Golden Ratio Scale System

This is the real gem. Add these CSS custom properties to the Freedom Lab site:

```css
:root {
  --fl-scale: 1.618;
  --fl-half: 1.272;
  --fl-quarter: 1.128;

  /* Spacing */
  --space-xs: calc(1rem / var(--fl-scale) / var(--fl-scale));  /* ~6px */
  --space-sm: calc(1rem / var(--fl-scale));                     /* ~10px */
  --space-md: 1rem;                                              /* 16px */
  --space-lg: calc(1rem * var(--fl-scale));                     /* ~26px */
  --space-xl: calc(1rem * var(--fl-scale) * var(--fl-scale));   /* ~42px */
  --space-2xl: calc(1rem * var(--fl-scale) * var(--fl-scale) * var(--fl-scale)); /* ~68px */

  /* Font sizes */
  --text-sm: calc(1rem / var(--fl-scale));          /* ~10px */
  --text-base: 1rem;                                 /* 16px */
  --text-lg: calc(1rem * var(--fl-half));            /* ~20px */
  --text-xl: calc(1rem * var(--fl-scale));           /* ~26px */
  --text-2xl: calc(1rem * var(--fl-scale) * var(--fl-half)); /* ~33px */
  --text-3xl: calc(1rem * var(--fl-scale) * var(--fl-scale)); /* ~42px */
  --text-4xl: calc(1rem * var(--fl-scale) * var(--fl-scale) * var(--fl-scale)); /* ~68px */
}
```

### ✅ Adopt: Line Height Rules
- Headings/display: `line-height: 1.272`
- Body text: `line-height: 1.618`
- Giant display: `line-height: 1.128`

### ✅ Adopt: Letter Spacing
- Tighten display/title text: `letter-spacing: -0.022em`
- Leave body text at default

### ✅ Adopt: Multi-Layer Shadow Pattern
Use 3-layer shadows instead of single-layer:
```css
--shadow-card: 0 4px 6px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.11), 0 0 1px rgba(0,0,0,0.4);
```

### ✅ Adopt: Optical Padding Corrections
When putting text in containers, add extra top padding proportional to the font's line-height to compensate for visual imbalance.

### ✅ Consider: Semantic Color Token Structure
The primary/onPrimary, surface/onSurface naming pattern is worth using — but with Freedom Lab's own colors (navy, green, etc.), not LiftKit's corporate blue.

### ❌ Skip: The Components
Too coupled to Next.js, admittedly not production-ready.

### ❌ Skip: The Utility Classes
LiftKit's utility classes (`.p-md`, `.shadow-lg`) duplicate what Tailwind already does. Use the *values* in our own CSS, not their class system.

### ❌ Skip: The Color Values
Their specific hex values are generic Material Design blue. We have our own palette.

---

## Summary

**LiftKit's real contribution is a design *philosophy*, not a component library.** The golden ratio scale system for spacing and typography is genuinely elegant and worth adopting as CSS custom properties. The optical correction concept is smart. The shadow layering is better than most. Everything else — the components, the utility classes, the specific colors — is either not ready or not relevant to our stack.

The cost to adopt the good parts is about 20 lines of CSS custom properties. No dependencies, no library import, no build tool changes.
