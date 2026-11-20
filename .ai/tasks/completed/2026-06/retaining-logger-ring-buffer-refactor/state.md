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
- [x] Phase 3 — Existing tests pass verbatim; `etc/ts-utils.api.md` regenerates as a **true no-op** (the only diff vs `release` is the removal of 4 lines of a pre-existing `ae-unresolved-link` warning that the refactor incidentally resolved)
- [x] Phase 4 — `code-reviewer` pass before coverage closure (L37) — no P1/P2 findings
- [x] Phase 5 — Close gates; artifact migration in the same PR; squash to release

---

## Decisions made

1. **Circular-dep resolution required**: The brief assumed `logging` could import from `collections`, but `collections/readOnlyConvertingResultMap.ts` already imports `ILogger` from `logging`, creating a cycle blocked by `@rushstack/packlets/circular-deps`.

   **First-attempt resolution (REJECTED by Erik 2026-06-05)**: extracted `ILogger` / `IDetailLogger` / `ReporterLogLevel` / `isDetailLogger` into `base/loggerInterface.ts`. Cleared the cycle but produced a non-no-op `api.md` — the moved symbols became direct top-level package exports in addition to their existing `Logging.*` paths. Erik rejected this: dual-import-paths-forever was the wrong long-term shape, and the cleaner deprecation path had too large a blast radius.

   **Final resolution (shipped)**: factored the `logging` packlet into two: a new pure-contract packlet `logging-interface` (`ILogger`, `IDetailLogger`, `ReporterLogLevel`, `isDetailLogger`), and the existing `logging` packlet (now narrowed to implementations). `logging` re-exports everything from `logging-interface`, so the `Logging.*` namespace shape is byte-for-byte unchanged externally. `collections/readOnlyConvertingResultMap.ts` imports `ILogger` from `logging-interface` directly. Dependency graph: `base` (no logging deps) → `logging-interface` (depends only on `base`) → `collections` (depends on `base` + `logging-interface`) → `logging` (depends on all of the above). No cycle.

2. **api.md is a true no-op**: with the final approach above, `git diff origin/release -- libraries/ts-utils/etc/ts-utils.api.md` removes only 4 lines of a pre-existing `ae-unresolved-link` warning that the refactor incidentally resolved (the warning referenced `_lastSeq`, which no longer exists in the composed implementation). Zero public-surface change — no symbols added, removed, renamed, or moved. The load-bearing brief check is met.

3. **`_nextSeq` naming**: The old `_lastSeq` field was used for both seq assignment AND as the public `lastSeq` value. In the refactored code, seq assignment uses `_nextSeq` (private counter) and `lastSeq` getter delegates to `_ring.lastSeq`. Behavior is identical: the buffer tracks max seq pushed, which equals `_nextSeq` since sequences are strictly monotonic.

---

## Follow-up findings filed

None.
