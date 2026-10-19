# Brief: `deterministic-timing-tests` — make three load-sensitive tests deterministic

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** user decision, 2026-10-19 (option (c)). **Base / PR target:** `integration/asks`.

## Problem

Three tests fail whenever several gates share the machine. Each time, the whole repo-wide `test` gate goes red outside the change under test:

| package | test | failure seen | cause |
|---|---|---|---|
| `ts-extras` | `md5Normalizer.browser.test.ts` "should handle large objects efficiently" | 328–411 ms vs a `< 300` ms assertion | wall-clock performance assertion |
| `ts-extras` | `saferFetchRetry.test.ts` "an exhausted deadline …" | expected 1 call, got 2 | real-timer deadline arithmetic |
| `ts-extras-mcp` | `oauth.test.ts` "a connect that times out while saveCodeVerifier is pending …" | 5 s Jest timeout | real wait inside the test |

## Decision: deterministic, not relaxed

- **Never** raise a limit or a timeout as the fix. **Never** skip or quarantine a test.
- **md5Normalizer.** A unit test must not assert wall-clock speed. Replace the assertion with something that tests the property it was guarding, e.g. that the work is linear in input size or that a large input completes at all, without a time bound. If nothing meaningful remains, explain why in `state.md`. Do not delete the test silently.
- **saferFetchRetry.** Drive the deadline with Jest fake timers, or with an injected clock if the code under test already accepts one. Read the code: if safer-fetch reads `Date.now()` / `performance.now()` directly and offers no seam, adding an injectable clock to its retry options is acceptable only if it is additive and `@internal`/test-facing. Prefer fake timers if they suffice.
- **oauth.** Find the real wait. Replace it with a controlled promise or fake timers, so the "times out while pending" path is reached deterministically.
- **Each fix must keep its test's intent.** Make every rewritten test fail against a deliberately broken implementation, then restore. Record that you did this.
- **Sweep.** Grep `libraries/*/src/test` for other wall-clock assertions (`Date.now()` diffs compared to a constant, `performance.now()`, `toBeLessThan(` on elapsed time) and for real `setTimeout` waits above ~500 ms. List what you find in `result.md`, and fix the same pattern only in `ts-extras` and `ts-extras-mcp`. Report the rest as a follow-up; do not fix it here.

## Acceptance

- [ ] The three tests are deterministic. Run each package's suite **while a repo-wide rebuild runs in parallel** and show it passes. Record the run.
- [ ] No production behaviour change, unless an additive clock seam is needed. If so, give it a change file `minor` and TSDoc.
- [ ] Change files: `none` for test-only packages, as `change --verify` requires.
- [ ] Gates:
  - package build, lint, test (100%);
  - repo-wide rebuild and test;
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8.
- [ ] Close-out: `.ai/tasks/completed/2026-10/deterministic-timing-tests/` with `meta.yaml`, `README.md`, ledger entry (`#TBD`), and the feed.

## Mechanics

Own worktree. Push only to `deterministic-timing-tests`; no PR. Commit before gates; run gates in the foreground with per-worktree logs. No sub-agents.
