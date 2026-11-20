# `ts-prompt-assist-observability` — Phase C result

**Phase C shipped:** 2026-06-04 via PR #456 → `ts-prompt-assist-observability` integration branch (cluster-close squash to `release` opened separately by the orchestrator).
**Workflow shape:** `design-triage-implement` on an integration branch.

---

## What shipped

Prompt-observability for `@fgv/ts-prompt-assist`, built on a new generic ring-buffer primitive in `@fgv/ts-utils`. Implements the locked Phase B triage contract (hybrid C-minimal + D; OQ-1…OQ-8 at their leans).

### `@fgv/ts-utils` — `RetainingRingBuffer<T extends { seq: number }>` (collections packlet)

A generic bounded most-recent-N ring with O(1) eviction (no `shift()` re-indexing), monotonic-`seq` cursor paging, and predicate filtering.

```ts
class RetainingRingBuffer<T extends IRetainedRecord> {
  constructor(params?: IRetainingRingBufferCreateParams);          // maxRecords default 1000, floored to a positive int
  push(record: T): T;                                              // caller mints seq; buffer retains/evicts
  query(query?: IRetainingRingBufferQuery<T>): ReadonlyArray<T>;   // { sinceSeq?, limit?, filter? }, oldest-first
  get lastSeq(): number;                                           // max seq pushed; preserved across clear()
  get size(): number; get records(): ReadonlyArray<T>; clear(): void;
}
```

A **pure** storage substrate — it does NOT assign `seq`/`timestamp`; the caller mints each record. Companion interfaces `IRetainedRecord`, `IRetainingRingBufferCreateParams`, `IRetainingRingBufferQuery` are top-level exports.

### `@fgv/ts-prompt-assist` — `observe` packlet

