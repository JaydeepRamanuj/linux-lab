---
name: Obsidian Terminal
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  display-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-lg:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 24px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies an ultra-refined, high-stakes developer workspace tailored for emergency Git recovery and interactive problem resolution. When a developer encounters a broken repository state, their cognitive load is peaked; the interface responds with unshakeable calm, precision, and surgical clarity. 

The aesthetic is a fusion of **Modern Developer Luxury** and **Deep-Space Glassmorphism**:
- **Atmospheric Obsidian:** Deep, ink-like midnight backdrops grounded in `#090D16` that minimize eye strain and eliminate visual clutter.
- **Precision Neon Signals:** Vivid cybernetic accents (electric indigo, neon violet, crisp cyan) providing clear guidance without gaudy brightness.
- **Safety Triad:** Crisp, unmistakable semantics utilizing emerald green for non-destructive actions, rich amber for caution checkpoints, and crimson rose for destructive/irreversible commands.
- **Tactile Terminal Soul:** Monospaced interactive blocks that echo modern shell emulators, accompanied by razor-thin glowing borders, fine hairline dividers, and subdued glass cards.

## Colors

The palette operates exclusively in a tuned dark environment, structuring surfaces from abyssal depths up through elevated interactive tiers:

- **Canvas & Backgrounds:**
  - Base canvas: `#090D16` (Deep Obsidian)
  - Card & Container Level 1: `#0D111D` (Midnight Slate)
  - Interactive Container Level 2 / Hover: `#131B2E` (Deep Blue Slate)
  - Terminal & Code Console Surface: `#070A10` (True Deep Void)
- **Primary & Accent Spectrum:**
  - Primary (Indigo): `#6366F1` (Action drivers, interactive focus, and primary button fills)
  - Secondary (Violet): `#A855F7` (Gradients, emphasis headlines, and secondary module identifiers)
  - Tertiary (Cyan): `#06B6D4` (Terminal highlights, command line args, and telemetry flags)
- **Semantic Badges & Indicators:**
  - **Safe (Non-destructive):** Surface `#064E3B`, Border `#059669`, Text/Icon `#34D399`
  - **Caution (Requires review):** Surface `#451A03`, Border `#D97706`, Text/Icon `#FBBF24`
  - **Destructive (Irreversible/Force):** Surface `#4C0519`, Border `#E11D48`, Text/Icon `#FB7185`
- **Text & Foreground:**
  - Text Primary: `#F1F5F9` (Slate 100)
  - Text Secondary: `#94A3B8` (Slate 400)
  - Text Muted: `#475569` (Slate 600)
  - Hairline Borders: `rgba(255, 255, 255, 0.08)` to `rgba(99, 102, 241, 0.2)` for active borders

## Typography

Typography establishes an instant boundary between prose explanation and mechanical execution:

1. **Editorial & Structure (`Geist`):** Delivers clean neo-grotesque authority on hero statements and scenario titles. Used with tight letter-tracking (`-0.02em` on displays) for a punchy, technical stance.
2. **Body & Explanation (`Inter`):** Neutral, readable, and humane. Generous line heights ensure explanations of complex Git DAG states remain effortless to parse under pressure.
3. **Command & Code (`JetBrains Mono`):** Applied to all syntax blocks, CLI args, flags, step counters, and status badges. Tabular numerals and strict alignment guarantee reproducible command visualization.

## Layout & Spacing

Layout conforms to a focused central column architecture to maintain user focus during high-stress troubleshooting. 

- **Grid Architecture:** 12-column dynamic fluid grid on desktop constrained to a max-width of `1140px` (or `1280px` for wide terminal sandboxes) centered horizontally.
- **Card Grids:** 2-column or 3-column layouts for scenarios and categories, collapsing to a single column on mobile screens under `768px`.
- **Rhythm & Safe Margins:** Outer margin standard is `2rem` (`32px`) on desktop, reducing to `1rem` (`16px`) on mobile devices.
- **Flow & Stacking:** Vertical stacks between major sections (e.g., Situation &rarr; Graph &rarr; Interactive Steps &rarr; Terminal Replay) utilize `2.5rem` (`40px`), giving distinct visual breath to each phase of the resolution process.

## Elevation & Depth

Visual hierarchy does not rely on opaque dropshadows; it leverages subtle light refraction, ambient glows, and dark tonal layering:

1. **Base Layer (`#090D16`):** The endless dark background.
2. **Mid Layer Cards (`#0D111D`):** Encased with a `1px` crisp border: `rgba(255, 255, 255, 0.07)`. When elevated, an inset hairline glow (`inset 0 1px 0 rgba(255, 255, 255, 0.1)`) gives cards a cut-glass top edge.
3. **Interactive & Highlight Depth:** 
   - Hovering cards shifts borders to `rgba(99, 102, 241, 0.4)` accompanied by an ambient indigo diffused back-glow (`0 0 24px -4px rgba(99, 102, 241, 0.15)`).
4. **Terminal Console Inset:** Terminal screens are sunken into the UI (`#070A10`) surrounded by a subdued `1px solid rgba(255, 255, 255, 0.05)` and subtle inner shadow (`inset 0 2px 8px rgba(0, 0, 0, 0.6)`).

## Shapes

The geometric approach balances modern software smoothness with engineered precision:

- Standard cards, troubleshooting modules, and major panels use `rounded-xl` (`12px` to `16px`).
- Interactive buttons, form inputs, code execution bars, and search inputs use `rounded-lg` (`8px` to `10px`).
- Small status tags, step pills, and CLI badge pills use complete pill radiuses (`9999px`) to immediately set them apart from rectangular content blocks.

## Components

### Buttons
- **Primary Button:** Gradient surface `linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)`, crisp white text, `8px` radius, hairline top highlight. On hover, creates an ambient indigo halo (`box-shadow: 0 0 20px rgba(99, 102, 241, 0.4)`).
- **Secondary / Ghost Button:** Slate surface (`rgba(255, 255, 255, 0.05)`), border `1px solid rgba(255, 255, 255, 0.1)`, hover background `rgba(255, 255, 255, 0.08)`.
- **Destructive Action Button:** Rose border `rgba(225, 29, 72, 0.4)`, background `rgba(76, 5, 25, 0.3)`, text `#FB7185`.

### Status Badges
Pill containers displaying critical risk evaluations:
- **`SAFE` Badge:** Background `#064E3B`, text `#34D399`, border `1px solid #059669`. Prepended with an emerald circular dot or checkmark.
- **`CAUTION` Badge:** Background `#451A03`, text `#FBBF24`, border `1px solid #D97706`. Prepended with an amber warning triangle.
- **`DESTRUCTIVE` Badge:** Background `#4C0519`, text `#FB7185`, border `1px solid #E11D48`. Prepended with a rose cross.

### Terminal & Code Blocks
- Deep `#070A10` surface with simulated macOS/Linux traffic light dots (crimson, amber, emerald).
- Command prompt glyph (`$`) in muted violet (`#A855F7`), commands highlighted in `#38BDF8` (Cyan), and flags/parameters rendered in `#E2E8F0`.
- Integrated instant "Copy Command" button pinned to the top-right corner with a haptic/visual confirmation state (`Copied!`).

### Scenario Cards
- Compact modules on `#0D111D` background featuring a category glyph inside a glass jewel badge, Scenario ID badge (`Scenario 09`), clear problem statement, and an actionable one-click terminal teaser.

### Step-by-Step Interactive Resolver
- Step progression track featuring circular index indicators (`1`, `2`, `3`, `Done`) transitioning from muted border states to indigo active glow, with interactive terminal replay controls (`Play`, `Pause`, `Speed Toggle`).