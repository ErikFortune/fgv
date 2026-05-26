# Stream brief: `logging-observability`

**Status:** 🟢 ready to commission
**Integration branch:** `logging-observability` (off `release`)
**Workflow shape:** single implementation PR onto the integration branch → squash to `release`
**Package surface:** `@fgv/ts-utils` logging packlet (`LoggerBase` additive hook + two new classes + `ILogRecord`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

---

## Mission

Add two observability primitives to `@fgv/ts-utils`'s `logging` packlet, requested by a downstream consumer (personaility) building an owner-gated log-query endpoint:

1. **`RetainingLogger`** — a `LoggerBase` subclass that retains structured log records in a bounded most-recent-N ring, with a query API supporting min-severity filtering + since-cursor incremental paging.
2. **`MultiLogger`** — an `ILogger` that fans every log call out to N child loggers, each applying its own threshold (so one pinned logger can feed both `ConsoleLogger` (stdout) and a `RetainingLogger`).

Plus the enabler that makes structured retention clean:

3. **`LoggerBase._logStructured` additive hook** — a new optional protected method (default no-op) that exposes the structured `(level, formatted, message, params)` to subclasses that want it, without changing the existing `_log(formatted, level)` seam.

**Origin:** cross-repo handoff, archived at `.ai/notes/cross-repo-handoffs/logging-observability-2026-05.md`. Soft-blocker for a downstream observability stream. Textbook extend-the-primitive: general logging infra, not consumer-specific; logging is core durable surface; building downstream would create migration debt.

`@fgv/ts-utils` is an **established** surface — additive-only, careful public shapes, 100% coverage mandatory (not active-development).

---

## Why `_logStructured` (the design crux)

`LoggerBase.log()` formats via `_format(message, ...params)` and then calls the abstract `_log(formatted, level)`. The `_log` seam — the only override point — receives **only the formatted string**; the structured `(message, params)` are consumed inside `_format` before `_log` runs. So a retaining subclass extending the existing seam could capture formatted-message + level only, NOT the raw structured form.

Rather than break the `_log` seam (which would ripple to every subclass — `ConsoleLogger`, `InMemoryLogger`, `LogReporter`'s logger), add an **additive optional hook**:

```typescript
// LoggerBase — NEW, additive. Default no-op → existing subclasses unaffected.
protected _logStructured(
  __level: MessageLogLevel,
  __formatted: string,
  __message?: unknown,
  __parameters?: readonly unknown[]
): void {
  /* no-op; subclasses that retain structured records override this */
}

// LoggerBase.log() — add the call alongside _log, in the shouldLog branch only:
public log(level, message?, ...parameters): Success<string | undefined> {
  if (shouldLog(level, this.logLevel)) {
    const formatted = this._format(message, ...parameters);
    this._logStructured(level, formatted, message, parameters);   // NEW
    return this._log(formatted, level);
  }
  return this._suppressLog(level, message, ...parameters);
}
```

This is the only change to `LoggerBase`. It's additive (new no-op method + one internal call); no public-API change; no subclass behavior change. **It IS a change to a foundational base class, so it requires a test asserting existing subclasses are behaviorally unaffected** (the no-op default guarantees it; the test pins it).

Note: fgv's `_format` does no template substitution (it stringifies + joins `[message, ...params]`), so there's no separate "template" to retain — the structured form is the raw `args = [message, ...parameters]`. `ILogRecord` carries `args`, not `template`+`params`.

---

## Primitive 1 — `RetainingLogger`

```typescript
/**
 * A retained log record. Preserves the level and an ordering cursor so consumers
 * can filter by severity and page incrementally.
 * @public
 */
export interface ILogRecord {
  /** Monotonic 1-based sequence number, stable across ring eviction. */
  readonly seq: number;
  /** ms since epoch when the record was logged (from the injected clock). */
  readonly timestamp: number;
  /** The level the record was logged at. */
  readonly level: MessageLogLevel;
  /** The formatted message (same formatting LoggerBase._format produces). */
  readonly message: string;
  /** The raw structured inputs `[message, ...parameters]` before formatting. */
  readonly args?: readonly unknown[];
}

export declare class RetainingLogger extends LoggerBase {
  constructor(logLevel?: ReporterLogLevel, maxRecords?: number, now?: () => number);
  get records(): ReadonlyArray<ILogRecord>;
  get lastSeq(): number;
  getRecords(options?: {
    readonly minLevel?: ReporterLogLevel;
    readonly sinceSeq?: number;
    readonly limit?: number;
  }): ReadonlyArray<ILogRecord>;
  clear(): void;
}
```

**Behavior contract:**
- Captures the full record via the new `_logStructured` hook (level + formatted message + raw `args`). Implements the abstract `_log` as a trivial no-op emit (a pure retainer writes nowhere) returning `succeed(formatted)`.
- `seq` monotonic 1-based, **stable across eviction** — a client holding `sinceSeq` never re-sees or skips records; evicted records simply scroll off the bottom. `clear()` does NOT reset the counter.
- Bounded — past `maxRecords`, oldest evicted; no unbounded growth.
- Respects `logLevel` — records below threshold are not retained (hook fires only in the `shouldLog` branch).
- `getRecords`: oldest-first. `minLevel` uses `shouldLog(level, minLevel)`. `sinceSeq` includes only `seq > sinceSeq`. `limit` returns the most-recent N (tail), still oldest-first (Q3).
- `now?: () => number` injected clock (default `() => Date.now()`) for deterministic timestamp/ordering tests (Q4).

**Defaults (Q2):** `logLevel` default `'detail'` (retain broad, filter at query time — deliberately more verbose than `LoggerBase`'s `'info'` default); `maxRecords` default `1000`.

---

## Primitive 2 — `MultiLogger`

```typescript
export declare class MultiLogger implements ILogger {
  constructor(loggers: ReadonlyArray<ILogger>);
  readonly logLevel: ReporterLogLevel;   // most-verbose (most-permissive) child's level
  log(level, message?, ...params): Success<string | undefined>;
  detail(message?, ...params): Success<string | undefined>;
  info(message?, ...params): Success<string | undefined>;
  warn(message?, ...params): Success<string | undefined>;
  error(message?, ...params): Success<string | undefined>;
}
```

**Behavior contract:**
- Forwards raw `(level, message, ...params)` to each child's **public** method, so each child formats per its own rules (avoids double-formatting). Does NOT extend `LoggerBase` — it's a thin `ILogger` that delegates.
- Each child filters by its own `logLevel`; the composite does NOT pre-filter.
- Returns the formatted message if any child logged it, else `undefined`.
- `logLevel` reports the most-verbose/most-permissive child's level (so an upstream `shouldLog` gate — e.g. a `LogReporter` wrapping the `MultiLogger` — doesn't suppress before fan-out). Compute via the `shouldLog` ordering; derive once or on access (implementer's call; if children's `logLevel` can change, compute on access).
- **`ILogger` only**, NOT `IDetailLogger`. `errorWithDetail`/`warnWithDetail` fan-out is out of scope (future addition if a consumer needs it).

---

## Composition (informs the contract; not part of the ask)

```typescript
const retainer = new Logging.RetainingLogger('detail', 1000);
const realLogger = new Logging.MultiLogger([
  new Logging.ConsoleLogger('info'),   // stdout, as today
  retainer                              // observability buffer
]);
bootLogger.ready(realLogger);           // existing pin call, unchanged
// the service keeps `retainer`; its log-query endpoint reads retainer.getRecords({...}).
```

---

## Open-question dispositions (LOCKED)

| Q | Decision | Rationale |
|---|---|---|
| Q1 naming | `RetainingLogger` + `MultiLogger` | Both proposed names read cleanly; matches packlet style. |
| Q2 defaults | `maxRecords: 1000`; retain at `'detail'` | Capture broad, filter at query time. |
| Q3 `limit` | most-recent N (tail), returned oldest-first | Natural log-viewer semantics. |
| Q4 clock | inject `now?: () => number`, default `Date.now` | Deterministic seq/timestamp tests; precedent in fgv for injectable clocks. |
| Q5 record shape | **structured** — `args?: readonly unknown[]` alongside formatted `message` | Made cheap + additive by the `_logStructured` hook (see design crux). Richer canonical record on day one; no permanence trap. |

---

## In-scope

- `libraries/ts-utils/src/packlets/logging/logger.ts` — add `_logStructured` hook to `LoggerBase` + the one call in `log()`; add `RetainingLogger` + `ILogRecord` + `MultiLogger` (or split into sibling files if that matches packlet structure — match existing layout).
- `libraries/ts-utils/src/packlets/logging/index.ts` — barrel exports (`Logging.RetainingLogger`, `Logging.MultiLogger`, `ILogRecord`).
- `libraries/ts-utils/src/test/unit/...logging...` — tests (see acceptance).
- `libraries/ts-utils/etc/ts-utils.api.md` — regenerated.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — logging packlet entry: add `RetainingLogger` / `MultiLogger` / `_logStructured`.
- `common/changes/@fgv/ts-utils/` — rush change file (`minor`; additive).

## Out-of-scope

- Changing the existing `_log(formatted, level)` seam or `InMemoryLogger`'s behavior (additive only).
- `IDetailLogger` fan-out on `MultiLogger`.
- Template-substitution formatting (fgv's `_format` doesn't do it; `args` is the raw form).
- The consumer's `MessageLogLevel` → display-severity mapping (consumer concern).
- The log-query endpoint / display panel (consumer side; `ts-app-shell` messages packlet already covers display).

## Acceptance criteria

- [ ] `_logStructured` additive hook on `LoggerBase` (default no-op); `log()` calls it in the `shouldLog` branch.
- [ ] **Test asserting existing subclasses (`ConsoleLogger`, `InMemoryLogger`, `LogReporter`'s logger) are behaviorally unaffected** by the hook addition.
- [ ] `RetainingLogger` + `ILogRecord` + `MultiLogger` exported from the logging barrel (`Logging.X`).
- [ ] `rush build` full repo clean; `rushx lint` clean (separate gate); `rushx fixlint` run before final commit.
- [ ] `rushx test` 100% coverage all 4 metrics in `@fgv/ts-utils`. Cover: `records`/`getRecords` filtering (minLevel via shouldLog; sinceSeq paging; limit tail); ring eviction; **seq monotonicity across eviction** (client holding sinceSeq never skips/repeats); `clear()` not resetting seq; injected-clock determinism; `MultiLogger` fan-out to multiple children with independent thresholds; `MultiLogger.logLevel` = most-verbose child; return-value (formatted if any child logged, else undefined).
- [ ] api-extractor regenerated.
- [ ] Rush change file (`minor`).
- [ ] LIBRARY_CAPABILITIES updated.
- [ ] No `any`; no unsafe casts; no `Result<void>`.
- [ ] `result.md` written; substrate migrated to `.ai/tasks/completed/<YYYY-MM>/logging-observability/` with polished README as part of the implementation PR (before the squash).

## Required reading

1. This brief.
2. `libraries/ts-utils/src/packlets/logging/logger.ts` — `LoggerBase`, `shouldLog`, `_format`, `InMemoryLogger`, `ILogger`/`IDetailLogger`, `ReporterLogLevel`, `MessageLogLevel`. **Understand the `log → _format → _log` flow before touching it.**
3. `libraries/ts-utils/src/packlets/logging/{bootLogger.ts, logReporter.ts, index.ts}` — sibling loggers + the barrel + how `ConsoleLogger`/`LogReporter` implement `_log` (these must stay unaffected).
4. `CLAUDE.md` + `.ai/instructions/CODING_STANDARDS.md`.
5. `.ai/notes/cross-repo-handoffs/logging-observability-2026-05.md` — origin + the Q5 reasoning, for context.

## Skills to load

| When | Skill |
|---|---|
| Before any Result-returning code | `/result-pattern` |
| Before writing tests | `/result-tests` |
| Before any logger construction / diagnostic code | `/ts-utils-logging` |

## Stop-and-surface

- Adding `_logStructured` to `LoggerBase` surfaces an existing subclass that already relies on `_log`-only in a way the hook interferes with — surface (shouldn't happen with a no-op default, but verify).
- `MultiLogger.logLevel`-as-most-verbose can't be cleanly computed from the `shouldLog` ordering (e.g. an unexpected level value) — surface.
- The packlet's file layout makes "where does `RetainingLogger`/`MultiLogger` live" non-obvious (single file vs sibling files) — match the existing structure; if unclear, surface.

## fgv-conventions pre-load (per L22)

- No re-exports from sibling `@fgv/*` packages.
- All fallible ops return `Result<T>`; no `Result<void>`. (`MultiLogger`'s methods return `Success<string | undefined>` per `ILogger`.)
- `@fgv/ts-utils` is established surface — additive-only; no breaking changes to existing exports or the `_log` seam.
- `rushx lint` is a separate gate from `rushx build`.

## Branch + PR posture

- **Integration branch:** `logging-observability` (off `release`). Substrate-prep + implementation + any fixups land here.
- **Work branch stem:** `feat/logging-observability` (harness may suffix; record actual name in state.md).
- **PR target:** `logging-observability` (integration branch), NOT `release`.
- **PR title:** `feat(ts-utils): RetainingLogger + MultiLogger observability primitives`
- **Close:** orchestrator squash-merges `logging-observability` → `release` as one clean commit after gates pass + substrate migrated.
