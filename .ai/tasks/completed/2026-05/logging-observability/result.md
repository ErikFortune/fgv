# Stream result: `logging-observability`

**Status:** ✅ implementation complete — PR on the `logging-observability` integration branch (orchestrator squash-merges → `release`).
**Package surface:** `@fgv/ts-utils` logging packlet (additive) + `.ai/instructions/LIBRARY_CAPABILITIES.md`.

---

## What shipped

Three additive pieces, exactly per the locked brief (Q1–Q5):

1. **`LoggerBase._logStructured` hook** (`logger.ts`) — new protected method, default no-op:
   ```typescript
   protected _logStructured(__level, __formatted, __message?, __parameters?): void { /* no-op */ }
   ```
   `LoggerBase.log()` now calls it alongside `_log`, **inside the `shouldLog` branch only** (suppressed messages never reach it). The only change to `LoggerBase`; the `_log(formatted, level)` seam is untouched, so every existing subclass is unaffected.

2. **`RetainingLogger extends LoggerBase`** (`retainingLogger.ts`) — captures the full structured record via the hook into a bounded most-recent-N ring; `_log` is a trivial `succeed(formatted)` (a pure retainer emits nowhere).
   - `constructor(logLevel = 'detail', maxRecords = 1000, now = () => Date.now())`.
   - `records`, `lastSeq`, `getRecords({ minLevel?, sinceSeq?, limit? })` (oldest-first; `minLevel` via `shouldLog`; `sinceSeq` → `seq > N`; `limit` → most-recent-N tail), `clear()` (does NOT reset seq).
   - `seq` monotonic 1-based, stable across eviction and `clear()`; respects `logLevel` (suppressed messages consume no seq).

3. **`MultiLogger implements ILogger`** (`multiLogger.ts`, NOT `LoggerBase`, NOT `IDetailLogger`) — forwards raw `(level, message, ...params)` to each child's public method (each formats + filters per its own rules; no pre-filter). Returns the formatted message if any child logged, else `undefined`. `logLevel` is the most-permissive child's level, **computed on access** (a child's level may change).

Plus: `ILogRecord` + `IGetRecordsOptions` interfaces; barrel exports (`Logging.RetainingLogger` / `Logging.MultiLogger` / `Logging.ILogRecord`); `LIBRARY_CAPABILITIES.md` logging row; `minor` rush change file; regenerated api report.

## `ILogRecord` shape as shipped

```typescript
export interface ILogRecord {
  readonly seq: number;          // monotonic 1-based, stable across eviction
  readonly timestamp: number;    // ms since epoch, from injected clock
  readonly level: MessageLogLevel;
  readonly message: string;      // formatted (LoggerBase._format output)
  readonly args?: readonly unknown[]; // raw [message, ...parameters]
}
```

## Design notes / deviations

- **`MultiLogger.logLevel` (most-verbose)** computed cleanly via a materialized `verbosityRank: Record<ReporterLogLevel, number>` (`silent < error < warning < info < detail < all`) — the `shouldLog` ordering made explicit and exhaustively type-checked over the closed union. No surprises; empty-children case returns `'silent'`.
- **`RetainingLogger._logStructured` override takes `message`/`parameters` as required** (not optional like the base no-op). `LoggerBase.log` always passes the rest array, so the optional `?? []` fallback was dead code (uncovered branch). TS method bivariance accepts the narrowed override, eliminating the branch and reaching 100% honestly — no coverage directive needed.

## Post-review: true O(1) ring buffer

PR review (Copilot) flagged that the initial `Array.prototype.shift()` eviction is O(n) per log once the buffer fills. Benchmarked it: at the default `maxRecords=1000` it's ~230 ns/log (negligible), but there's a hard cliff above ~10k — ~356 µs/log at 100k, ~3.5 ms/log at 1M (V8's fast-shift pointer-bump path gives way to a full O(n) memmove, cache-miss-bound at scale). Since this is a *retention* primitive that invites large buffers, the cliff was a real footgun. Reworked `RetainingLogger` to a genuine circular buffer (fixed-capacity backing array + `_head` index + `_count`, lazy growth, in-place overwrite) — O(1) eviction at any capacity, no `shift()`. Public surface unchanged; observable behavior (oldest-first, seq stability across eviction) identical. The ring requires a positive-integer capacity, so `maxRecords` is normalized in the constructor (`Number.isFinite && >= 1 ? Math.floor : 1`) without changing the signature or throwing. Also applied the defensive `[...loggers]` copy in `MultiLogger` (review). Declined the unqualified-`{@link}` suggestion — the qualified `Logging.*` form is the packlet-wide convention (396 pre-existing `ae-unresolved-link` baseline).

## Gate evidence

- `rush build` (full repo) — clean; api-extractor regenerated `etc/ts-utils.api.md`.
- `rushx lint` — clean (separate gate); `rushx fixlint` produced no source changes.
- `rushx test` (full `@fgv/ts-utils`) — exit 0; **`logger.ts`, `multiLogger.ts`, `retainingLogger.ts` all 100% / 100% / 100% / 100%**. Suite global 99.18% (above the 98% configured gate; pre-existing baseline unchanged).
- Tests: subclass-unaffected (`ConsoleLogger` / `InMemoryLogger` / `LogReporter`'s logger) pinned in `logStructuredHook.test.ts`; `getRecords` filtering (minLevel/sinceSeq/limit-tail + combination + limit>count); ring eviction; **seq monotonicity across eviction** (cursor never repeats/skips); `clear()` not resetting seq; injected-clock determinism + default-`Date.now`; `MultiLogger` fan-out with independent thresholds; `logLevel` = most-verbose (incl. recompute-on-change + empty); return-value semantics.
- No `any`; no unsafe casts; no `Result<void>` (`MultiLogger` methods return `Success<string | undefined>` per `ILogger`).

## Handoff-back to personaility's orchestrator

- Same outcome the requester wanted (structured `ILogRecord` on day one), reached via Erik's `_logStructured` additive hook — the mechanism the requester hadn't identified (see state.md Q5 note).
- The composition the consumer's log-query endpoint wants:
  ```typescript
  const retainer = new Logging.RetainingLogger('detail', 1000);
  const real = new Logging.MultiLogger([new Logging.ConsoleLogger('info'), retainer]);
  bootLogger.ready(real);                 // existing pin call, unchanged
  // endpoint reads retainer.getRecords({ minLevel, sinceSeq, limit })
  ```
- Out of scope (unchanged): `IDetailLogger` fan-out on `MultiLogger`; consumer's `MessageLogLevel` → display-severity mapping; the log-query endpoint / display panel.
