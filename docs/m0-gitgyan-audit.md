# M0: GitGyan audit and reuse plan

Source: `../gitgyan` (Vite + React 19, plain JSX, Tailwind v4, lucide-react, ~6.5k lines, hash router).

## What was carried over (done in M0)

Copied with `cp`, then edited in place.

| GitGyan file | Now at | Changes |
|---|---|---|
| `src/index.css` | `apps/web/src/styles/global.css` | Added `elevated` (orange) colour tokens; dropped commit-graph CSS |
| `components/ui.jsx` | `components/ui/ui.tsx` | Types; 4-level `SeverityBadge`; shell-aware command tint (program after operators, `sudo` flagged, `#` comments) |
| `lib/useCopy.js` | `lib/useCopy.ts` | Types |
| `lib/theme.js` | `lib/theme.ts` | Severity is now `readonly / modifies / elevated / destructive` (`SEVERITY_LEVELS`); Linux module icons |
| `components/StepWalkthrough.jsx` | `components/walkthrough/StepWalkthrough.tsx` | Step label comes from `step.kind`, not git regexes; fields renamed to the plan's `title` / `note` |
| `components/TerminalReplay.jsx` | `components/replay/TerminalReplay.tsx` | Types only |
| `components/Diagram.jsx` (zones part) | `components/widgets/Zones.tsx` | Commit graph removed; typed `ZonesSpec` |
| `docs/design_references/` | `docs/design_references/` | As-is |

Shared shapes are in `apps/web/src/lib/types.ts`. They become the Zod content schemas in M2.
`/preview` renders all of the above with sample "port in use" data.

## Kept as reference only (`docs/gitgyan-reference/`, not built)

These are untouched copies to rework in later milestones:

- `ScenarioView.jsx`: page layout and sections (callouts, How it works, avoid tips, related). Becomes `/s/[slug].astro` in **M2**.
- `SearchBar.jsx`: Ctrl+K, keyboard nav, grouped results. Swap the in-memory scoring for Fuse.js over a generated index in **M2**.
- `HomeView.jsx`, `CategoryView.jsx`, `Header.jsx`: home hero, module cards, quick-reference chips. **M2**.
- `anatomy.js`: only the tooltip *UI* idea survives. Token data comes from `packages/core` in **M1/M2**.
- `GitBasics.jsx`: keep ZoneCard / EmptyZone / ZoneButton / Concepts tabs / terminal input. The git simulation is written into the component's state, so it gets replaced by a pure `packages/sandbox-engine` in **M6**.
- `scenarios.js`, `diagrams.js`, `categories.js`: their data shape is close to plan §5.1; the content is git-only.

## Not reused
- Hash router: Astro prerenders a real URL per page, which fixes the SEO/link-preview issue.
- SVG commit graph: git-specific.

## Stack decision
Astro + React islands, confirmed. GitGyan's components are self-contained React and dropped into islands with only type changes. A Next.js static export would not reuse more code.

- **Astro 6, not 7:** Astro 7 needs Node >= 22.23; this machine has 22.14. Bump to 7 after upgrading Node (`nvm install 22`).
- **TypeScript 5:** `@astrojs/check` doesn't support TS 7 yet.
- Islands use `client:visible`, so they only become interactive once scrolled into view.
