# `retaining-logger-ring-buffer-refactor` — state

**Stream:** `retaining-logger-ring-buffer-refactor`
**Status:** COMPLETE
**Branch base:** `release` HEAD at commission time (c9211811c)
**Brief:** `.ai/tasks/completed/2026-06/retaining-logger-ring-buffer-refactor/brief.md`

---

## Commission trigger

Commissioned after `ts-prompt-assist-observability` cluster closed to `release` — `RetainingRingBuffer<T>` now available in `@fgv/ts-utils`.

---

## Phases

- [x] Phase 1 — Read current `RetainingLogger` internals + `RetainingRingBuffer<T>` API
- [x] Phase 2 — Refactor internals to compose the buffer; preserve public surface
- [x] Phase 3 — Existing tests pass verbatim; `etc/ts-utils.api.md` regenerates with only additive changes
- [x] Phase 4 — `code-reviewer` pass before coverage closure (L37) — no P1/P2 findings
- [x] Phase 5 — Close gates; artifact migration in the same PR; squash to release

---

## Decisions made

1. **Circular-dep resolution required**: The brief assumed `logging` could import from `collections`, but `collections/readOnlyConvertingResultMap.ts` already imports `ILogger` from `logging`, creating a cycle blocked by `@rushstack/packlets/circular-deps`. Resolution: extracted `ReporterLogLevel`, `shouldLog`, `stringifyLogValue`, `ILogger`, `IDetailLogger`, `isDetailLogger` from `logging/logger.ts` into a new `base/loggerInterface.ts` file. Updated `collections/readOnlyConvertingResultMap.ts` to import `ILogger` from `../base`. Updated `logging/logger.ts` to import from `../base` and re-export for backward compat. This is additive — no existing exports removed.

2. **api.md is not a pure no-op**: Due to the `ILogger`/`IDetailLogger`/`ReporterLogLevel`/`isDetailLogger` move to `base`, these symbols now have an additional `export` path (directly from `@fgv/ts-utils` top-level). They are still exported from the `Logging` namespace. This is an additive surface change (more ways to import the same things), not a breaking one. The pre-existing `ae-unresolved-link` warning on `_lastSeq` is also resolved.

3. **`_nextSeq` naming**: The old `_lastSeq` field was used for both seq assignment AND as the public `lastSeq` value. In the refactored code, seq assignment uses `_nextSeq` (private counter) and `lastSeq` getter delegates to `_ring.lastSeq`. Behavior is identical: the buffer tracks max seq pushed, which equals `_nextSeq` since sequences are strictly monotonic.

---

## Follow-up findings filed

None.
