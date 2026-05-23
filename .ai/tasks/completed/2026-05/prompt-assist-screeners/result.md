# Stream result: `prompt-assist-screeners`

**Status:** ✅ complete — implementation landed
**Branch:** `claude/kind-fermat-sn50P`
**PR:** [#407](https://github.com/ErikFortune/fgv/pull/407) → `release` (single-PR breaking feature)
**Change file:** `common/changes/@fgv/ts-prompt-assist/prompt-assist-screeners_2026-05-23-00-00.json` (`type: major`)

---

## What shipped

The `@fgv/ts-prompt-assist` safety pipeline moved from a regex-only, synchronous,
closed-kind model to a **pluggable async screener model**. Consumers can now wire
arbitrary per-slot-value screening logic (ML classifiers, remote calls, custom rule
engines) into prompt resolution.

### The seven required changes

1. **`IScreener` + `IScreenerContext` exported** from the safety surface
   (`types/safety.ts`, re-exported from the package root).
2. **`SafeguardFindingKind` is open**: `BuiltInFindingKind | (string & {})`.
   `BuiltInFindingKind` preserves the four built-in kinds
   (`'max-length'`, `'suspicious-pattern'`, `'screening-skipped'`,
   `'enforced-override-ignored'`).
3. **`ISafeguardFinding` gains** optional `metadata?: Readonly<Record<string, unknown>>`
   and `screener?: string`. All existing fields (`slot`, `kind`, `disposition`,
   `detail`) preserved.
4. **`IPromptSafetyPolicy.screeners?: ReadonlyArray<IScreener>`** replaces
   `suspiciousPatterns` / `screenedSources` / `onSuspicious` (all dropped).
   `defaultMaxLength` and `antiJailbreakPreface` retained as policy-level primitives.
5. **`createPatternScreener({ patterns, onMatch, screenedSources?, name? })`**
   built-in factory ships today's regex semantics, including the `lastIndex` reset
   between values. Source-aware skipping (was policy-level `screenedSources`) is now
   the screener's own concern via the factory arg; omitting it screens every sourced slot.
6. **`applySafeguards` is async** (`Promise<Result<ISafeguardResult>>`), awaited from
   `PromptLibrary._renderResolved`. Screeners run sequentially in declaration order; a
   `reject` finding short-circuits the remaining screeners; a screener returning `fail()`
   propagates as a resolve failure with context.
7. **Per-finding disposition**: any `'reject'` fails the resolve with combined detail;
   `'warn'` / `'info'` always land in `trace.safeguardFindings` and never fail.

### Scope boundary held

`IScreener` is strictly the per-slot-value, pre-render screening point. Length-cap and
`antiJailbreakPreface` stayed policy-level primitives (not converted to screeners).
Whole-prompt / post-render screening remains out of scope (a separate future mechanism).

---

## Decisions worth recording

- **`descriptor.safeguards.skipInjectionScreening` preserved at the engine level.**
  The locked `IScreenerContext` carries no descriptor, so a screener cannot honour a
  descriptor-level opt-out. Rather than silently dropping an authored safety control,
  the engine keeps honouring it: when `true` it skips **all** screeners for the
  descriptor and emits a `'screening-skipped'` info finding per slot with a declared
  `source` (matching prior per-slot behaviour). This generalises the old
  "skip the one regex screener" to "skip all screeners", which is the only coherent
  reading once screening is pluggable.
- **`createPatternScreener` `screenedSources` is optional with screen-all default.**
  The pre-pluggable policy defaulted `screenedSources` to `[]` (screen nothing). The
  factory instead screens every sourced slot when `screenedSources` is omitted, which
  is the intuitive standalone-screener default and matches the brief's
  `createPatternScreener({ patterns, onMatch })` migration example. To reproduce the
  old gating, pass the allowlist explicitly.
- **Engine kept internal.** `applySafeguards` / `ISafeguardResult` remain `@internal`
  and are intentionally **not** surfaced from the package root (the root selectively
  re-exports only `createPatternScreener` + `IPatternScreenerOptions`); `IScreener` /
  `IScreenerContext` / finding types are public via the `types` packlet. This avoids
  an `ae-internal-missing-underscore` api-extractor warning while keeping the
  cross-packlet import (resolve → safeguards) on the packlet index per the
  `@rushstack/packlets/mechanics` rule.

---

## Stop-and-surface resolutions

- **Current `ISafeguardFinding` shape.** The brief sketch referenced `slotName` /
  `source`; the actual shape uses `slot` (a `SlotName`) with no `source` field. Both
  preserved exactly; `metadata` + `screener` added additively.
- **sync→async ripple.** Converting `applySafeguards` to async forced two `.onSuccess`
  calls in `PromptLibrary._resolveOnce` to become `.thenOnSuccess(async …)` and made
  `_renderResolved` async. The ripple was fully contained within `_resolveOnce` (already
  async); no public method signature changed. Confirmed expected.
- **`lastIndex` reset semantics.** The existing test proves the reset by matching the
  same stateful `/…/g` pattern against two consecutive slot values; `createPatternScreener`
  reproduces the per-`.test()` reset verbatim.

---

## Acceptance gates

| Gate | Result |
|---|---|
| `rush build` (full repo) | ✅ clean |
| `rushx build` (@fgv/ts-prompt-assist) | ✅ clean |
| `rushx lint` (separate gate) | ✅ clean |
| `rushx fixlint` run before final commit | ✅ |
| `rushx test` — 100% coverage all 4 metrics | ✅ (189 tests; safeguards packlet 100%) |
| Existing pattern-screener tests pass against `createPatternScreener` | ✅ |
| New tests (multi-screener ordering; async/delayed; `fail()` propagation; reject short-circuit; multi-finding) | ✅ |
| api-extractor regenerated | ✅ `etc/ts-prompt-assist.api.md` |
| Rush change file `type: major` | ✅ |
| `LIBRARY_CAPABILITIES.md` prompt-assist entry rewritten | ✅ |
| In-repo consumers of dropped fields updated (tests, README) | ✅ (no `samples/`; no downstream package consumers) |
| No `any`; no unsafe casts; no `Result<void>` | ✅ |

---

## Post-review hardening (PR #407 Copilot review, 2 rounds)

- **Screener boundary** — `runScreeners` now wraps `screener.screen(ctx)` in
  `captureAsyncResult`, so a consumer screener that throws or returns a rejected
  promise becomes a contextual `Result.fail` (`screener '<name>' failed on slot
  '<slot>': …`) on the same path as an explicit `fail()`, rather than escaping the
  Result pipeline. Covered by a throw/reject test.
- **Reject message** — the engine's rejection message dropped its `slot '<name>'`
  prefix; built-in finding details already carry `slot '<name>': …`, so the slot now
  appears once (`prompt '<id>': screener '<name>' rejected: <detail>; …`).
- **Empty-string values** — kept today's behavior (a merged slot value that is an
  empty *string* is still screened — a screener may legitimately flag blank content)
  and corrected the misleading "non-empty slot value" wording in the docs to "merged
  slot value". The Copilot thread suggesting a `value.length === 0` skip was left open
  intentionally (behavior change beyond the brief's "reproduce today's behavior").
- **`onMatch` doc** — `createPatternScreener.onMatch` doc now states it carries any
  `SafeguardDisposition` (incl. `'info'`), matching its type.
- **Test determinism** — replaced a wall-clock `setTimeout` in the async-screener test
  with a microtask boundary (`await Promise.resolve()`).

---

## Downstream note (for B-3 / `local-ai-exploration`)

The shipped `IScreener` shape is exactly the locked brief shape:

```typescript
interface IScreenerContext { slot: IPromptSlot; source?: string; promptId: PromptId; value: string; }
interface IScreener { name: string; screen: (ctx) => Promise<Result<ReadonlyArray<ISafeguardFinding>>>; }
```

A local-classifier screener (B-3) implements `IScreener` directly: emit
`'reject'` to block, `'warn'`/`'info'` to annotate, and attach per-label scores via
the new `metadata` field. The context does **not** carry the descriptor — if B-3 needs
descriptor-level gating, use the engine's `descriptor.safeguards.skipInjectionScreening`
or gate inside the screener via `ctx.source`.
