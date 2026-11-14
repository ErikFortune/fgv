# Stream brief: `messages-log-levels`

**Status:** 🟢 ready to commission
**Integration branch:** `messages-log-levels` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Package surface:** `@fgv/ts-app-shell` `messages` packlet + `.ai/instructions/LIBRARY_CAPABILITIES.md`

---

## Mission

Align `@fgv/ts-app-shell`'s `messages` packlet to `@fgv/ts-utils`'s canonical log-level vocabulary so the message panel can filter at the same granularity a ts-utils logger records — making the `RetainingLogger` → panel bridge lossless. The display half of the observability story should speak the same vocabulary as the record half.

**The gap.** The `messages` packlet defines its own `MessageSeverity = 'info' | 'success' | 'warning' | 'error'` and filters on it. That's two orthogonal concerns conflated into one weak enum:
- It **lacks `detail`/`quiet`** — so a logger logging at `detail` can't be represented or filtered at the panel; the panel filter is coarser than the logger's `shouldLog`. The `RetainingLogger` (shipped 2026-05-26 in `5.1.0-31`) retains rich levels, but the display half throws that granularity away.
- It **has `success`** — a legitimate UI styling affordance (a green "saved!" toast) with no log-level analog; set explicitly by consumers, never from a logger bridge.

**Origin.** Gap identified during the observability journey (same journey as `logging-observability`). `ts-app-shell` is on the **active-development** list (new library, no consumers outside this repo) → breaking changes to the messages packlet are explicitly cheap. Classic cross-library semantic alignment: one canonical level vocabulary, not a parallel weaker one (L19 family).

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

- [ ] `IMessage.level: MessageLogLevel` drives filtering; `severity` is styling-only + optional, defaulting via `deriveSeverityFromLevel`.
- [ ] Panel filter threshold is a `ReporterLogLevel`; filter predicate uses `shouldLog`. Panel can filter at `detail` granularity (the core gap fix).
- [ ] `MessagesLogger` / `useLogReporter` bridge sets `level` straight through (lossless from a ts-utils logger); `severity` derived for styling.
- [ ] `'success'` preserved as an explicit styling severity (UI-originated messages).
- [ ] `rush build` full repo clean; `rushx lint` clean (separate gate); `rushx fixlint` before final commit.
- [ ] `rushx test` 100% coverage all 4 metrics in `@fgv/ts-app-shell`. Cover: filter at each level incl. `detail`; `shouldLog`-based threshold; `deriveSeverityFromLevel` mapping; logger-bridge sets level losslessly; explicit `success` styling; toast config by derived/explicit severity.
- [ ] api-extractor regenerated; rush change file `major`.
- [ ] All in-repo consumers updated (`samples/`, fixtures); `rush build` proves it.
- [ ] LIBRARY_CAPABILITIES updated.
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
