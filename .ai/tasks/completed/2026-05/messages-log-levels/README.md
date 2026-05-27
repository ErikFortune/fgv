# messages-log-levels — completed

**Stream ID:** messages-log-levels
**Bucket:** 2026-05
**Integration branch:** `messages-log-levels` (off `release`) → squash to `release` at close
**Work branch:** `claude/gracious-pasteur-Gpr4c`
**PRs (onto `messages-log-levels`):**
- §4 log-level alignment — [#421](https://github.com/ErikFortune/fgv/pull/421) `feat(ts-app-shell)!: align messages packlet to ts-utils log levels (breaking)` (merged)
- §1–§3 StatusBar UX — [#422](https://github.com/ErikFortune/fgv/pull/422) `feat(ts-app-shell): StatusBar UX — bounded expanded height, dismiss control, collapsed-by-default`
**Change type:** `major` (`@fgv/ts-app-shell`) — `major` (§4) + `minor` sibling (§1–§3 props)

## What shipped

Split the `@fgv/ts-app-shell` `messages` packlet's single `MessageSeverity` enum
(`info`/`success`/`warning`/`error`) — which conflated verbosity-filtering with display
styling — into two orthogonal axes aligned to `@fgv/ts-utils`:

| Axis | Field | Type | Role |
|---|---|---|---|
| Filter | `IMessage.level` | `MessageLogLevel` (`quiet`/`detail`/`info`/`warning`/`error`) | Drives filtering via `shouldLog`. Lossless from a ts-utils logger. |
| Display | `IMessage.severity?` | `MessageSeverity` (`info`/`success`/`warning`/`error`) | Styling-only override; defaults via `deriveSeverityFromLevel`. `'success'` lives here. |

- The status-bar filter threshold is a `ReporterLogLevel`; the predicate is
  `Logging.shouldLog(message.level, threshold)`. The panel filters at `detail` granularity
  (the gap fix) via a new `Detail+` button.
- The `MessagesLogger`/`useLogReporter` bridge sets `level` straight through (lossless),
  leaving `severity` undefined for derivation. The old lossy `mapLogLevel` is removed.
- `createMessage`/`addMessage` are level-first with an `ICreateMessageOptions { severity?, action? }`
  bag. `'success'` is set explicitly (`addMessage('info', text, { severity: 'success' })`).

## Why

Identified during the observability journey (with `logging-observability`). The
`RetainingLogger` (shipped `5.1.0-31`) retains rich log levels server-side, but the panel's
`MessageSeverity` filter was coarser — it lacked `detail`/`quiet`, so the display half threw
away granularity the record half retained. This is the client-display completion of the
observability story (a soft-blocker for personaility's client-side observability) and a
classic cross-library semantic alignment: one canonical level vocabulary, not a parallel
weaker one.

## Design (fork a — two axes)

Locked with Erik 2026-05-26. See `brief.md` for the binding contract and `state.md` for the
full decision log. Key calls:

- **Two axes, not one.** `level` (filter) is orthogonal to `severity` (styling) — a
  `detail`-level success message is coherent.
- **`'success'` stays out of ts-utils.** It is a UI affordance with no log-level analog; it
  lives only on the ts-app-shell display axis. ts-utils `MessageLogLevel` stays clean.
- **Breaking change, no compat shims.** ts-app-shell is active-dev (no consumers outside this
  repo); in-repo consumers updated in the same PR (none needed source edits).

## Acceptance status

See `result.md` for the full checklist. Headlines: messages packlet **100% coverage on all 4
metrics** (57 tests); `rush build` clean across all downstream consumers; `rushx lint` clean;
`major` change file; LIBRARY_CAPABILITIES updated.

## Notes

- **No api-extractor regen** — `ts-app-shell` has no api-extractor config / `.api.md`
  (unlike `ts-res-ui-components`), so there was nothing to regenerate.

## Artifacts

- `brief.md` — the binding implementation contract.
- `state.md` — decision log, origin, history.
- `result.md` — what shipped, file list, acceptance status, handoff notes.
