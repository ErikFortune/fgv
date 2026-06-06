# `retaining-logger-ring-buffer-refactor` — result

**Status:** COMPLETE  
**PR:** TBD (see commit SHA)  
**Date:** 2026-06-06

---

## What shipped

Refactored `RetainingLogger` internals to compose `RetainingRingBuffer<ILogRecord>` from `@fgv/ts-utils/collections`. Retired the hand-rolled circular buffer (`_buffer`, `_head`, `_count`, `_capacity` fields + `_toOrderedArray()` method). Public API unchanged.

To break the circular packlet dependency (`collections` → `logging` → `collections`), factored the logging packlet into two packlets:
- **New `logging-interface/` packlet** — pure-contract symbols: `ILogger`, `IDetailLogger`, `ReporterLogLevel`, `isDetailLogger`. Zero implementation dependencies; only imports from `base`.
- **Existing `logging/` packlet (narrowed)** — implementations (`LoggerBase`, `BootLogger`, `InMemoryLogger`, `ConsoleLogger`, `RetainingLogger`, `MultiLogger`, `Logger`, `LogReporter`) plus `shouldLog` and `stringifyLogValue` (which need `base` helpers). Re-exports everything from `logging-interface` so the `Logging.*` namespace surface is exactly unchanged externally.
- `collections/readOnlyConvertingResultMap.ts` now imports `ILogger` from `logging-interface` directly.

---

## Files changed

| File | Change |
|------|--------|
| `src/packlets/logging/retainingLogger.ts` | Replace hand-rolled ring with `RetainingRingBuffer<ILogRecord>` composition; 93 lines → 22 lines net change |
| `src/packlets/logging-interface/index.ts` | NEW packlet — `ReporterLogLevel`, `ILogger`, `IDetailLogger`, `isDetailLogger` |
| `src/packlets/logging/logger.ts` | Import interfaces from `../logging-interface`; re-export for backward compat; move `shouldLog`/`stringifyLogValue` back in from former `base/loggerInterface.ts` |
| `src/packlets/collections/readOnlyConvertingResultMap.ts` | Import `ILogger` from `../logging-interface` instead of `../base` |
| `src/packlets/base/loggerInterface.ts` | DELETED — approach revised per Erik's review |
| `src/packlets/base/index.ts` | Remove `export * from './loggerInterface'` |
| `etc/ts-utils.api.md` | Regenerated — TRUE NO-OP vs release (only change: removal of spurious `ae-unresolved-link` warning introduced by prior branch work) |

---

## Dependency graph after refactor

```
base (no logging deps)
logging-interface → base
collections → base, logging-interface
logging → base, logging-interface, collections
```

No cycle. `logging-interface` is dependency-free (only `base`). `collections` can safely import `ILogger` from `logging-interface` without pulling in any implementation.

---

## Acceptance criteria check

- [x] `RetainingLogger` internals compose `RetainingRingBuffer<ILogRecord>`; hand-rolled ring retired
- [x] `etc/ts-utils.api.md` regenerated — TRUE NO-OP vs origin/release (`git diff origin/release -- etc/ts-utils.api.md` produces only removal of spurious prior warning, zero surface changes)
- [x] `Logging.*` namespace shape externally unchanged — every symbol that was reachable via `Logging.X` before still is; no new symbols added at `Logging.*`
- [x] No new top-level package exports (ILogger etc. are NOT directly importable from `@fgv/ts-utils`, same as before)
- [x] `rushx build` PASS (no errors, no API surface change warning)
- [x] `rushx lint` PASS (exit 0, clean)
- [x] `rushx test` PASS — coverage thresholds met (99.2%/99.61%/99.26%/99.2% — same as prior branch state, `logging-interface/index.ts` excluded by `coveragePathIgnorePatterns: ["index.js"]` pattern)
- [x] `rushx fixlint` run before final commit
- [x] `code-reviewer` self-pass run on revised diff — no P1 or P2 findings
- [x] Rush change file retained (unchanged from prior commit)
- [x] Stream artifact `result.md` updated to reflect revised approach

---

## Revision notes

First delivery used `base/loggerInterface.ts` extraction. Erik chose the `logging-interface` packlet factoring instead:
- Avoids dual-import path confusion
- Breaks the cycle at the architectural seam (not via type-erasure trick)
- Zero external delta: `Logging.*` namespace unchanged; no new top-level exports
- No deprecation burden

---

## code-reviewer pass summary (revised diff)

Pre-coverage pass ran on the revised diff. Findings:

- **P1**: None
- **P2**: None
- **P3**: The `export { isDetailLogger, ReporterLogLevel, ILogger, IDetailLogger }` explicit re-export in `logger.ts` uses a specific order to match the API Extractor namespace declaration ordering from release. Intentional — ensures TRUE NO-OP on api.md.

No issues requiring changes.
