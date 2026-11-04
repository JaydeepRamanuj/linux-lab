# Handoff · 2026-11-04 · Scenarios Phase 0: content guardrails

**Task:** Phase 0 of `docs/scenarios-plan.md`: make broken scenario and command content fail the build before 30 new scenarios go in.

Read `docs/scenarios-plan.md` first, then `2026-11-04-m3-explainer.md` for the state of the app.

**Status:** Phase 0 is done. `pnpm test` (244 core tests), `pnpm check` (0 errors, 0 warnings) and `pnpm build` pass, with zero `[content]` warnings. Next is **Phase 1 (Everyday Rescue, scenarios #6–11)**.

## What's built

| Piece | Where | Notes |
|---|---|---|
| Content checker | `apps/web/src/lib/contentChecks.ts` | Runs once per build from `getStaticPaths` in `pages/s/[slug].astro` and `pages/c/[slug].astro`. Errors fail the build. Warnings print as `[content] …`. The file header lists every check. |
| `echo` command page | `src/content/commands/echo.yaml` | Moved forward from Phase 1. The plan doc is updated. |
| `npm` command page | `src/content/commands/npm.yaml` | Used by `command-chaining`. |
| Link fixes | `mkdir.yaml`, `rm.yaml` | Removed `cd` (it deliberately has no page) and `trash` (no page) from `related`. |
| Back-links | `mkdir.yaml`, `ps.yaml`, `grep.yaml` | Now list `command-chaining` under `scenarios:`. |
| Rule fix: read-only npm/pnpm/yarn/bun subcommands | `packages/core/src/rules/system.ts` (`nodePackages`), tests in `test/rules.test.ts` | `npm ls`, `outdated`, `view`, `why`, `audit` (without `fix`), `config get`, `--version` and similar now come back as readonly. Before, every `npm …` was "modifies". `install`, `run`, `ci`, `audit fix` and `config set` stay "modifies". |

## Proof that the checker fails the build

Three temporary breaks, then reverted:

```
Content check failed with 3 error(s):
  - scenario command-chaining: step "&& runs the next command only on success" is marked readonly, rule engine says modifies for `mkdir -p build && cd build`
  - scenario port-in-use: number 2 is already used by apt-lock
  - scenario port-in-use: related scenario "no-such-scenario" doesn't exist (or is a draft)
```

`pnpm build` exited 1. After reverting, it exits 0 with no `[content]` lines.

## Decisions

- **The checker runs inside the build, not as a separate test.** It needs `astro:content`, so it runs from `getStaticPaths`. A memoised promise makes it run once even though two routes call it.
- **No page needed:** `cd`, `true`, `false`, and anything run by path (`./deploy.sh`). Extend `NO_PAGE_NEEDED` in `contentChecks.ts` for other shell builtins too basic for a page.
- **Drafts:** linking to a draft counts as broken, because drafts have no page. Drafts still take part in the duplicate-number check.

## Gotchas

- Astro's own logs also start with `[content]` ("Syncing content", "Synced content"). To count checker warnings, grep for `[content] scenario` or `[content] command`.
- `echo '…' >> ~/.bashrc` comes back **elevated** from the engine (it writes shell config). Phase 1's `add-to-path` and `persistent-alias` are planned as "modifies". That step must be marked elevated, which makes the scenario elevated, unless you decide the rule is too strict. Decide this before writing those two scenarios.
- Running `pnpm explain` for the first time in a fresh container triggers a `pnpm install`. It doesn't change `pnpm-lock.yaml`.

## Pages to check on the Vercel preview

- `/c/echo/`, `/c/npm/` (new)
- `/c/mkdir/`, `/c/rm/`, `/c/ps/`, `/c/grep/` (changed related/scenario links)
- `/s/command-chaining/` (related commands now include echo and npm)

## Next: Phase 1

Scenarios #6–11 (`add-to-path`, `command-not-found`, `open-from-terminal`, `symlink-shortcut`, `persistent-alias`, `extract-archive`), with new pages for `export`, `type`, `command`, `xdg-open`, `ln`, `alias`, `tar` and `unzip`, plus updates to `which`, `source` and `echo`.
