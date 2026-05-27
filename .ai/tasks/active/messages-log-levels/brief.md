# Stream brief: `messages-log-levels` — ts-app-shell messages packlet S17 consumer feedback

**Status:** 🟢 ready to commission
**Integration branch:** `messages-log-levels` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Package surface:** `@fgv/ts-app-shell` `messages` packlet (`model.ts` + `StatusBar.tsx` + filter/bridge) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Scope note:** slug is `messages-log-levels` (the load-bearing finding + soft-blocker), but this stream carries the **full S17 consumer-feedback batch** — log-level alignment (§4) AND StatusBar UX fixes (§1–§3). All four touch the messages packlet (most touch `StatusBar.tsx`), so one stream avoids file-collision.

---

## Mission

Absorb personaility's S17 consumer feedback on the `@fgv/ts-app-shell` `messages` packlet (`StatusBar` used as an owner-only in-app observability panel at `5.1.0-31`). Two work clusters:

- **§4 — log-level vocabulary alignment** (the original driver): align the message/filter vocabulary to `@fgv/ts-utils`'s canonical log levels so the panel can filter at logger granularity — making the `RetainingLogger` → panel bridge lossless.
- **§1–§3 — StatusBar UX fixes**: bound the expanded-view height (so it stops taking over the viewport and the list actually scrolls), make dismiss discoverable, and default to collapsed.

**§4 — the gap.** The `messages` packlet defines its own `MessageSeverity = 'info' | 'success' | 'warning' | 'error'` and filters on it, but `StatusBar.initialFilterLevel` is a ts-utils `ReporterLogLevel` (`all|detail|info|warning|error|silent`). Two ends of the filter disagree inside ts-app-shell: the filter advertises `detail`, but **no `IMessage` can ever be `detail`** (the severity type can't represent it). Net effects personaility hit:
- A log-feed consumer mapping `MessageLogLevel → MessageSeverity` is forced to collapse `quiet`/`detail` into `info` — not a choice, it's what the type allows.
- `initialFilterLevel: 'info'` is therefore a **no-op** (info is already the floor) and can't hide `detail` chatter. personaility tried to filter its `GET /logs` poll noise through the panel; it couldn't, so it suppressed the access log server-side instead.

Two orthogonal concerns are conflated in `MessageSeverity`: verbosity (filter) + display styling (where `success` lives).

**Origin.** personaility S17 use of `StatusBar` as an owner-only observability panel (bottom-of-chrome, fed by `useMessages()` + a 5s `GET /logs` poll). Same observability journey as `logging-observability` (server half). `ts-app-shell` is **active-development** (new library, no external consumers) → breaking the messages packlet is cheap. Cross-library semantic alignment (L19 family).

---

## Locked design (fork (a) — two axes)

Separate the **filter axis** (canonical log level, from ts-utils) from the **display axis** (styling severity, where `success` lives):

```typescript
import { MessageLogLevel } from '@fgv/ts-utils';   // 'quiet'|'detail'|'info'|'warning'|'error'
// ts-app-shell already depends on ts-utils (useLogReporter/MessagesLogger bridge ILogger) — no new dep.

export interface IMessage {
  readonly id: string;
  /** Canonical log level — drives FILTERING. Lossless from a ts-utils logger. */
  readonly level: MessageLogLevel;
  /** Display styling override (color/icon/toast). Optional; defaults to a level→severity
   *  derivation. `'success'` lives here — set explicitly for UI-originated messages,
   *  never from a logger bridge. */
  readonly severity?: MessageSeverity;
  readonly text: string;
  readonly timestamp: number;
  readonly action?: IMessageAction;
}

export type MessageSeverity = 'info' | 'success' | 'warning' | 'error';   // unchanged — now styling-only
```

**Filtering** (`MessagesContext`): the panel's filter threshold becomes a `ReporterLogLevel`; a message is shown iff `shouldLog(message.level, threshold)`. Replaces the current `MessageSeverity`-based coarse filter. The filter UI exposes the full log-level granularity (at least `detail`/`info`/`warning`/`error`; `all`/`quiet` per the implementer's judgment on what the panel UX wants).

**Styling** (`StatusBar` / `Toast` / `DEFAULT_TOAST_CONFIG`): driven by `severity ?? deriveSeverityFromLevel(level)`. The derivation:
- `quiet` / `detail` / `info` → `'info'`
- `warning` → `'warning'`
- `error` → `'error'`
- (`'success'` is never derived — only set explicitly.)
`DEFAULT_TOAST_CONFIG` stays keyed by `MessageSeverity` (the styling axis).

**The logger bridge** (`MessagesLogger` / `useLogReporter`): when a ts-utils `ILogger` call comes through, create an `IMessage` with `level` = the log level **straight through** (this is the lossless part — `RetainingLogger` levels map 1:1), `text` = formatted message, `severity` = undefined (derived for styling). UI-originated `addMessage` paths set `severity` explicitly when they want `'success'`.

**`createMessage` reshape** (breaking, fine — active-dev): level-first, severity optional. Implementer picks the exact ergonomic shape, e.g.:
```typescript
createMessage(level: MessageLogLevel, text: string, options?: { severity?: MessageSeverity; action?: IMessageAction }): IMessage
```

