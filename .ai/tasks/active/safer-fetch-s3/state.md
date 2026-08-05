# State — `safer-fetch-s3`

Branch: `safer-fetch-s3` (from `release` @ `b392e1534`)

## Checkpoints

### 2026-08-05 — deliverables 1–7 landed in `daeac2db`

All seven deliverables implemented and committed; `code-reviewer` run on the final diff before
the coverage-closure pass (the brief's required ordering).

- **D1 retry** — `packlets/safer-fetch/retry.ts` + `_execute`'s retry loop. Every §11 rule
  implemented, each with a test. `DeadlineWatch` gained `remainingMs` / `delay` / `attemptEnded`;
  the headers deadline is now attempt-scoped and the overall deadline / caller abort terminal,
  without which a `timeout` could never be retried — found by a test, not by review.
- **D2 loop detection** — moved to `_detectLoop`, after the new `_clearAddress` step. `KNOWN
  LIMIT` comment removed. Regression test drives a normalizing (trailing-dot-stripping) guard.
- **D3 Result-chaining pass** — `_raced` boundary helper. Note: `thenOnSuccess` returns
  `AsyncResult<T>` and drops the `FetchFailureReason` detail, so async steps stay explicit
  awaits; that is a constraint of the current ts-utils surface, not a style choice.
- **D4 browser packlet** — `@fgv/ts-web-extras` `safer-fetch`. `addressGuard` stays required.
- **D5 guarantee tables** — both READMEs (ts-web-extras had none; created).
- **D6 `LIBRARY_CAPABILITIES.md`** — packlet rows for both packages plus two decision shortcuts.
  Deliberately **not** in the Result-integration-boundary list.
- **D7 testbed** — `safer-fetch-guard` scenario against a scripted local `node:http` server.

**Open questions, as resolved.** OQ-1 declined the recommendation (kept `redirect: 'manual'`;
`'error'` would degrade the failure reason to an undifferentiated `'network'` — design Appendix
D-a). OQ-2, OQ-3 and OQ-4 taken as recommended, with §12's `{443}` port *default* deliberately
not adopted (D-c).

**Remaining:** code-reviewer findings, the coverage-closure pass to 100%, the Copilot loop, the
PR, and `result.md`.

Append a dated checkpoint after each deliverable in the brief, naming what landed, what is in
progress, and anything the brief got wrong.
