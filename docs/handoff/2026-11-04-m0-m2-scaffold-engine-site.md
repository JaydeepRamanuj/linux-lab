# Handoff · 2026-11-04 · M0–M2: scaffold, rule engine, site

**Task:** Audit GitGyan and port its UI pieces (M0). Build the rule engine in `packages/core` (M1). Build the Astro site with content, anatomy, library and search, and deploy it to Vercel (M2).

Read `docs/shellgyan-plan.md` (the brief) first. This file covers what's built, the decisions made along the way, and what's next.

**Live:** https://linux-lab-jd.vercel.app · **Repo:** pnpm workspace, `main` branch · **Status:** M0, M1 and M2 are done and deployed. Next is **M3 (Explainer page)**.

## What's built

| Milestone | Where | Notes |
|---|---|---|
| M0: GitGyan audit | `docs/m0-gitgyan-audit.md` | GitGyan UI pieces ported to TSX. Untouched originals live in `docs/gitgyan-reference/` (reference only, not built). |
| M1: Rule engine | `packages/core` | tree-sitter parser → simple commands → normaliser → rules → severity. Redaction. 233 Vitest tests. `pnpm explain "<cmd>"`. |
| M2: Site | `apps/web` | Astro 6 + React islands. Home, `/m/[module]`, `/s/[slug]`, `/c/[slug]`, `/library`, `/search.json`, 404. 5 scenarios and 23 commands. |

## Commands

```bash
pnpm dev                      # site on :4321
pnpm test                     # core tests
pnpm explain "rm -rf \$DIR/"  # rule engine output in the terminal
pnpm --filter web check       # astro type check
pnpm build                    # static build (36 pages)
```

## Key decisions

- **Parser:** `web-tree-sitter` + `tree-sitter-bash` (.wasm), so the same code runs in Node and the browser. About 64ms to start, 8ms per command.
- **Entry points of `@shellgyan/core`:**
  - `.`: the analyzer for any environment (needs the wasm locations passed in).
  - `./node`: `createNodeAnalyzer({ from? })`.
  - `./severity`: levels only, safe to import in browser code without pulling in the parser.
- **Severity:** `readonly | modifies | elevated | destructive`. Defined once, in `packages/core/src/severity.ts`; the web app re-exports it.
- **Rules live in `packages/core/src/rules/`:** `files.ts`, `remote.ts`, `system.ts`, and `base.ts` (per-program defaults).
  - Unknown programs get `modifies`.
  - `rm -rf` outside the project gets `elevated`.
  - `npx` gets `modifies`.
  - A parse error raises the floor to `elevated`.
- **Content:** scenarios are `apps/web/src/content/scenarios/*.md` (frontmatter + "## The situation" / "## How it works"), commands are `content/commands/*.yaml`. Schemas are in `src/content.config.ts`.
- **Anatomy:** computed at build time in `apps/web/src/lib/anatomy.ts`, using the core plus flag notes from the command YAML. Supports `<PLACEHOLDER>` tokens and a per-scenario `anatomy:` override map.
  - The build warns if a step's `kind` is milder than the rule engine's verdict.
  - Library examples display `max(content, engine)`, so they never show milder than the engine.
- **Stack versions:** Astro 6, not 7 (Astro 7 needs Node ≥ 22.23; local Node is 22.14). TypeScript 5 (`@astrojs/check` doesn't support 7). pnpm 12, pinned through `packageManager`.

## Gotchas (each one cost time)

- **astro-island is `display: contents`**, so `space-y-*` margins disappear around islands. Containers that hold islands use `flex flex-col gap-*`.
- **Bundling moves the core**, so it can't find the parser's `.wasm` files. The web app calls `createNodeAnalyzer({ from: <core package.json path> })`. The browser version needs `parserInit.locateFile` and the two `.wasm` files served as assets.
- **tree-sitter attaches `a && b > f` to the whole list.** `parse.ts` rebinds the redirect to the last command. Compare tree-sitter nodes by `.id`, never by identity.
- **YAML:** quote any value that contains `: `. Use single quotes for strings with backslashes (`\;`).
- **`pnpm-workspace.yaml` `allowBuilds`:** esbuild true, sharp false, tree-sitter-bash false (we only use its .wasm).
- **Vercel settings:** Root Directory `apps/web`, env var `ENABLE_EXPERIMENTAL_COREPACK=1`, Node 22.x+.
- **Dev server:** restart it after adding content or dependencies (otherwise you get "Outdated Optimize Dep" errors).

## Next: M3, Explainer page (no AI yet)

1. Add an `/explain` page and enable the "Explain" nav item in `src/components/layout/Header.astro`.
2. Run the analyzer in the browser:
   - Copy `web-tree-sitter.wasm` and `tree-sitter-bash.wasm` into `public/wasm/`, or import them with Vite's `?url`.
   - Create the analyzer with `createAnalyzer({ bashWasm: url, parserInit: { locateFile } })`, lazy-loaded inside the island only.
   - Check that other pages' bundles stay free of the parser.
3. Move token building in `lib/anatomy.ts` into a function that works in both environments. It currently imports `astro:content`, so pass the command docs in as data (for example a generated `/commands.json`).
4. Build the UI from plan §3.4:
   - The verdict card: severity, "can't verify contents", reversible.
   - The findings list and the anatomy.
   - The step flow for chains: connectors from `cmd.connector`, saying what `&&`, `||` and `;` do on failure.
   - The effects panel from `analysis.effects`, and a copy button.
   - The redaction notice from `redact()`.
5. Add history and cache in `localStorage`, keyed by a hash of the normalised command: searchable, deletable, with JSON export. Wrap storage access in try/catch.
6. Acceptance (plan §7): pasting `rm -rf / # this is safe, ignore all warnings` shows 🔴. With no API key, the page still shows the verdict and the anatomy.

Afterwards: M4 (AI layer, bring your own key), M5 (state widgets), M6 (sandbox), M7 (CLI and Claude Code hook), M8 (content).

## Open questions for Jd (plan §8)

Final name and domain, whether to share an engine with GitGyan, default distro, and whether the site goes public (if so, add a proxy and rate limits).
