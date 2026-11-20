# Stream brief: `prompt-assist-screeners`

**Status:** 🟢 ready to commission
**Branch base:** `release`
**Workflow shape:** single-PR feature (breaking change; no integration branch)
**Package surface:** `@fgv/ts-prompt-assist` (safety packlet) + `.ai/instructions/LIBRARY_CAPABILITIES.md` + in-repo consumers of the old fields

---

## Mission

Replace `@fgv/ts-prompt-assist`'s safety pipeline — currently regex-only, synchronous, closed-kind — with a **pluggable screener model**. Consumers wire arbitrary screening logic (async ML classifiers, network calls, custom rule engines) into prompt resolution. **Breaking changes allowed; no compat shims.**

**Origin / dependency note:** this is the upstream gap-fix for the `local-ai-exploration` cluster's B-3 scenario (local classifier → `IPromptSafetyPolicy` backend). B-3 cannot be built against today's regex-only sync surface. Per the gap-then-fix tenet, we fix the primitive here first, ship to `release`, then `local-ai-exploration` absorbs it (merge `release` → integration) before B-3. This stream is independent of the local-ai experiment's outcome — it benefits any consumer wanting custom screeners.

---

## Problem with the current shape

- `IPromptSafetyPolicy` is a config bag for one specific screener (regex). New screening strategies have nowhere to plug in.
- `applySafeguards` is synchronous; ML classifiers and remote-call screeners are inherently async.
- `SafeguardFindingKind` is a closed union; custom screeners can't emit their own kinds.
- `ISafeguardFinding.detail` is a string; structured per-finding metadata (e.g. per-label classifier scores) has to be stringified.
- Disposition (warn vs reject) is policy-global instead of per-finding.

---

## Required new shape (locked)

### 1. Pluggable screener interface

```typescript
export interface IScreenerContext {
  readonly slot: IPromptSlot;
  readonly source?: string;             // slot source identifier
  readonly promptId: PromptId;
  readonly value: string;               // post-binding, pre-render value
}

export interface IScreener {
  readonly name: string;                // for traceability / finding attribution
  readonly screen: (ctx: IScreenerContext) => Promise<Result<ReadonlyArray<ISafeguardFinding>>>;
  // Returns zero, one, or multiple findings. Empty array = no concerns.
  // May be sync internally; just returns a resolved promise. Async signature is universal.
}
```

The `value` is **post-binding, pre-render** — the screener sees the substituted slot content before Mustache templating. Source-aware skipping moves *into* the screener (it has `source` in context) — replaces the policy-level `screenedSources`.

### 2. Open finding kinds

```typescript
export type SafeguardFindingKind = BuiltInFindingKind | (string & {});
```

`BuiltInFindingKind` is the typed union for built-ins (`'suspicious-pattern'`, `'screening-skipped'`, `'enforced-override-ignored'`, etc. — preserve the existing built-in kinds). `string & {}` allows custom screeners to emit arbitrary kinds while keeping autocomplete on built-ins.

### 3. Structured finding metadata

```typescript
export interface ISafeguardFinding {
  readonly kind: SafeguardFindingKind;
  readonly disposition: SafeguardDisposition;   // 'reject' | 'warn' | 'info'
  readonly detail: string;                       // human-readable (existing)
  readonly metadata?: Readonly<Record<string, unknown>>;  // NEW: structured per-finding data
  readonly screener?: string;                    // NEW: emitting screener's name
  // ...preserve any existing fields (slotName, source, etc. — verify against current shape)
}
```

### 4. Policy as a screener list

```typescript
export interface IPromptSafetyPolicy {
  readonly screeners?: ReadonlyArray<IScreener>;
  // DROP entirely: suspiciousPatterns, screenedSources, onSuspicious
  // KEEP: defaultMaxLength (length-cap), antiJailbreakPreface (post-render)
}
```

Length-cap and `antiJailbreakPreface` **stay policy-level primitives** — they're structurally different (pre-screen and post-render respectively), not converted to screeners. Do not fold them into the screener model.

### 5. The regex screener becomes a built-in `IScreener` factory

```typescript
export function createPatternScreener(options: {
  patterns: ReadonlyArray<RegExp>;
  onMatch: SafeguardDisposition;   // 'warn' | 'reject' etc.
  // possibly: screenedSources allowlist (the source-aware skip the screener now owns)
}): IScreener;
```

- Ships the existing regex semantics **including lastIndex reset between values** (the `g`/`y`-flag leak prevention).
- Consumers wanting today's behavior compose it explicitly: `screeners: [createPatternScreener({ patterns, onMatch: 'reject' })]`.
- **No magic config-to-screener translation.** The dropped policy fields become this factory's args.

### 6. Async pipeline

- `applySafeguards` becomes `async function applySafeguards(...): Promise<Result<ISafeguardResult>>`.
- Caller in `PromptLibrary._renderResolved` awaits it.
- Screeners run **sequentially in declaration order** so traces are deterministic.
- A `reject` finding from any screener **short-circuits** the rest (current behavior for regex screener with `onSuspicious: 'reject'`).
- A screener returning `fail()` (operational failure, not a finding) propagates as a resolve failure with context.

