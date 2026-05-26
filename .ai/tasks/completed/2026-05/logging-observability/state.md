# Stream state: `logging-observability`

**Status:** ✅ implementation complete — PR #418 review satisfied; ready to squash → `release`
**Integration branch:** `logging-observability` (off `release`)
**Last updated:** 2026-05-26 (implementing agent — implementation + review round)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | ✅ complete | Single-PR additive feature. `_logStructured` hook + `RetainingLogger` + `MultiLogger`. Gates green; new files 100% coverage. See `result.md`. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Accept the request into `@fgv/ts-utils` | General logging infra (record retention + fan-out), not consumer-specific; logging is core durable surface; build-once-in-fgv avoids downstream migration debt. Extend-the-primitive discipline. |
| `_logStructured` additive hook (Erik, 2026-05-25) | The `_log(formatted, level)` seam only sees the formatted string — structured `(message, params)` are gone by then. Rather than break `_log` (ripples to all subclasses), add an optional no-op `_logStructured(level, formatted, message?, params?)` hook fired alongside `_log`. Makes structured capture additive with zero subclass ripple. |
| Q5 = capture structured (`args`) | The `_logStructured` hook makes structured-now cheap + additive, flipping Q5 from the formatted-only fallback. `ILogRecord.args` = raw `[message, ...params]` (fgv's `_format` does no template substitution, so `args` is the structured form — not `template`+`params`). |
| Q1 names: `RetainingLogger` + `MultiLogger` | Both proposed read cleanly; packlet style. |
| Q2: `maxRecords: 1000`, retain at `'detail'` | Capture broad, filter at query. Deliberately more verbose than LoggerBase's `'info'` default. |
| Q3: `limit` = most-recent N, oldest-first | Natural log-viewer tail semantics. |
| Q4: injected `now?: () => number` | Deterministic seq/timestamp tests; fgv precedent for injectable clocks. |
| `MultiLogger` is `ILogger`-only (not `IDetailLogger`) | Per request scope; `errorWithDetail`/`warnWithDetail` fan-out is a future addition if needed. |
| Integration branch + squash to release | Erik's clean-history preference (same as local-summarization). Substrate + impl + fixups collapse to one release commit. |

---

## Q5 — the deliberate call (record of the divergence from the requesting orchestrator)

Requesting orchestrator leaned "capture structured, cheap on day one." fgv orchestrator grounded against `LoggerBase`: structured is NOT cheap at the existing `_log` seam (formatted-only). Erik's `_logStructured` additive hook resolves it — making structured capture cheap + additive after all. Net: same outcome the requester wanted (structured `ILogRecord`), reached via a mechanism (additive hook) the requester hadn't identified. Captured for the handoff-back so the requesting orchestrator sees the reasoning.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-25 | Cross-repo request received | personaility orchestrator → fgv orchestrator; archived at `.ai/notes/cross-repo-handoffs/logging-observability-2026-05.md`. |
| 2026-05-25 | Substrate prep + design adjudication | Q1–Q5 dispositions; `_logStructured` hook design; integration branch + brief + state + WORKSTREAMS entry. This PR. |
| 2026-05-26 | Implementation | `_logStructured` hook + `RetainingLogger` + `MultiLogger` + `ILogRecord`; tests (incl. subclass-unaffected); api report; `minor` change file; LIBRARY_CAPABILITIES. Gates green. Substrate migrated to `completed/2026-05/`. |
| 2026-05-26 | PR review round | Copilot review: reworked `RetainingLogger` to a true O(1) circular buffer (benchmark-driven — `shift()` cliffed above ~10k records); `MultiLogger` defensive `[...loggers]` copy; `maxRecords` capacity normalization (clamp, no throw — locked constructor preserved); declined the unqualified-`{@link}` suggestion (packlet-wide convention). Gates re-verified green; review satisfied. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | #417 | merged → integration branch |
| Implementation | #418 | open → integration branch (review satisfied; ready to squash → `release`) |
