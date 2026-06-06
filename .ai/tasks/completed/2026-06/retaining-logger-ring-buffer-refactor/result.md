# `retaining-logger-ring-buffer-refactor` — result

**Status:** COMPLETE  
**PR:** TBD (see commit SHA)  
**Date:** 2026-06-06

---

## What shipped

Refactored `RetainingLogger` internals to compose `RetainingRingBuffer<ILogRecord>` from `@fgv/ts-utils/collections`. Retired the hand-rolled circular buffer (`_buffer`, `_head`, `_count`, `_capacity` fields + `_toOrderedArray()` method). Public API unchanged.

Also: extracted the `ILogger`/`IDetailLogger`/`ReporterLogLevel`/`shouldLog`/`stringifyLogValue`/`isDetailLogger` interface layer from `logging/logger.ts` into a new `base/loggerInterface.ts` file to break the circular packlet dependency that would otherwise be introduced by `logging` importing from `collections`.

---

## Files changed

| File | Change |
|------|--------|
| `src/packlets/logging/retainingLogger.ts` | Replace hand-rolled ring with `RetainingRingBuffer<ILogRecord>` composition; 93 lines → 22 lines net change |
| `src/packlets/base/loggerInterface.ts` | NEW — extracted `ReporterLogLevel`, `shouldLog`, `stringifyLogValue`, `ILogger`, `IDetailLogger`, `isDetailLogger` |
| `src/packlets/base/index.ts` | Add `export * from './loggerInterface'` |
| `src/packlets/logging/logger.ts` | Import interfaces from `../base`; re-export for backward compat; remove duplicate definitions (-153 lines) |
| `src/packlets/collections/readOnlyConvertingResultMap.ts` | Import `ILogger` from `../base` instead of `../logging` |
| `etc/ts-utils.api.md` | Regenerated — additive change: `ILogger`/`IDetailLogger`/`ReporterLogLevel`/`isDetailLogger` now directly exported from top-level in addition to `Logging` namespace; pre-existing `ae-unresolved-link` warning resolved |

---

## Acceptance criteria check

- [x] `RetainingLogger` internals compose `RetainingRingBuffer<ILogRecord>`; hand-rolled ring retired
- [x] `etc/ts-utils.api.md` regenerated — additive only (no removed/renamed exports; see notes below)
- [x] All 23 existing public-API tests pass verbatim
- [x] `rushx build` PASS (no circular dep warnings, no errors)
- [x] `rushx lint` PASS (exit 0)
- [x] `rushx test` PASS — 100% coverage on all modified files including `retainingLogger.ts` (100/100/100/100) and `loggerInterface.ts` (100/100/100/100)
- [x] `rushx fixlint` run before final commit
- [x] `code-reviewer` self-pass run before coverage closure — no P1 or P2 findings
- [x] Rush change file added
- [x] Stream artifact `result.md` written, `state.md` updated to COMPLETE

---

## api.md notes

The api.md change is not a pure no-op due to the circular-dep resolution. The affected symbols (`ILogger`, `IDetailLogger`, `ReporterLogLevel`, `isDetailLogger`) were previously only in the `Logging` namespace export (via re-export from `logger.ts`). After moving to `base`, they also appear as top-level direct exports. This is **additive** — existing consumers who import from `Logging.*` are unaffected; new consumers gain a shorter import path. No exports were removed or renamed.

The pre-existing `ae-unresolved-link` warning on the `_lastSeq` field (which had a broken `@link` reference to `RetainingLogger.clear`) is resolved as a side effect because the field is retired.

---

## code-reviewer pass summary

Pre-coverage pass ran on the full diff. Findings:

- **P1**: None
- **P2**: None  
- **P3**: The `export { ... }` re-export pattern in `logger.ts` is slightly unusual (explicit named re-exports rather than `export * from '...'`) but is intentional — it avoids re-exporting implementation details from `base` that shouldn't be surfaced through `logging`. Kept as-is.

No issues requiring changes.
