# Cross-repo handoff: logging-packlet observability primitives

**Date received:** 2026-05-25
**Source:** personaility orchestrator → fgv orchestrator (orchestrator-to-orchestrator handoff, via chat)
**Destination stream:** `logging-observability` (`.ai/tasks/active/logging-observability/`)
**Pattern:** L9 cross-repo handoff (archived here per the push-model convention; the request arrived via chat rather than a PR drop, so the fgv orchestrator archives it on receipt).

---

## The request (as received)

A downstream `@fgv/ts-utils` consumer building in-app log visibility hit two gaps in the `logging` packlet. The consumer judged them trivial to build locally — which is exactly why they should be built once, in fgv: general logging capabilities, not consumer-specific, and logging is core durable infrastructure. Building them downstream would create migration debt the moment fgv ships the real thing.

### The gap

To serve an owner-gated log-query endpoint (`?level=warning&since=<cursor>`) that filters by severity and pages incrementally, a pinned logger must (a) **retain structured records** that keep their level + an ordering cursor, and (b) write every record to **both** stdout and that retainer. Neither exists today:

- **`InMemoryLogger` is insufficient.** Stores formatted strings only (`get logged(): string[]`); its `_log(message, __level)` **discards the level**. No timestamp, no sequence/cursor, no bound (unbounded growth). Can't answer "everything at `warning`+ since seq N."
- **No composite/tee logger.** Nothing fans a single log call out to multiple child loggers, so there's no way to feed both `ConsoleLogger` (stdout) and a retainer from one pinned `ILogger`.

The client-display half is already covered by `@fgv/ts-app-shell`'s `messages` packlet. This is purely the server-side retention + fan-out gap.

### Requested primitive 1 — record-retaining logger

A `LoggerBase` subclass retaining structured records in a bounded most-recent-N ring, with a query API supporting min-severity + since-cursor. `ILogRecord` = `{ seq, timestamp, level, message }`. Class `RetainingLogger(logLevel?, maxRecords?)` with `records`, `lastSeq`, `getRecords({ minLevel?, sinceSeq?, limit? })`, `clear()`.

Behavior: records carry the real level; `seq` monotonic + stable across eviction; bounded; respects `logLevel`; `getRecords` `minLevel` uses `shouldLog`.

### Requested primitive 2 — composite / fan-out logger

`MultiLogger implements ILogger` forwarding every call to N children, each applying its own threshold. `logLevel` = most-verbose child. Returns formatted message if any child logged, else `undefined`. Raw-forward (each child formats per its own rules; avoids double-format).

### Open questions (as posed)

- Q1 naming: `RetainingLogger`/`RecordingLogger`/`HistoryLogger`; `MultiLogger`/`BroadcastLogger`/`TeeLogger`.
- Q2 defaults: `maxRecords` (1000?); retain level (`detail` vs `all`).
- Q3 `limit` semantics: most-recent-N or oldest-N. Proposed most-recent-N, oldest-first.
- Q4 test clock: injected `now: () => number`?
- Q5 record shape: formatted string only, or structured `message`+`params`?

### Requesting orchestrator's peer assessment

Sound, well-scoped. Three subtle calls all correct (raw-forward; `logLevel` = most-verbose; `seq` stable across eviction). Q5 the one to decide deliberately — leaned toward capturing structured too, "cheap on day one, expensive after consumers depend on the shape." Q1 either name fine; Q2 `maxRecords: 1000` + retain at `detail`; Q3 most-recent-N oldest-first; Q4 yes. Soft-blocker for one downstream observability stream (paused pending these primitives).

---

## fgv orchestrator's adjudication (2026-05-25)

Accepted. Dispositions Q1–Q4 per the request/peer. **Q5 resolved differently** after grounding against the actual `LoggerBase`:

- `LoggerBase.log()` formats inside `_format` and the abstract `_log(message, level)` seam only ever receives the **formatted string** — the structured `(message, params)` are gone by then. So the peer's "structured is cheap" assumption was wrong: capturing it would require either a fragile `_format`-side-effect hack or a breaking `_log`-seam change rippling to every subclass.
- **Resolution (Erik):** add an *additive* optional `_logStructured(level, formatted, message?, params?)` hook to `LoggerBase` — default no-op (existing subclasses unaffected), fired alongside `_log` in the `shouldLog` branch. `RetainingLogger` overrides it to build the full record. This makes structured-capture cheap and additive after all, so **Q5 = capture structured** (`ILogRecord.args?: readonly unknown[]` alongside the formatted `message`).
- fgv's `_format` does no template substitution (stringify+join), so there's no separate "template" — `args` (the raw `[message, ...params]`) is the structured form.

Full design in `.ai/tasks/active/logging-observability/brief.md`.
