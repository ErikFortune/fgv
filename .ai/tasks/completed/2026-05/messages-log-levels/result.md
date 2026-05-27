# result: `messages-log-levels`

**Outcome:** ✅ complete — single breaking-change PR on `@fgv/ts-app-shell` `messages` packlet.
**PR:** [#421](https://github.com/ErikFortune/fgv/pull/421) onto `messages-log-levels`.
**Integration branch:** `messages-log-levels` (work branch `claude/gracious-pasteur-Gpr4c`).
**Date:** 2026-05-27

---

## What shipped

Aligned the `@fgv/ts-app-shell` `messages` packlet to `@fgv/ts-utils`'s canonical
log-level vocabulary, splitting the conflated `MessageSeverity` enum into two
orthogonal axes:

- **Filter axis** — `IMessage.level: MessageLogLevel` (`'quiet'|'detail'|'info'|'warning'|'error'`).
  The status-bar filter threshold is now a `ReporterLogLevel`, and the predicate is
  `Logging.shouldLog(message.level, threshold)`. The panel can filter at `detail`
  granularity — the core gap fix. A new `Detail+` filter button exposes it.
- **Display axis** — `IMessage.severity?: MessageSeverity` (`'info'|'success'|'warning'|'error'`),
  optional and styling-only. When absent, styling derives from the level via
  `deriveSeverityFromLevel`. `'success'` lives only here — never derived, set explicitly.

The `MessagesLogger` / `useLogReporter` bridge now sets `level` straight through from
the log call (lossless — `RetainingLogger` levels map 1:1), leaving `severity` undefined
so display styling is derived. The old lossy `mapLogLevel` (which folded `detail`→`info`
and dropped `quiet`) is gone; threshold suppression is handled upstream by `LoggerBase`.

`createMessage` / `addMessage` are now level-first with an options bag
(`ICreateMessageOptions { severity?, action? }`). `DEFAULT_TOAST_CONFIG` stays keyed by
the styling `MessageSeverity`.

## Files changed

- `libraries/ts-app-shell/src/packlets/messages/model.ts` — `IMessage` (add `level`, make
  `severity` optional/styling-only), `deriveSeverityFromLevel`, `ICreateMessageOptions`,
  `createMessage` reshape.
- `…/messages/MessagesContext.tsx` — `addMessage` level-first signature.
- `…/messages/MessagesLogger.ts` — lossless bridge; `mapLogLevel` removed.
- `…/messages/StatusBar.tsx` — `shouldLog`-based filter; `Detail+` filter; counts + row +
  copy styling via `effectiveSeverity` (severity ?? derived); copy-all tags by canonical level.
- `…/messages/Toast.tsx` — styling via `severity ?? deriveSeverityFromLevel(level)`.
- `…/messages/index.ts` — export `deriveSeverityFromLevel`, `ICreateMessageOptions`.
- `…/src/test/unit/messages/*.test.ts(x)` — new (57 tests; 100% on the messages packlet).
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — new "Application shells (React)" section
  documenting the two-axis model.
- `common/changes/@fgv/ts-app-shell/messages-log-levels_2026-05-27-00-00.json` — `major`.

## Acceptance gate status

- [x] `level` drives filtering; `severity` styling-only + optional + derived; panel filters at `detail`.
- [x] Logger bridge sets `level` losslessly; `'success'` preserved as explicit styling.
- [x] `rush build` clean (full downstream incl. `testbed` + `ai-image-gen-sample`); `rushx lint` clean (exit 0); `rushx fixlint` run before final commit (no changes).
- [x] `rushx test` — **100% across all 4 metrics on the messages packlet** (`model.ts`, `MessagesContext.tsx`, `MessagesLogger.ts`, `useLogReporter.ts`, `StatusBar.tsx`, `Toast.tsx`). Covers: filter at each level incl. `detail`; `shouldLog` threshold; `deriveSeverityFromLevel`; lossless logger bridge; explicit `success` styling; toast config by derived/explicit severity.
- [x] `major` rush change file; all in-repo consumers updated (build proves it — no source edits needed).
- [x] LIBRARY_CAPABILITIES updated.
- [x] No `any`; no unsafe casts; no `Result<void>`.
- [x] result.md + substrate migrated to `completed/2026-05/messages-log-levels/`.

## Notes / deviations

- **Copilot review (PR #421) resolved.** Two test-only nits: an implicitly-`any` `let returned;`
  intermediate (now typed `ReturnType<IMessagesContextValue['addMessage']> | undefined`) and a
  `querySelector('button') as HTMLButtonElement` cast that masked `null` (now a null-check matching
  the `expand()` helper). No production-code changes; coverage stayed 100%.
- **No api-extractor regen.** Unlike `ts-res-ui-components`, `ts-app-shell` has **no
  `config/api-extractor.json` and no `etc/*.api.md`** — api-extractor is not wired up for
  this library, so there was nothing to regenerate. (The brief listed it as in-scope on the
  assumption it existed.)
- **Consumers needed no source edits.** The only in-repo consumers of the messages packlet
  (`samples/testbed`, `samples/ai-image-gen-sample`) use it via `MessagesProvider` /
  `useLogReporter` / `StatusBar` / `useMessages` — none call `createMessage` /
  `addMessage(severity, …)` directly or reference `MessageSeverity`. The breaking signature
  change is invisible to them; `rush build --from @fgv/ts-app-shell` (16 ops) confirms.
- **Filter UX decision (stop-and-surface item):** exposed `All`, `Detail+`, `Info+`, `Warn+`,
  `Error`. `silent` is omitted (a panel "show nothing" toggle is not useful); `quiet`-level
  messages surface only under `All`, matching `shouldLog`'s documented edge semantics. This
  is a reasonable default; revisit if a consumer wants a `quiet`-specific toggle.

## For the personaility observability handoff

The client-display half now speaks the same level vocabulary as the `RetainingLogger`
record half. A consumer wiring a `RetainingLogger` (or any ts-utils `ILogger`) through
`MessagesLogger`/`useLogReporter` gets lossless level fidelity in the panel, filterable down
to `detail`. Consumers map their own display enum from `IMessage.level`; `'success'` toasts
are set explicitly via `addMessage('info', text, { severity: 'success' })`.

---

## Amendment — StatusBar UX (§1–§3)

Landed as a second PR onto the same `messages-log-levels` integration branch (post-#421;
squashes to `release` together). Addresses personaility's S17 StatusBar feedback.

- **§1 bounded expanded height.** New `maxExpandedHeight?: string` prop (default `'40vh'`)
  bounds the expanded panel on **both** layouts via an inline `style={{ maxHeight }}`. The
  panel is a `flex flex-col`; the header/filter controls are `shrink-0` and the message list
  is `flex-1 min-h-0 overflow-y-auto`, so the list scrolls within the bound while controls
  stay fixed. The mobile expanded view is now an **in-flow bounded sheet** (`relative z-50`,
  with the dimming `fixed inset-0` backdrop retained for tap-to-dismiss) — no longer a
  `fixed inset-x-0 … max-h-[70vh]` panel that escapes consumer layout.
- **§2 discoverable dismiss.** A labelled `✕` collapse control (`XMarkIcon`,
  `aria-label="Collapse log panel"`) sits in the `shrink-0` expanded header on both layouts,
  so §1's bounding keeps it reachable. The mobile backdrop tap is retained.
- **§3 collapsed-by-default.** New `defaultExpanded?: boolean` (default `false`). The sole
  in-repo consumer (`samples/testbed`) passes neither new prop and relied on the existing
  always-collapsed-on-mount behaviour, so default-false is a no-op for it — no breakage.

**Mobile bounded-sheet rework.** Went cleanly. The only `fixed` element is now the backdrop;
the sheet itself is in document flow (`relative z-50 bg-surface shadow-xl rounded-t-lg`),
painting above the `z-40` backdrop within the StatusBar's stacking context. Positioning of
the StatusBar container itself remains the consumer's responsibility (the point of removing
the `fixed` panel). No conflict surfaced with the testbed chrome; flag to personaility S17 if
their chrome relied on the old fixed-overlay z-ordering of the *panel* (the backdrop overlay
behaviour is unchanged).

**Tests / gates.** `StatusBar.test.tsx` grew to 28 tests (added §1 bound + custom height +
list-scroll + mobile-in-flow; §2 close-control dismiss on both layouts; §3 default-collapsed +
expanded-on-mount). Messages packlet stays **100% on all four metrics**. `rush build` clean
across all downstream consumers; `rushx lint` clean; `rushx fixlint` run. Change file extended
with a `minor` sibling entry; LIBRARY_CAPABILITIES updated with the new `StatusBar` props.