**Filter becomes meaningful:** with messages carrying `level`, `StatusBar.initialFilterLevel` (a `ReporterLogLevel`) stops being a no-op — `initialFilterLevel: 'info'` now actually hides `detail`/`quiet` chatter (the personaility GET /logs poll-noise case). Verify a test covers "filter at `info` hides `detail` messages."

---

## StatusBar UX fixes (§1–§3) — locked

These rework `StatusBar.tsx`'s expanded view. §1 is the highest-value fix per personaility.

### §1 — bounded expanded height (the takeover fix)

Today the expanded view takes over the viewport with no consumer lever:
- **Mobile** (`isMobile`): expanded view is `fixed inset-0 z-40` — full-viewport. `position: fixed` escapes any parent, so a consumer can't cap it by wrapping `<StatusBar>`.
- **Desktop:** expanded panel has no height cap. The list region is `flex-1 overflow-y-auto` and toolbar/header are `shrink-0` (correct "fixed header + scrolling list" structure) — but it only scrolls if the panel is height-bounded, and it isn't, so the list grows until it fills the viewport. Wrapping externally in `maxHeight + overflow:auto` scrolls the *whole* component (carrying the `shrink-0` header/close-control out of view) — personaility tried this and reverted it.

**Fix:** add a prop-configurable max height (`maxExpandedHeight?: string`, default `~40vh`) applied to the expanded panel on **both** layouts, so the existing `flex-1 overflow-y-auto` list scrolls **within** the bounded panel while header/controls stay fixed. On mobile this means the expanded view becomes a bounded bottom-sheet (capped at `maxExpandedHeight`), NOT a `fixed inset-0` full takeover — so it no longer escapes consumer layout. This single fix resolves the takeover, makes the list scroll, AND keeps controls reachable.

### §2 — discoverable dismiss

Closing the expanded panel is non-obvious: mobile has a backdrop `onClick` (not discoverable); desktop's collapse affordance wasn't obvious. **Fix:** add a visible close/collapse control (explicit ✕ or chevron) on the expanded panel header, on **both** layouts, in addition to the backdrop tap. It lives in the `shrink-0` header so the §1 fix keeps it always reachable.

### §3 — collapsed-by-default (minor)

An always-mounted observability surface suits quiet/collapsed-by-default, expanding on an explicit control. **Fix:** default to collapsed. This is a behavior change — expose it as a prop (`defaultExpanded?: boolean`, default `false`) so a consumer can opt back into expanded-on-mount. Surface if the current default-expanded is relied on anywhere in-repo.

---

## In-scope

- `libraries/ts-app-shell/src/packlets/messages/model.ts` — `IMessage` (add `level`, make `severity` optional/styling-only), `createMessage`, `deriveSeverityFromLevel` helper, `DEFAULT_TOAST_CONFIG` (stays severity-keyed).
- `libraries/ts-app-shell/src/packlets/messages/MessagesContext.tsx` — filter threshold becomes `ReporterLogLevel`; filter predicate uses `shouldLog(message.level, threshold)`. `addMessage`/context-value shape updated.
- `libraries/ts-app-shell/src/packlets/messages/MessagesLogger.ts` + `useLogReporter.ts` — bridge sets `level` straight through from the log call; `severity` undefined (derived).
- `libraries/ts-app-shell/src/packlets/messages/StatusBar.tsx` — filter control exposes log-level granularity; styling via `severity ?? derive(level)`.
- `libraries/ts-app-shell/src/packlets/messages/Toast.tsx` — styling/dismiss via `severity ?? derive(level)`.
- `libraries/ts-app-shell/src/packlets/messages/index.ts` — barrel (re-export `MessageLogLevel`/`ReporterLogLevel` if the public surface needs them, or rely on consumers importing from ts-utils — no sibling re-export; pick per convention).
- `libraries/ts-app-shell/etc/ts-app-shell.api.md` — regenerated.
- In-repo consumers of the old `MessageSeverity`-based message API (`samples/testbed`, `samples/ai-image-gen-sample`, any others) — updated to the new shape. Find via `grep -rn 'MessageSeverity\|createMessage\|addMessage' --include=*.ts --include=*.tsx libraries/ samples/`.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — ts-app-shell messages entry: describe the level/severity two-axis model.
- `common/changes/@fgv/ts-app-shell/` — rush change file (`major` — breaking on the messages packlet, even though active-dev; the public `IMessage`/`createMessage`/filter shapes change).

## Out-of-scope

- Changing ts-utils's `MessageLogLevel` / `ReporterLogLevel` / `shouldLog` (canonical; consumed as-is — do NOT add `'success'` to the log-level union).
- The `RetainingLogger` / `MultiLogger` server-side primitives (already shipped).
- Non-messages packlets of ts-app-shell (top-bar, sidebar, url-sync, etc.).
- The consumer's `MessageLogLevel` → consumer-display-enum mapping (consumer concern).

## Acceptance criteria