### 7. Disposition handling (per-finding)

- Any finding with `disposition: 'reject'` → resolve fails with combined detail.
- `'warn'` and `'info'` findings always land in `trace.safeguardFindings` and never fail the resolve.
- Matches today's semantics but lifts the decision from policy to finding.

---

## Scope boundary (state explicitly; prevents over-generalization)

`IScreener` is the **per-slot-value, pre-render** screening point — one `screen` call per slot value, before Mustache templating. **Whole-prompt / post-render screening** (e.g. "classify the fully-assembled prompt for injection") is a *different* mechanism, structurally like `antiJailbreakPreface` (which stays policy-level). Do NOT try to make `IScreener` serve both screening points. If a future screener wants whole-prompt screening, that's a separate post-render hook — out of scope here.

---

## Acceptance criteria

- [ ] `IScreener` + `IScreenerContext` exported from the safety packlet with the locked shapes above.
- [ ] `createPatternScreener` exported; ships the existing regex semantics (including lastIndex reset between values).
- [ ] `IPromptSafetyPolicy.screeners` replaces `suspiciousPatterns` / `screenedSources` / `onSuspicious` (those fields dropped). `defaultMaxLength` + `antiJailbreakPreface` retained.
- [ ] `applySafeguards` is async; awaited from `_renderResolved`.
- [ ] `ISafeguardFinding` gains optional `metadata` + `screener` fields.
- [ ] `SafeguardFindingKind` is open (`BuiltInFindingKind | (string & {})`).
- [ ] All existing pattern-screener tests continue to pass against `createPatternScreener`.
- [ ] New tests cover: multi-screener ordering; async screener with delayed Result; screener failure (`fail()`) propagates correctly; reject short-circuits subsequent screeners; multiple findings from one screener.
- [ ] 100% coverage all 4 metrics in `@fgv/ts-prompt-assist`.
- [ ] Rush change file (`type: major` since breaking).
- [ ] `LIBRARY_CAPABILITIES.md` prompt-assist entry rewritten — the existing entry mentions `suspiciousPatterns`/`screenedSources`/`onSuspicious` explicitly; describe the new screener model instead.
- [ ] All in-repo consumers of the old fields updated (`samples/`, any `__test__` / fixture usage, README snippets).
- [ ] api-extractor regenerated.
- [ ] No `any` types; no manual casts beyond `@ts-expect-error` test assertions; no `Result<void>`.
- [ ] `result.md` written; substrate migrated to `.ai/tasks/completed/<YYYY-MM>/prompt-assist-screeners/` with polished README as part of the PR.

## Out of scope

- The local-classifier screener itself — lives in the testbed scenario (B-3 of `local-ai-exploration`).
- LLM-based screening (e.g. ask GPT-4 "is this prompt injection") — separate scenario.
- Screener result caching — application concern.
- Parallel screener execution — sequential is simpler; traces easier to read; revisit if perf matters.
- Length-cap and `antiJailbreakPreface` — stay policy-level primitives; not converted to screeners.
- Whole-prompt / post-render screening hook — separate future mechanism (see scope boundary).

## Required reading

1. This brief.
2. Current safety packlet in `libraries/ts-prompt-assist/src/packlets/` — find via `grep -rl 'applySafeguards\|IPromptSafetyPolicy\|SafeguardFinding' libraries/ts-prompt-assist/src/`. Understand the current `applySafeguards` flow, the `IPromptSafetyPolicy` shape, the `ISafeguardFinding` shape, and `_renderResolved`'s call into the pipeline.
3. `CLAUDE.md` + `.ai/instructions/CODING_STANDARDS.md` (Result pattern; async chaining; no `Result<void>`).
4. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `ts-prompt-assist` is an active-development surface; breaking changes are explicitly cheap. No compat shims wanted.

## Skills to load

| When | Skill |
|---|---|
| Before writing the async pipeline | `/result-pattern` (async chaining: `thenOnSuccess`, `captureAsyncResult`) |
| Before writing tests | `/result-tests` |
| Before writing/modifying converters or validators | `/type-safe-validation` |

## Stop-and-surface

- The current `ISafeguardFinding` has fields the brief's sketch doesn't preserve — surface the actual current shape before dropping anything.
- `_renderResolved`'s call site makes the sync→async conversion ripple wider than the safety packlet (e.g. forces other methods async) — surface the ripple; it may be expected but worth confirming.
- The lastIndex-reset semantics in the current regex screener are subtler than "reset between values" — surface if the existing test suite reveals nuance.

## Branch + PR posture

- **Work branch stem:** `feat/prompt-assist-screeners` (harness may suffix).
- **PR target:** `release` (single-PR feature; no integration branch).
- **PR title:** `feat(ts-prompt-assist)!: pluggable safety screeners (breaking)`
- **PR body:** the locked new shape; breaking-change callout; migration note (how a consumer reproduces today's behavior via `createPatternScreener`); pre-PR gate checklist.

## Downstream

After merge to `release`: `local-ai-exploration` absorbs via `merge release → local-ai-exploration` before B-3. B-3's classifier screener then implements `IScreener` directly.
