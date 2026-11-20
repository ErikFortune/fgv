# B-5 kickoff: testbed shell + CLI scenario integration

**Phase:** B-5 of `local-ai-exploration` (added after B-4a; surfaced by the #410 promotion review)
**Integration branch:** `local-ai-exploration` (off `release`)
**Work branch:** `claude/local-ai-exploration-b5-shell`
**PR target:** `local-ai-exploration` (NOT `release`; re-promotion happens after this merges)

## Why this phase exists

B-1 scaffolded the testbed shell (`samples/testbed/src/web/App.tsx`) and CLI (`src/cli.ts`) as placeholders. B-3 and B-4a added two scenarios (`local-classifier-safety`, `local-embedding-search`) and tested their components **in isolation**, but **never wired the shell/CLI to actually run them**. The #410 promotion review caught this: the shell lists scenario titles but never mounts `web.component`/calls `web.initialize` and the sidebar isn't clickable; the CLI prints a registry count and ignores `--scenario`. So the shipped sample can't run its own scenarios. B-5 closes that gap before re-promotion.

## Scope — both web + CLI

### Web shell (`src/web/App.tsx`)
- **Clickable sidebar.** Each scenario is a button/link that calls `setActiveScenarioId(s.id)`; reflect the active selection visually (e.g. `aria-current`/selected class). Keyboard-accessible.
- **Mount the scenario.** When `activeScenario` has a `web` impl, render `<activeScenario.web.component context={ctx} />`. Build a real `IScenarioContext` (see `src/shell/` for the contract — logger etc.; wire the logger to the `@fgv/ts-app-shell` messages surface so scenario logs land in the StatusBar). Stop rendering only the title/description placeholder.
- **`initialize` lifecycle.** If `web.initialize` exists, call it on scenario activation; show a loading state while pending; on `Result` failure show an error state (surface the message); on success mount the component. (Note: the existing scenario components ALSO self-load their pipeline on mount — coordinate so we don't double-load; prefer driving the shared module-level pipeline cache via `initialize`, matching how the scenarios already cache.)
- **CLI-only / web-only scenarios.** Handle a scenario with no `web` impl gracefully (message, not a crash).
- Keep the `@fgv/ts-app-shell` primitive usage (don't reimplement sidebar/statusbar).

### CLI (`src/cli.ts`)
- **`--scenario <id>` dispatch.** Parse the flag; look up the scenario; if it has a `cli` impl, build an `IScenarioContext` and `await scenario.cli.run(ctx)`, printing the returned summary string (or failing with the structured error). Handle: unknown id (list available + non-zero exit), scenario with no `cli` impl, and no `--scenario` given (list available scenarios).
- **Update `--help`** — drop the "(B-1 scaffold)" / "(B-3+)" language; document the real `--scenario` usage.

### Fold in the #410 review fixes that live only on the (closed) cluster-close branch
These were lost when #410 was closed — re-apply on this branch (the buffer never received them):
- `samples/testbed/README.md` — status no longer "B-1 scaffold / no scenarios"; reflect the shipped scenarios.
- `samples/testbed/package.json` `description` — repoint the brief path to `completed/2026-05/...` is premature (cluster still active); keep an `active/` reference or drop the path. Drop any "scaffold" language.
- Delete the dead manual mock `samples/testbed/__mocks__/@fgv/ts-extras-transformers.js` (confirmed dead — Jest auto-mocks; 111 tests pass without it). Remove the now-empty `__mocks__` tree.
- `src/test/unit/web/App.test.tsx:4` — fix/justify the mock rationale comment (the web path imports the **browser** facade; the Node facade is only lazy-imported in CLI `run()`). Update or drop the comment so it reflects reality; keep whatever mocking is actually needed for the now-component-mounting shell tests.
- `src/conventions.md` — the coverage-ignore note is inaccurate: `config/jest.config.json` `coveragePathIgnorePatterns` only ignores `lib/web/index.js` + `lib/generated/`; the CLI entry is covered with an inline `c8 ignore` on its orchestration tail. Fix the wording to match the real mechanism.

(The library-side #410 fixes — both facade READMEs' "provisional" status and the `ts-web-extras-transformers` `build`-script + facade `package.json` descriptions — are handled by the orchestrator on this same branch, outside `samples/testbed`. Do NOT touch `libraries/**`.)

## Constraints
- **`build:web` is a hard gate.** The web shell now mounts scenario components — run the production `webpack` build and confirm it compiles AND that `@fgv/ts-extras-transformers` (Node facade) stays out of the browser bundle. The scenarios already follow the dual-target pattern; don't regress it (the shell must import only browser-safe code).
- 100% coverage all four metrics; the shell lifecycle branches (loading/error/no-web-impl/unknown-id) all need tests. Use `@testing-library/react` for the shell (jsdom is available). Narrow honest `c8 ignore` only.
- No `any`; fallible ops return `Result<T>`; chain Results (`onSuccess`/`thenOnSuccess`/`onFailure`); use `@fgv/ts-utils-jest` matchers.
- Don't pull the Node facade into the web graph; don't reimplement ts-app-shell primitives.

## Manual test pass (maintainer — required gate)
Automated gates are necessary but not sufficient for UI/CLI behavior. Produce a concise **manual test plan** (exact commands to start the web dev server + the CLI invocations for each scenario, plus a click-through checklist: select each scenario in the sidebar, run it, observe results, try an unknown `--scenario` id). The maintainer (Erik) runs this pass before the phase is accepted. The agent does NOT mark the phase done on automated gates alone.

## Acceptance gates
- [ ] `rush build` green
- [ ] `rushx lint` clean (testbed)
- [ ] `rushx test` 100% all four metrics (testbed)
- [ ] **production `build:web` compiles; Node facade excluded from the browser bundle**
- [ ] Web: sidebar switches scenarios; both scenarios mount + run; loading/error states work
- [ ] CLI: `--scenario <id>` runs each scenario's `cli.run`; unknown id handled; `--help` updated
- [ ] #410 review fixes folded in (mock deleted, App.test.tsx + conventions.md corrected, testbed README/description de-scaffolded)
- [ ] Manual test plan written; **maintainer manual pass complete**
- [ ] `phase-b5-result.md` written; `state.md` updated

## After B-5 merges (orchestrator)
Re-run cluster-close: artifact finalization (active → completed), WORKSTREAMS → Completed, sibling-sweep over the updated delta, fresh promotion PR `local-ai-exploration` → `release` (merge-commit).
