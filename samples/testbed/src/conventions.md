# Testbed conventions

House style for `samples/testbed`. Scenario authors should read this once before adding a scenario.

## Tenets (binding — see `.ai/tasks/active/local-ai-exploration/brief.md`)

1. **Showcase fgv best practices at the latest revision.** Result pattern everywhere; `Converters` / `Validators` for untyped input; `Logging.LogReporter` for observability; `FileTree` for I/O; `bcp-47` for any locale-touching code; `ts-res` for any context-conditional behavior; `ts-prompt-assist` for any prompt resolution.

2. **Gap-then-fix.** If a scenario discovers a missing or broken fgv capability:
   - **Preferred:** extend/fix fgv first, then continue the scenario. Surface as a separate small PR.
   - **Fallback:** apply a workaround in the scenario, tag with the greppable marker below, and file a tracked work item under `docs/TECH_DEBT.md` (or `docs/FUTURE.md` for larger items).
   - **Never:** build complicated sample-only behavior that a real consumer would also need.

3. **Documentation in code.** Explain the *why* of subtle fgv-primitive choices in comments. Sample code should READ as exemplary — not as a tutorial transcript.

4. **100% test coverage.** Entry points (`src/cli.ts`, `src/web/index.tsx`, anything under `src/generated/`) are `c8 ignore`-d via `config/jest.config.json`'s `coveragePathIgnorePatterns`. Everything else (shell helpers, `App.tsx`, every scenario) gets full coverage.

## Greppable workaround marker

When the gap-then-fix fallback path applies, tag the workaround with:

```ts
// TESTBED-WORKAROUND: <one-line description> — see <work-item-link>
```

Reviewers grep for `TESTBED-WORKAROUND` to keep an eye on accumulated debt.

## Adding a scenario

1. Create `src/scenarios/<id>.tsx` (web + optional CLI) or `<id>.ts` (CLI-only).
2. Implement against the contract in `src/shell/index.ts` (`IScenario` + the `IWeb…` / `ICli…` impls).
3. Import the scenario module in `src/scenarios/index.ts` and append it to the `scenarios` array.
4. Write tests under `src/test/unit/scenarios/<id>.test.tsx` (web component via `@testing-library/react`; CLI via the exported function).
5. If the scenario needs data files, drop them under `data/<scenario-id>/` and re-run `rushx build:data`.

## Coverage-ignore directives

Reach for `/* c8 ignore … */` only at orchestration seams (the bottom of `cli.ts`, the `createRoot` mount in `web/index.tsx`). Any other ignore needs an in-line justification comment and orchestrator sign-off — defensive code is usually a signal that a `Converter` should be doing the work.
