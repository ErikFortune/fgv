# Stream state: `messages-log-levels`

**Status:** 🟢 ready to commission — substrate prep in flight
**Integration branch:** `messages-log-levels` (off `release`)
**Last updated:** 2026-05-26 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Single-PR breaking-change feature on ts-app-shell messages packlet. Design (fork a) locked in brief. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Align messages-packlet filter to ts-utils canonical log levels | The panel's `MessageSeverity`-based filter is less expressive than ts-utils `MessageLogLevel`/`ReporterLogLevel` — lacks `detail`/`quiet`, so a logger logging at `detail` can't be filtered at the panel. Undercuts the `RetainingLogger` work (display half loses the granularity the record half retains). Cross-library semantic alignment: one canonical vocabulary. |
| Fork (a): two axes — `level` (filter) + `severity` (styling) | The current `MessageSeverity` conflates verbosity-filter with display-styling. They're orthogonal (a `detail`-level success message is coherent). `IMessage.level: MessageLogLevel` drives filtering (lossless logger bridge); `severity?: MessageSeverity` (incl. `'success'`) is styling-only, defaulting via `deriveSeverityFromLevel`. Erik agreed 2026-05-26. |
| Don't add `'success'` to ts-utils `MessageLogLevel` | `'success'` is a UI styling affordance, not a log level. Keep it on the ts-app-shell display axis; ts-utils canonical vocabulary stays clean. |
| Breaking change OK (active-dev) | ts-app-shell is on the ACTIVE_DEVELOPMENT list (new library, no consumers outside this repo). No compat shims; update in-repo consumers in the same PR. `major` rush change. |
| Integration branch + squash to release | Clean-history preference (same as logging-observability / local-summarization). |
| Scope expanded to full S17 feedback batch (§1–§4) | personaility's full investigation (2026-05-26) surfaced 3 StatusBar UX findings (§1 viewport-takeover/no-scroll, §2 non-discoverable dismiss, §3 collapsed-by-default) alongside §4 (the log-level mismatch). All four touch the messages packlet; §4 + §1–§3 both edit `StatusBar.tsx`, so separate streams would collide. Folded into one stream. §1 (`maxExpandedHeight`) is the highest-value fix per personaility. Slug stays `messages-log-levels` (load-bearing finding + soft-blocker) to avoid rename churn on the pushed branch; mission/title broadened for discoverability. |
| §4 sharpened by the investigation | Concrete repro: `initialFilterLevel: 'info'` is a no-op today (can't hide `detail` chatter because no `IMessage` can be `detail`); personaility had to suppress GET /logs poll noise server-side. The fork-(a) design makes `initialFilterLevel` meaningful. personaility's own suggested root fix matches fork (a). |

---

## Origin

Gap identified by Erik (2026-05-26) during the observability journey — the same journey as `logging-observability`. The `RetainingLogger` (shipped `5.1.0-31`) retains rich log levels server-side; this aligns the ts-app-shell display half so the panel can filter at the same granularity. Client-display completion of the observability story. Soft-blocker for personaility's client-side observability.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-26 | Gap identified + adjudicated | Erik flagged the messages-packlet/ts-utils log-level divergence. Grounded against `MessageSeverity` (`info`/`success`/`warning`/`error`) vs `MessageLogLevel`/`ReporterLogLevel`. Fork (a) chosen. |
| 2026-05-26 | Substrate prep | brief + state + WORKSTREAMS entry. This PR. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
