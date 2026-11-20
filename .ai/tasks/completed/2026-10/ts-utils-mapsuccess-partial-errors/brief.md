# Brief: `ts-utils-mapsuccess-partial-errors` — a partial fold reports its failures

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#691 (fgv-ask), 2026-10-20. Long form on the requester's side:
`.ai/notes/fgv-share/ASK-2026-10-20-mapsuccess-partial-errors.md` (personaility `working`).
**Base / PR target:** `integration/asks`.

## Problem

`mapSuccess(results, aggregatedErrors?)` (`libraries/ts-utils/src/packlets/base/mapResults.ts`)
documents `aggregatedErrors` as "any returned error messages will be appended". It calls
`addMessages(errors)` **only when every result failed**. A partial fold — the case a lenient fold
exists for — drops its failures silently. `mapSuccessAsync` (`mapResultsAsync.ts`) delegates to
`mapSuccess`, so it inherits the bug, and its own TSDoc ("discarding failures unless everything
failed") describes the bug rather than the parameter.

## Decision: fix the behaviour to match the documented contract

Not a doc change. A lenient fold must be able to surface what it dropped, and the parameter
already promises to.

- `mapSuccess` appends **every** failure message to `aggregatedErrors`, whether or not any result
  succeeded. The return value is unchanged: `Success` with the successes if any succeeded,
  `Failure` with the joined messages if all failed, `Success([])` for an empty input.
- `mapSuccessAsync` (both overloads) gets the same behaviour via `options.aggregatedErrors`. Fix its
  TSDoc so it no longer says failures are discarded when an aggregator is supplied.
- **Sibling sweep, in this package only:** check every other fold in `mapResults.ts` and
  `mapResultsAsync.ts` (`mapResults`, `mapDetailedResults`, `mapFailures`, `allSucceed`,
  `populateObject`, the async siblings, `firstSuccess*`) for the same docs-vs-behaviour gap on
  `aggregatedErrors`. Fix a real mismatch the same way; record each one checked in `result.md`,
  including the ones that are already correct.
- Also correct `libraries/ts-utils/src/packlets/base/README.md` line ~41 and `CAPABILITIES.md` if
  either describes the old behaviour.
- **Do not** change `libraries/ts-agent-memory` (its `mapSuccess(results).orDefault([])` call at
  `fileTreeMemoryStore.ts` passes no aggregator, so it is unaffected). Note it in `result.md` as an
  observation only.

`ts-utils` is an **established** surface. This changes what a caller's aggregator receives, so:
- Change file `minor`, with the comment stating the behaviour change plainly (not `BREAKING:` — it
  brings behaviour in line with the documented contract; say so). The orchestrator will re-check this
  call at review.
- Sweep the repo for callers passing an aggregator to `mapSuccess` / `mapSuccessAsync`
  (`libraries/ tools/ samples/`, including tests) and list them in `result.md`.

## Acceptance

- [ ] Tests (Result matchers): a partial fold with an aggregator receives exactly the failure
  messages, in input order, and still succeeds with the successes; an all-failed fold is unchanged;
  an all-succeeded fold adds nothing; empty input adds nothing. Same set for `mapSuccessAsync`
  (both overloads, and with `concurrency` > 1 so the order guarantee is exercised).
- [ ] Each new test shown red against the current code, then green. Record it.
- [ ] Gates: `ts-utils` build, lint, test (coverage at the package threshold, 0 warnings); repo-wide
  `rush rebuild` and `rush test` (this widens what a function reports, so the repo-wide test is the
  gate); `rush change --verify --target-branch origin/integration/asks`; prettier 2.8.
- [ ] Close-out per `finalize-task`: `.ai/tasks/completed/2026-10/ts-utils-mapsuccess-partial-errors/`
  with `meta.yaml`, `README.md`, `result.md`; ledger entry (`#TBD`); feed regenerated.

## Mechanics

Own worktree. Push only to `ts-utils-mapsuccess-partial-errors`; no PR. Commit before gates; run
gates in the foreground with per-worktree log paths. No sub-agents.