**§4 — log-level alignment:**
- [ ] `IMessage.level: MessageLogLevel` drives filtering; `severity` is styling-only + optional, defaulting via `deriveSeverityFromLevel`.
- [ ] Panel filter threshold is a `ReporterLogLevel`; filter predicate uses `shouldLog`. Panel filters at `detail` granularity (the core gap fix); a test covers "filter at `info` hides `detail` messages" (the personaility poll-noise case — `initialFilterLevel` no longer a no-op).
- [ ] `MessagesLogger` / `useLogReporter` bridge sets `level` straight through (lossless from a ts-utils logger); `severity` derived for styling.
- [ ] `'success'` preserved as an explicit styling severity (UI-originated messages).

**§1–§3 — StatusBar UX:**
- [ ] `maxExpandedHeight?: string` prop (~40vh default); expanded panel bounded on BOTH layouts; the `flex-1 overflow-y-auto` list scrolls within the bounded panel; header/controls (`shrink-0`) stay fixed. Mobile expanded view is a bounded sheet, not `fixed inset-0` full takeover.
- [ ] Visible close/collapse control (✕ or chevron) on the expanded header, both layouts, in the fixed header region.
- [ ] `defaultExpanded?: boolean` (default `false` — collapsed-by-default); consumer can opt into expanded-on-mount.
- [ ] Tests cover: bounded-height list scroll, close control dismisses, default-collapsed mount, expanded-on-mount via prop.

**Both:**
- [ ] `rush build` full repo clean; `rushx lint` clean (separate gate); `rushx fixlint` before final commit.
- [ ] `rushx test` 100% coverage all 4 metrics in `@fgv/ts-app-shell`. (§4 coverage: filter at each level incl. `detail`; `shouldLog` threshold; `deriveSeverityFromLevel`; lossless bridge; explicit `success`; toast config. §1–§3 coverage: above.)
- [ ] api-extractor regenerated; rush change file `major`.
- [ ] All in-repo consumers updated (`samples/`, fixtures); `rush build` proves it.
- [ ] LIBRARY_CAPABILITIES updated (two-axis level/severity model + the new StatusBar props).
- [ ] No `any`; no unsafe casts; no `Result<void>`.
- [ ] `result.md` written; substrate migrated to `.ai/tasks/completed/2026-05/messages-log-levels/` with polished README, in the implementation PR (before the squash).

## Required reading

1. This brief.
2. `libraries/ts-app-shell/src/packlets/messages/` — all of it: `model.ts`, `MessagesContext.tsx`, `MessagesLogger.ts`, `useLogReporter.ts`, `StatusBar.tsx`, `Toast.tsx`, `index.ts`. Understand the current filter + bridge flow before changing it.
3. `libraries/ts-utils/src/packlets/logging/logger.ts` — `MessageLogLevel`, `ReporterLogLevel`, `shouldLog`, `ILogger` (the canonical vocabulary you're aligning to). Note `shouldLog`'s semantics (e.g. `'quiet'` only shows under `'all'`).
4. `CLAUDE.md` + `.ai/instructions/ACTIVE_DEVELOPMENT.md` (ts-app-shell is active-dev — breaking is cheap; no compat shims).
5. The `logging-observability` completed substrate (`.ai/tasks/completed/2026-05/logging-observability/`) + `.ai/notes/cross-repo-handoffs/logging-observability-*.md` — context for why the panel needs log-level granularity (the `RetainingLogger` it bridges).

## Skills to load

| When | Skill |
|---|---|
| Before any logger / diagnostic code | `/ts-utils-logging` |
| Before writing tests (incl. React component tests) | `/result-tests` |
| Before reaching for utility code | `/published-primitives-reflex` |

## Stop-and-surface

- A consumer of the messages packlet relies on `MessageSeverity`-as-filter in a way that doesn't map cleanly to the level/severity split — surface; the mapping may need a design note.
- The panel filter UX has an opinion about which levels to expose (`all`/`quiet` inclusion) that isn't obvious from the code — surface the UX question rather than guessing.
- `shouldLog`'s `'quiet'`/`'all'` edge semantics interact with the filter UI in a non-obvious way — surface.

## fgv-conventions pre-load (per L22)

- No sibling-package re-exports — import `MessageLogLevel`/`ReporterLogLevel`/`shouldLog` directly from `@fgv/ts-utils`.
- Do NOT pollute ts-utils's canonical `MessageLogLevel` with `'success'` — that's a ts-app-shell display concern; it stays on the styling axis.
- `ts-app-shell` is active-dev — break cleanly; no compat shims; update in-repo consumers in the same PR.
- `rushx lint` is a separate gate from `rushx build`.

## Branch + PR posture

- **Integration branch:** `messages-log-levels` (off `release`). Work targets it, NOT `release`.
- **Work branch stem:** `feat/messages-log-levels` (harness may suffix; record in state.md).
- **PR target:** `messages-log-levels`.
- **PR title:** `feat(ts-app-shell)!: align messages packlet to ts-utils log levels (breaking)`
- **Close:** orchestrator squash-merges `messages-log-levels` → `release` after gates pass + substrate migrated.
