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
- **P2 (substrate).** This file was stale after three commits — now carries a checkpoint per
  deliverable. The reviewer also read the ledger entry's "Completed" filing as premature, and it was
  briefly moved back to Active; **Erik overrode that**: the check-in that carries the code may also
  carry the update saying the code is checked in. Entry is filed under Completed as ✅ and the task
  directory moved to `.ai/tasks/completed/2026-08/`, so ledger, substrate path and design-doc status
  now all agree.
- **P3.** Change-file types corrected to match the sibling `async-result-family` stream (`minor` for
  the additive `ts-utils` API; `patch` for `ts-extras`). Stray blank line in the ledger removed.

The reviewer independently re-derived the `saferFetch.ts` before/after counts from source and they
matched, and independently confirmed the two-view constructor is sound.

**Observed but not fixed (out of scope, recorded as a finding):** `KeyStore Argon2id methods ›
verifySecretFromPasswordArgon2id › returns false when salt does not match` failed once and passed on
two other runs of the same tree, including on the unmodified committed state. Pre-existing flake in a
packlet this stream does not touch.

### 2026-08-06 — Copilot round 2, and a CI signal I could not reproduce

**Round 2 was substantive**, so the loop did not stop at 2. Copilot posted one finding at four
sites: the overrides *narrowed* the inherited callback parameter from `PromiseLike<Result<TN>>` to
`PromiseLike<DetailedResult<TN, TD>>`, a **source-break** for a caller holding a `DetailedResult`
and returning a plain `Result`. Verified with a probe (`TS2322`), fixed by declaring both forms as
overloads on all four methods, and pinned by permanent type-level assertions on both directions.

The instructive part is why my own evidence missed it: the API report showed only *added* lines
(the added line **was** the break), and the green monorepo build was blind because no in-repo caller
chains async off a `DetailedResult`. Two checks, one shared blind spot.

**CI state at the time of writing — unresolved, and not reproducible locally.**

| run | head | conclusion | job duration |
|---|---|---|---|
| 1485 | `69b21ee15` | **success** | ~12 min |
| 1486 | `3e451b627` | cancelled | ~21 min |
| 1487 | `3c155641a` | failure (job `cancelled`) | 15 min 01 s |
| 1488 | `be7ece673` | failure (job `cancelled`) | 15 min 02 s |

Every CI step was reproduced locally against the exact head commit and passes:
`rush change --verify --target-branch origin/release` (both change files found), `rush rebuild`
(3 min 45 s), `rush test`. The only local failure is `@fgv/ts-json-base`'s `mutableFsTree`
permission test, which **cannot** pass in a root container and does pass in CI — see the finding
alongside this file.

The jobs conclude **`cancelled`**, not `failure`; they carry `runner_name: ""` and their logs 404.
A test failure would conclude `failure` and retain logs. Two runs cut at 15 m 01 s / 15 m 02 s is a
cap, not a flake. `rerun_workflow_run` returns `403 Resource not accessible by integration`, so the
run could not be retried directly; pushing this commit re-triggers it.

Read as **infrastructure rather than the diff** — same toolchain, same commands, green 12 minutes in
on `69b21ee15`. If the re-trigger fails the same way, the next step is a human with Actions access
checking runner quota/minutes, since nothing further is observable from here.
