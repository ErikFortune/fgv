# Stream state: `messages-log-levels`

**Status:** ✅ implementation complete — §4 merged (#421), §1–§3 open (#423); ready to squash → `release`
**Integration branch:** `messages-log-levels` (off `release`)
**Last updated:** 2026-05-27 (implementation — §4 + §1–§3 landed)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation — §4 log-level alignment | ✅ merged | Breaking change on the messages packlet. Two-axis model (`level` filter + `severity` styling). Merged via #421 into the integration branch. |
| Implementation — §1–§3 StatusBar UX | ✅ complete (PR open) | Bounded `maxExpandedHeight`, in-flow mobile sheet, discoverable close control, `defaultExpanded`. PR #423 onto the integration branch. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Align messages-packlet filter to ts-utils canonical log levels | The panel's `MessageSeverity`-based filter is less expressive than ts-utils `MessageLogLevel`/`ReporterLogLevel` — lacks `detail`/`quiet`, so a logger logging at `detail` can't be filtered at the panel. Undercuts the `RetainingLogger` work (display half loses the granularity the record half retains). Cross-library semantic alignment: one canonical vocabulary. |
| Fork (a): two axes — `level` (filter) + `severity` (styling) | The current `MessageSeverity` conflates verbosity-filter with display-styling. They're orthogonal (a `detail`-level success message is coherent). `IMessage.level: MessageLogLevel` drives filtering (lossless logger bridge); `severity?: MessageSeverity` (incl. `'success'`) is styling-only, defaulting via `deriveSeverityFromLevel`. Erik agreed 2026-05-26. |
| Don't add `'success'` to ts-utils `MessageLogLevel` | `'success'` is a UI styling affordance, not a log level. Keep it on the ts-app-shell display axis; ts-utils canonical vocabulary stays clean. |
| Breaking change OK (active-dev) | ts-app-shell is on the ACTIVE_DEVELOPMENT list (new library, no consumers outside this repo). No compat shims; update in-repo consumers in the same PR. `major` rush change. |
| Integration branch + squash to release | Clean-history preference (same as logging-observability / local-summarization). |

---

## Origin

Gap identified by Erik (2026-05-26) during the observability journey — the same journey as `logging-observability`. The `RetainingLogger` (shipped `5.1.0-31`) retains rich log levels server-side; this aligns the ts-app-shell display half so the panel can filter at the same granularity. Client-display completion of the observability story. Soft-blocker for personaility's client-side observability.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-26 | Gap identified + adjudicated | Erik flagged the messages-packlet/ts-utils log-level divergence. Grounded against `MessageSeverity` (`info`/`success`/`warning`/`error`) vs `MessageLogLevel`/`ReporterLogLevel`. Fork (a) chosen. |
| 2026-05-26 | Substrate prep | brief + state + WORKSTREAMS entry. PR #420. |
| 2026-05-27 | §4 implementation merged | Two-axis log-level alignment + tests (messages packlet 100%). PR #421 → integration branch. |
| 2026-05-27 | §1–§3 amendment | StatusBar UX (bounded height, mobile in-flow sheet, close control, `defaultExpanded`) from personaility S17 feedback. PR #423 → integration branch (supersedes abandoned #422). |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | #420 | merged → integration branch |
| §4 implementation | #421 | merged → integration branch |
| §1–§3 StatusBar UX | #423 | open → integration branch (supersedes abandoned #422) |
