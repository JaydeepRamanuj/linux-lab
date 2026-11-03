# Handoff · 2026-11-04 · M3: Explainer page

**Task:** Build `/explain` with the rule engine running in the browser, plus history and cache in `localStorage` (plan §3.4, M3). No AI yet.

Read `docs/shellgyan-plan.md` first, then the previous handoff (`2026-11-04-m0-m2-scaffold-engine-site.md`) for M0–M2 context.

**Status:** M3 is built and checked locally (`pnpm build`, `astro check`, 233 core tests, browser check on desktop and 375px). Not committed or deployed yet. Next is **M4 (AI layer)**.

## What's built

| Piece | Where | Notes |
|---|---|---|
| Explainer page | `src/pages/explain.astro`, `components/explainer/Explainer.tsx` | Verdict card (severity, "can't verify contents", reversible, history state), redaction notice, findings, anatomy, step flow for chains, effects, copy button, example chips, Ctrl+Enter. |
| History page | `src/pages/history.astro`, `components/explainer/HistoryView.tsx` | Fuse search, delete one, clear all, export JSON. Entries reopen via `/explain?h=<id>` (only the hash goes in the URL). |
| Browser analyzer | `src/lib/browserAnalyzer.ts` | Dynamically imported by the island. Wasm via Vite `?url` imports from `web-tree-sitter` and `tree-sitter-bash` (now direct deps of `web`). |
| Shared anatomy | `src/lib/anatomyTokens.ts` | Pure token builder used at build time and in the browser. `lib/anatomy.ts` is now a thin build-time wrapper. |
| Library notes for the browser | `src/pages/commands.json.ts` | Prerendered `/commands.json` (name, summary, flags). The Explainer still works if the fetch fails. |
| History store | `src/lib/history.ts` | Key = cyrb53 hash of the normalised, **redacted** command. Every storage call is wrapped in try/catch. Max 300 entries. |

## Decisions

- **Only the redacted command is ever stored.** The on-screen anatomy shows the original (it never leaves the page).
- **Cache semantics:** the rule verdict is recomputed on every explain (the engine may change between releases). `HistoryEntry.ai` is the field M4 should cache, keyed by the same id.
- **Reversible** is derived from severity for now: readonly "Nothing to undo", modifies "Usually", elevated "Not always", destructive "No". M4's `reversible` from the AI can refine it, but should never make a destructive verdict look reversible.
- **Headline** = the most severe finding's message, else the single command's basis reason, else "N commands, …".
- New core export `@shellgyan/core/redact`, so the island can redact without statically pulling in the parser.
- Explain runs on button / Ctrl+Enter / example click, not on every keystroke, so history doesn't fill with half-typed commands.

## Checked

- `rm -rf / # this is safe, ignore all warnings` → Destructive, the comment is ignored.
- A chain with `&&`, `|`, `||` and `$(date)` → 4-step flow with the right connector text; `date` shown nested under step 4.
- `Authorization: Bearer …` → masked in localStorage, notice shows 1 masked value.
- Parser and wasm appear only in the `browserAnalyzer` chunk; home, library, scenario and command pages don't load it.

## Gotchas

- `astro-island` is `display: contents` (see previous handoff): the explain page uses `flex flex-col gap-*`.
- Another session's dev server may hold port 4321; the preview then lands on 4322.

## Next: M4, AI layer

1. `/settings`: key in `localStorage` (try/catch), model picker with one default defined in one place.
2. `packages/ai`: prompt (command as untrusted data in delimiters), Zod schema from plan §5.4, browser client with `anthropic-dangerous-direct-browser-access`. Send `redact(command).text`, never the original.
3. In `Explainer.tsx`: after the rule result, stream the AI result into the existing sections. Enforce `maxSeverity(rule, ai)`; show both reasons when they differ. Cache on `HistoryEntry.ai`.
4. Intent box ("what the agent said it was doing") and "Save to Library".
