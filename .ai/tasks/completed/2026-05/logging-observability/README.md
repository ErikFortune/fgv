# logging-observability

**Status:** ✅ implementation complete — PR open on the `logging-observability` integration branch (orchestrator squash-merges → `release`).

Added two observability primitives to `@fgv/ts-utils`'s `logging` packlet — plus the additive `LoggerBase` hook that makes structured retention clean — requested by a downstream consumer (personaility) building an owner-gated log-query endpoint.

## What shipped

- **`LoggerBase._logStructured`** — additive protected hook (default no-op) called by `log()` in the `shouldLog` branch alongside `_log`, exposing the structured `(level, formatted, message, parameters)` form. The `_log(formatted, level)` seam is untouched, so all existing subclasses (`ConsoleLogger`, `InMemoryLogger`, `LogReporter`'s logger, `NoOpLogger`) are behaviorally unaffected — pinned by a dedicated test.
- **`RetainingLogger`** — `LoggerBase` subclass retaining structured `ILogRecord`s in a bounded most-recent-N ring. `getRecords({ minLevel?, sinceSeq?, limit? })` supports min-severity filtering (via `shouldLog`), since-cursor incremental paging, and most-recent-N tail. `seq` is monotonic 1-based and **stable across eviction** and `clear()` — a client holding `sinceSeq` never re-sees or skips a record.
- **`MultiLogger`** — `ILogger` (not `LoggerBase`, not `IDetailLogger`) that fans every call out to N child loggers, each applying its own threshold (so one pinned logger feeds both a `ConsoleLogger` for stdout and a `RetainingLogger` for an observability buffer). `logLevel` reports the most-permissive child's level, computed on access.
- **`ILogRecord`** = `{ seq, timestamp, level, message, args? }` — `args` is the raw `[message, ...parameters]` (fgv's `_format` does no template substitution, so the raw args *are* the structured form).
- `LIBRARY_CAPABILITIES.md` logging row; `minor` rush change file; regenerated `etc/ts-utils.api.md`.

## Why

Cross-repo handoff (personaility → fgv, archived in `.ai/notes/cross-repo-handoffs/`). Textbook extend-the-primitive: general logging infra (record retention + fan-out), not consumer-specific; logging is core durable surface; building downstream would create migration debt.

## Outcome

Same outcome the requester wanted — structured `ILogRecord` on day one — reached via Erik's `_logStructured` additive hook (the mechanism the requester hadn't identified; see `state.md` Q5 note). `MultiLogger.logLevel`-as-most-verbose computed cleanly from a materialized `shouldLog` ordering. The one design refinement: `RetainingLogger`'s hook override takes `message`/`parameters` as **required** (the base no-op declares them optional), eliminating a dead `?? []` branch and reaching 100% coverage with no directive — TS method bivariance accepts the narrowed override. Gates: new files 100% on all 4 metrics; full `rushx build` + `lint` + `test` green; api report regenerated.

## Artifacts

- `brief.md` — the binding contract + locked Q1–Q5 dispositions + the `_logStructured` design crux.
- `state.md` — decisions log + Q5 divergence note + history.
- `result.md` — full implementation result, `ILogRecord` shape, and gate evidence.

## Out of scope (unchanged)

`IDetailLogger` fan-out on `MultiLogger`; template-substitution formatting; the consumer's `MessageLogLevel` → display-severity mapping; the log-query endpoint / display panel (consumer side).
