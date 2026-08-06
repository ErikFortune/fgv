# State — `ts-utils-async-detailed-result`

Branch: `ts-utils-async-detailed-result` (from `release` @ `b85b094b7`)

## Checkpoints

### 2026-08-06 — deliverables 1 + 2 (`af421438c`)

`AsyncDetailedResult<T, TD>` landed in `ts-utils`, plus `thenOnSuccess`/`thenOnFailure` overrides on
`DetailedSuccess`/`DetailedFailure` and two continuation types. 46 tests; `result.ts` at 100%.

- **OQ-1 resolved: (a), and it was forced rather than preferred.** `AsyncDetailedResult` must
  *extend* `AsyncResult` — an override's return type has to be assignable to the base's, the same
  reason `DetailedSuccess extends Success` lets `onSuccess` return `DetailedResult`. Compiled on the
  first attempt. The brief's contravariance escalation trigger fired only on the **static** `from`,
  so that member is named `fromDetailed`; the instance surface was clean and option (c) was not needed.
- **OQ-2 resolved:** ladder built to exactly the 8 methods `AsyncResult` already has. No new
  combinators, and deliberately no `captureAsyncDetailedResult`.
- The type-level assertion was **verified to fail against the un-fixed code** by temporarily disabling
  only the four overrides: `TS2741 Property '_detailed' is missing in type 'AsyncResult<number>'` and
  `TS2339 Property 'detail' does not exist on type 'Failure<number>'`. Restored and re-verified green.
- **Brief correction:** cross-package `DetailedResult` usage is 51 non-test files / 7 packages with
  `ts-utils` at 16 — not the brief's 49 / 14.

### 2026-08-06 — deliverable 3 (`bb4813c39`)

3 sites converted in `saferFetch.ts` (`_receive` ×2, `_connect` ×1). No test changes at this point;
all safer-fetch suites passed unmodified at 100%.

- **Brief correction:** the file has **21** `isFailure()`/`isSuccess()` checks, not 22 — 22 *lines*
  match but one is a comment carrying two occurrences.
- **OQ-3 resolved: did not force the rest.** 7 of 21 checks are on an awaited `DetailedResult`; 3
  convert. The other 4 are `_walk`'s hop loop (3, the standing `CODING_STANDARDS` exemption) and
  `_runAttempt`'s retry branch, which reads `walked.detail` to decide whether to recurse. The
  remaining 14 never carried a detail. **Most of the file legitimately stays imperative.**
- `_propagate` — which exists only because a detail could not survive a chain — dropped 11 → 8 sites.

### 2026-08-06 — deliverable 4 (`9987a21a6`, `5756714ab`)

Design doc § 8, `LIBRARY_CAPABILITIES.md` row, ledger entry, change files, findings inbox, `result.md`.
Full monorepo build (32 projects) green; no other package's `.api.md` moved.

### 2026-08-06 — `code-reviewer` pass and its fallout

No P1s. Two P2s and two P3s, all resolved:

- **P2 (real, fixed).** Moving `_receive` inside a `thenOnSuccess` callback changed a failure's
  *shape*: an internal throw used to reach `_execute`'s top-level capture and be reported as
  `{kind:'unknown'}` with a `saferFetch: unexpected error:` prefix; `AsyncDetailedResult` now catches
  it earlier and yields `detail: undefined`. **Verified empirically against both revisions** with a
  booby-trapped `Response` — a public entry point could return a failure with *no*
  `FetchFailureReason`, so a caller switching on `detail.kind` would fault. Fixed with `_withReason`
  at `_execute`, the single boundary where an `Outcome` becomes the caller's result. Output is now
  byte-identical to pre-change. Regression test added across all three entry points.
- **P2 (substrate).** This file was stale, and the ledger entry had been filed under "Completed"
  although the stream is not merged — conventions reserve ✅ for *merged to `release`*. Entry moved
  back to Active as 🔵; this file brought current.
- **P3.** Change-file types corrected to match the sibling `async-result-family` stream (`minor` for
  the additive `ts-utils` API; `patch` for `ts-extras`). Stray blank line in the ledger removed.

The reviewer independently re-derived the `saferFetch.ts` before/after counts from source and they
matched, and independently confirmed the two-view constructor is sound.

**Observed but not fixed (out of scope, recorded as a finding):** `KeyStore Argon2id methods ›
verifySecretFromPasswordArgon2id › returns false when salt does not match` failed once and passed on
two other runs of the same tree, including on the unmodified committed state. Pre-existing flake in a
packlet this stream does not touch.
