# deterministic-timing-tests: three load-sensitive tests made deterministic

**Shipped:** 2026-10-19 into `integration/asks`. PR #TBD. The orchestrator fills in the number.
Packages: `@fgv/ts-extras` and `@fgv/ts-extras-mcp`. The change is test-only, with no source or API change.

## Summary

Three tests turned the repo-wide `test` gate red whenever several gates shared the machine. The
user chose to make them deterministic: no raised limits, no skips, and no quarantine. Each now
asserts the property it was guarding, and none asserts elapsed wall-clock time:

- **`md5Normalizer.browser` "large objects".** The 300 ms assertion was replaced. The test now
  checks that the large input hashes, that the hash is deterministic, and that it depends on the
  last element. That last check is what proves the whole input is consumed.
- **`saferFetchRetry` "an exhausted deadline".** The cause was jitter, not load. A
  `Math.random() < ~0.006` produced a backoff that fit the 30 ms budget, so the call retried.
  The test now runs on a fake clock with the jitter pinned to a backoff exactly 1 ms over the
  budget.
- **`oauth` "times out while saveCodeVerifier is pending".** The real 300 ms connect deadline
  could fire before the flow reached the paused step, and then `provider.reached` never resolved.
  The deadline is now a fake timer that fires only once the flow is parked. The post-release
  300 ms sleep is replaced by one `setImmediate` turn.

Every rewritten test was run against a deliberately broken implementation and went red; the
implementation was restored afterwards. The original `saferFetchRetry` and `oauth` failures were
reproduced on demand: the first by pinning `Math.random`, the second with a 400 ms spin in the
auth server.

The sweep converted the same pattern at 15 more sites in the two packages, either to a fake
clock or to a discriminating outcome. Findings elsewhere were reported, not fixed:
`terminate.test.ts`, `ts-res`, and `ts-sudoku-lib`.

## Files changed

- `libraries/ts-extras/src/test/unit/`: `md5Normalizer.browser.test.ts`,
  `safer-fetch/saferFetchRetry.test.ts` and `safer-fetch/deadline.test.ts`.
- `libraries/ts-extras-mcp/src/test/unit/`: `oauth.test.ts`, `egress.test.ts`,
  `cancellation.test.ts`, `httpFailures.test.ts` and `clientToolTurn.test.ts`.
- Change files, both `none`, for `@fgv/ts-extras` and `@fgv/ts-extras-mcp`.

## Followups

Both are tracked in `docs/TECH_DEBT.md` (P3, "Wall-clock assertions remain in tests…").

- Rewrite `ts-extras-mcp/src/test/unit/terminate.test.ts` deterministically. It asserts the 2 s
  termination bound and `PROMPT_MS` (1 s) bounds over real loopback HTTP. The `useFakeTimeouts`
  technique in `oauth.test.ts` is the template.
- Wall-clock performance assertions outside these two packages:
  - `ts-res` `deltaGenerator` (`< 2000` / `< 5000` ms);
  - `ts-sudoku-lib` `killerCombinations` (`< 100` / `< 200` ms, the tightest);
  - `ts-sudoku-lib` `hints/integration`, `anyPuzzle` and `sudokuXPuzzle`.

## Artifacts

`brief.md` (frozen contract), `result.md` (per-test root cause, fix, break-proof, sweep, load run), and
`state.md` (gate record).