- **`IPromptObserver`** — single async `observe(record): Promise<Result<unknown>>` hook + optional `fireAndForget?` flag.
- **`IPromptObservationRecord`** — `phase`-discriminated union (`'resolve'` | `'json-output'` | `'free-text-output'`) over `IPromptObservationBase` + `IPromptResolveObservation` + `IPromptOutputObservation`.
- **`IPromptObservationQuery`** — schema-aware criteria (promptId, scope, qualifiers partial-match, outputKind, outcome, phase, safeguard presence/disposition, seq + timestamp range, escape-hatch predicate).
- **`PromptObservationStore`** — implements `IPromptObserver`, composes `RetainingRingBuffer<IPromptObservationRecord>`, exposes `query(criteria)`, `lastSeq`, `size`, `clear`, `create({ maxRecords? })`.
- **`IPromptLibraryCreateParams.observers?`** — additive DI field. `PromptLibrary._observe` fan-out fires once per public `resolve` / `resolveJsonOutput` / `resolveFreeTextOutput` call, **never** inside the re-entrant `_resolveInternal` (resource-binding inner resolves roll up under the outer record's `trace.resourceBindingResolutions[].innerTrace`).

## Locked semantics (as shipped)

- **Library-owned `seq` + `timestamp`** (single per-instance authority) — so a resolve record and its output record share a consistent `seq` across every observer, making `linkedResolveSeq` correlation work under multi-observer fan-out. (Phase C refinement of the Phase A buffer sketch; see `findings/inbox/2026-06-04-ring-buffer-seq-authority.md`.)
- **Observer errors never affect `resolve()`** — failed `Result`, throw, or rejection swallowed and logged to the injected `logger` at warn (`MultiLogger`-shaped). `fireAndForget: true` dispatches without awaiting.
- **Failure resolve records carry `error` only** (no trace/body) — OQ-4.
- **Two cross-linked records** per output call (resolve + output) via `linkedResolveSeq`; the output record does not duplicate the body — OQ-5/OQ-8.
- **`contentHash`** = CRC32 over the RFC 8785 canonical JSON string of `{ promptId, chain, qualifierContext, substitutions }` (best-effort; degrades to `''`, never throws).
- **`PromptObservationStore` is most-permissive** — stores body/rawOutput/substitutions verbatim; redaction + retention are deployment policy (wrap or substitute the observer).

## Files

| Package | Files |
|---|---|
| `@fgv/ts-utils` | `src/packlets/collections/retainingRingBuffer.ts` (new), `collections/index.ts`, `src/index.ts` (top-level exports), `src/test/unit/collections/retainingRingBuffer.test.ts` (new), `etc/ts-utils.api.md`, `minor` change file |
| `@fgv/ts-prompt-assist` | `src/packlets/observe/{types,promptObservationStore,index}.ts` (new), `src/packlets/resolve/promptLibrary.ts` (observer wiring), `src/index.ts`, `src/test/unit/observe/{promptObservationStore,observability}.test.ts` (new), `etc/ts-prompt-assist.api.md`, `minor` change file |
| docs | `.ai/instructions/LIBRARY_CAPABILITIES.md` (both library entries) |

## OQ-3 evidence (deterministic, fake timers)

- **Awaited default (positive):** a 60ms awaited observer keeps `resolve()` pending until its faked timer fires; settles only after `advanceTimersByTimeAsync(60)`.
- **Fire-and-forget (negative):** a `fireAndForget` observer lets `resolve()` settle without advancing timers; it records only after the timer fires.
- **Mixed:** awaited (50ms) blocks resolve; detached (200ms) does not.

## Review

- **Layer 1 — `code-reviewer`** (run on the cumulative diff *before* coverage closure, per L37): 0 P1, 3 P2, 3 P3. P2-2 (two `ae-unresolved-link` warnings) fixed by promoting the buffer companion interfaces to top-level; P3-1 (misleading `onFailure`) replaced with `isFailure()`; remainder verified/dispositioned.
- **Layer 2 — Copilot** (implementer-driven): stopped at **round 2 on diminishing returns**. Round 1 = 10 substantive comments (contentHash doc/impl drift → impl now canonical-then-CRC32; "pay nothing when no observers" invariant; flaky wall-clock tests → fake timers; maxRecords doc), all resolved. Round 2 = 1 doc-clarification nitpick (`durationMs` semantics), resolved. No round 3 requested.

## Gates (all passed)

- `rushx build` / `rushx lint` (clean) / `rushx fixlint` — both libraries.
- `rushx test`: `@fgv/ts-utils` 1594 tests (`RetainingRingBuffer` 100%); `@fgv/ts-prompt-assist` 228 tests, **100% statements / branches / functions / lines** (observe packlet + `promptLibrary.ts`).
- api-extractor reports regenerated for both; `minor` change files for both.
- No `any`; no `Result<void>`; Result-pattern conformance preserved.

## Scope discipline (held)

No source/test changes outside `@fgv/ts-utils` + `@fgv/ts-prompt-assist` (+ task substrate, docs, change files). No `RetainingLogger` refactor, no `MultiPromptObserver`, no partial-trace-on-failure — all deferred/declined per the triage locks.

## Fast-follow handoff

`retaining-logger-ring-buffer-refactor` (committed brief, queued) brings `RetainingLogger` onto `RetainingRingBuffer<ILogRecord>`, retiring its duplicated ring — the existing-second-consumer that backs the Q1 falsifiability argument. **Read `findings/inbox/2026-06-04-ring-buffer-seq-authority.md` first:** the buffer is a pure seq-ring, so `RetainingLogger` keeps its own seq/clock ownership and just delegates ring storage + `getRecords` paging — `etc/ts-utils.api.md` must stay a no-op on the public `RetainingLogger` surface. Commission after this cluster closes to `release`.

## PRs

| Phase | PR | Status |
|---|---|---|
| A — design spike | #455 | merged to integration |
| B — triage | (commit `34ef9443`) | on integration |
| C — implementation | #456 | on integration; cluster-close → `release` pending |
