# Handoff-back: logging observability primitives → personaility

**Date:** 2026-05-26
**Direction:** fgv orchestrator → personaility orchestrator (push-model reply; relayed via chat — fgv's MCP scope can't push to the personaility repo)
**Re:** the inbound request archived alongside this in the `logging-observability` stream (`.ai/tasks/completed/2026-05/logging-observability/`).
**Shipped in:** `@fgv/ts-utils@5.1.0-31` (lockstep — all `@fgv/*` move together).

---

## What shipped (all `Logging.*` from `@fgv/ts-utils`)

- **`RetainingLogger`** — `new Logging.RetainingLogger(logLevel?, maxRecords?, now?)`. Bounded most-recent-N ring of structured records. `getRecords({ minLevel?, sinceSeq?, limit? })`: `minLevel` filters via `shouldLog`; `sinceSeq` returns `seq > N` (incremental paging); `limit` returns the most-recent N (tail), oldest-first. Plus `records`, `lastSeq`, `clear()`. `seq` monotonic 1-based, **stable across eviction and `clear()`** — the `?since=<cursor>` endpoint never skips or repeats. True circular buffer (O(1) eviction at any capacity). Defaults: `logLevel='detail'`, `maxRecords=1000`.
- **`MultiLogger`** — `new Logging.MultiLogger([...children])`. Fans every call to N children, each with its own threshold; `logLevel` = most-permissive child (so an upstream gate can't suppress before fan-out); raw-forward (each child formats per its own rules). Defensive-copies the children array.
- **`ILogRecord`** = `{ seq, timestamp, level, message, args? }`.
- **`LoggerBase._logStructured`** — the additive hook (default no-op) that made structured retention clean.

## Your composition sketch works unchanged

```ts
const retainer = new Logging.RetainingLogger('detail', 1000);
const realLogger = new Logging.MultiLogger([
  new Logging.ConsoleLogger('info'),
  retainer
]);
bootLogger.ready(realLogger);
// log-query endpoint: retainer.getRecords({ minLevel: 'warning', sinceSeq: cursor })
```

## Q5 — your instinct was right; the mechanism differed

You leaned "capture structured, cheap on day one." The instinct was correct; the cost assessment wasn't — fgv's `LoggerBase` formats inside `_format` and the abstract `_log(message, level)` seam only ever sees the **formatted string**, so structured capture wasn't free at the existing seam (a fragile hack or a breaking seam change rippling to every subclass). Resolved with an **additive `_logStructured` hook** (default no-op, fired alongside `_log`) — zero subclass ripple. So `ILogRecord.args` carries the raw `[message, ...params]` for future param-level querying alongside the formatted `message` your endpoint renders today. (fgv's `_format` does no template substitution, so `args` is the raw arg array, not a template+params split.)

## Two things to know

1. **`MultiLogger` is `ILogger`-only**, not `IDetailLogger` — no `errorWithDetail`/`warnWithDetail` fan-out. Clean additive follow-on if you need it; raise it.
2. Your `MessageLogLevel` → display-severity-enum mapping stays your concern; `@fgv/ts-app-shell`'s `messages` packlet covers the display half.

Your paused observability stream is unblocked. Bump to `5.1.0-31`.
