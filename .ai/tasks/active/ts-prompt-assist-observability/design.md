# `ts-prompt-assist-observability` — Phase A design spike

**Phase:** A (design-only; no implementation)
**Stream:** `ts-prompt-assist-observability`
**Author:** Phase A agent, 2026-06-04
**Inputs read:** `libraries/ts-utils/src/packlets/logging/` (entire packlet), `libraries/ts-prompt-assist/src/packlets/{resolve/promptLibrary.ts, types/trace.ts, types/output.ts, types/descriptor.ts, types/qualifiers.ts, types/storeEvents.ts}`, `.ai/instructions/{LIBRARY_CAPABILITIES.md, CODING_STANDARDS.md, ACTIVE_DEVELOPMENT.md}`, `docs/FUTURE.md`.

This document answers the four prioritized questions in the brief, sketches the two load-bearing semantics, and names the open questions for Phase B triage. It recommends nothing be implemented in Phase A.

---

## TL;DR recommendations

| Q | Recommendation |
|---|---|
| **Q1 — substrate** | **Hybrid C-minimal + D.** Extract the ring/seq/since-cursor machinery from `RetainingLogger` into a generic `RetainingRingBuffer<T>` in `@fgv/ts-utils`; build a schema-aware `PromptObservationStore` (Option D) in `@fgv/ts-prompt-assist` that *composes* it. Reject pure-A, pure-B (log-funnel), and full-C (generic observer + generic filter API). |
| **Q2 — firing surface** | One fire per **public** `resolve()`; one *additional* fire per `resolveJsonOutput()` / `resolveFreeTextOutput()` (the output round-trip). Never fire inside `_resolveInternal` — nested resource-binding resolves roll up under the outer record's `trace`. |
| **Q3 — record shape** | `IPromptObservationRecord` as a `phase`-discriminated union (resolve vs output). `seq` + `contentHash` side-by-side; `timestamp`; `promptId` / `chain` / `winningScope` / `qualifierContext`; `outcome`; success-branch `body` + `outputKind` + `trace`; failure-branch `error`; top-level `safeguardFindings`; `durationMs`. |
| **Q4 — filter API** | `query(criteria?)` echoing `getRecords`'s `sinceSeq` / `limit` plus prompt axes (`promptId`, `scope`, `qualifiers` partial-match, `outputKind`, `outcome`, `phase`, safeguard presence/disposition, timestamp range) — compiled down to a single predicate over `RetainingRingBuffer<T>`. |

Two semantics baked into the interface, not bolted on: **observer errors never break `resolve()`** (swallow + log to the existing injected `this.logger`), and **privacy/redaction is a storage-layer concern** (default store is most-permissive; deployments wrap or substitute).

---

## Q1 — `RetainingLogger` fit (the load-bearing question)

### What `RetainingLogger` actually is (read, not speculated)

From `libraries/ts-utils/src/packlets/logging/retainingLogger.ts` + `logger.ts`:

- `RetainingLogger extends LoggerBase implements IDetailLogger`. **Its public surface is the `ILogger` contract** — `log(level, message, ...params)`, `detail/info/warn/error`. It captures records via the `LoggerBase._logStructured(level, formatted, message, parameters)` hook (logger.ts:301), which only fires inside the `shouldLog(level, this.logLevel)` branch (logger.ts:266).
- The retained record is `ILogRecord` (retainingLogger.ts:30):
  ```ts
  interface ILogRecord {
    readonly seq: number;       // monotonic 1-based, stable across eviction
    readonly timestamp: number; // ms epoch, from injected clock
    readonly level: MessageLogLevel;
    readonly message: string;   // the FORMATTED string
    readonly args?: readonly unknown[]; // raw [message, ...parameters]
  }
  ```
- The query API is `getRecords(options?)` (retainingLogger.ts:169) with **exactly three filters**: `minLevel` (via `shouldLog`), `sinceSeq`, `limit` (most-recent-N tail). There is **no predicate/callback filter**.
- The genuinely valuable, non-trivial machinery is the **ring**: `_buffer` + `_head` + `_count` + `_capacity` giving O(1) eviction with no `shift()` re-indexing (retainingLogger.ts:207–234), plus the **monotonic `seq` stable across eviction and `clear()`** and the **since-cursor paging** contract. All of it is `private`. None of it is generic over the record type.

### The core tension

The observability hook is **not a log call**. A prompt observation is a typed `IPromptObservationRecord`, filtered on prompt-specific axes (promptId, scope, outcome, safeguard disposition). `RetainingLogger`'s record is log-shaped (`level` + a formatted `string` + an untyped `args`), and its only typed filter axis is `level`. The reusable part is the *ring/seq/paging mechanism*, not the *logger surface*.

`CODING_STANDARDS.md` § "Extending Core Libraries Over Working Around Them" pulls two ways here:

- **Against pure-D (sui generis):** "Duplicating a primitive's implementation in a consumer to add one missing feature" is named as an anti-pattern. Hand-rolling the ring/seq/eviction in `ts-prompt-assist` re-implements ~50 lines of proven, edge-cased machinery.
- **Against full-C (generic observer):** "Three similar lines is better than a premature abstraction." A generic `RetainingObserver<T>` would have to ship a *generic filter API* over unknown record types — which can only be a bare `(record: T) => boolean` predicate, losing exactly the schema-aware filtering the brief wants.

### The four options, scored

| Option | Concrete shape | Verdict |
|---|---|---|
| **A. Reuse `RetainingLogger` as-is** | `observer.log('info'|'error', formatted, record)`; record lives in `args[0]: unknown`; outcome encoded as level | **Reject.** Forces the log funnel: the typed record becomes `args[0]: unknown` (every read is an unchecked cast — a Priority-1 anti-pattern), outcome is squeezed into 5 log levels, and prompt-axis filtering is impossible inside the store (consumer post-filters an untyped array). This is the "working around the primitive" path the standards forbid. |
| **B. Extend `RetainingLogger`** with `filter?: (r: ILogRecord) => boolean` on `getRecords` | One additive option on `getRecords` | **Reject.** The added filter still operates on `ILogRecord`, so a prompt filter reads `r.args?.[0]` cast to the record type — same untyped-cast problem as A. It also widens the *logger* surface for a non-logging use case, conflating two concerns on one class. The extension is real but lands on the wrong primitive. |
| **C-full. New generic `RetainingObserver<T>`** in ts-utils | Generic ring + a generic `query(opts)` where the only schema-agnostic filter is a `(record: T) => boolean` predicate | **Reject (as the *whole* answer).** A generic observer cannot ship the schema-aware filter axes (promptId, scope, disposition) the brief asks for — those are prompt-specific. Shipping a generic filter API for unknown future record types is the premature abstraction the standards warn against, and the brief's own bar ("name a second observability use case … else default to D") is meant to gate exactly this. |
| **D. Sui generis `PromptObservationStore`** in ts-prompt-assist | Schema-aware from day one; owns its `query(criteria)` | **Accept the schema-aware surface here** — but *don't* hand-roll the ring. |

### Recommendation: **hybrid C-minimal + D**

Split the primitive cleanly along its real seam:

1. **`@fgv/ts-utils` (extend the lower library — additive):** lift the ring/seq/since-cursor mechanism out of `RetainingLogger` into a small generic primitive, e.g.

   ```ts
   // @fgv/ts-utils — collections or logging-adjacent packlet
   export interface IRetainingRingBufferOptions {
     readonly maxRecords?: number;        // default 1000
     readonly now?: () => number;         // injected clock; default Date.now
   }
   export class RetainingRingBuffer<T extends { readonly seq: number; readonly timestamp: number }> {
     public push(makeRecord: (seq: number, timestamp: number) => T): T; // assigns seq + timestamp
     public get lastSeq(): number;
     public clear(): void;                                              // does NOT reset seq
     public query(opts?: {
       readonly sinceSeq?: number;
       readonly limit?: number;                                        // most-recent-N tail
       readonly filter?: (record: T) => boolean;                       // generic escape hatch
     }): ReadonlyArray<T>;                                             // oldest-first
   }
   ```

   This is the **only** part that is genuinely reusable and genuinely non-trivial. It is generic over `T` but ships **no** schema-aware filter — just the proven ring + `seq` contract + `sinceSeq`/`limit`/`filter`.

2. **`@fgv/ts-prompt-assist` (Option D, schema-aware):** `PromptObservationStore` *composes* `RetainingRingBuffer<IPromptObservationRecord>`. It owns the prompt-aware `query(criteria)` (Q4), which compiles its criteria down to one `filter` predicate handed to the ring buffer.

   ```ts
   const store = PromptObservationStore.create({ maxRecords: 5000 }).orThrow();
   const lib = (await PromptLibrary.create({ store: promptStore, qualifiers, observers: [store] })).orThrow();
   await lib.resolve({ id, chain, qualifiers: { language: 'fr' } });
   const rejects = store.query({ outcome: 'success', safeguardDisposition: 'warn', limit: 50 });
   ```

#### Why this clears the brief's falsifiability bar

The brief: *"if option C is recommended, the recommendation must name a second observability use case plausible within 6 months."* The C-minimal extraction's second consumer is **not speculative** — it is `RetainingLogger` **itself**: `RetainingLogger` can be refactored to compose `RetainingRingBuffer<ILogRecord>` (its `_logStructured` hook already builds exactly the `{ seq, timestamp, … }` record the buffer assigns). That refactor is optional and out of Phase C scope, but it proves the abstraction has a real, existing second consumer rather than a hypothetical one. A *plausible* third within 6 months: LLM-call audit in the active `@fgv/ts-extras` `ai-assist` packlet (`callProviderCompletion` / `executeClientToolTurn` round-trips) is the same "retain records, page by cursor, filter" shape.

We deliberately do **not** generalize the *filter API* (full-C). The filter axes are prompt-specific; genericizing them is the over-abstraction the brief's bar exists to prevent. Hence **C only for the mechanism, D for the schema-aware surface.**

#### Fallback for Phase B

If Phase B judges even the minimal ts-utils extraction not worth the cross-library touch (e.g. wants Phase C to land entirely inside `ts-prompt-assist`), fall back to **pure D** with a hand-rolled ring, accepting the ~50-line duplication. This is the only axis on which Q1 is genuinely open; everything else in the design is independent of A/B/C/D.

---

## Q2 — Hook firing surface

### What the code shows

- `resolve()` (promptLibrary.ts:456) is a one-liner: `return this._resolveInternal(req, 0, [])`.
- `_resolveInternal` (promptLibrary.ts:476) is **re-entrant**: resource bindings recurse back into it with `depth > 0` via `resolvePendingResourceBindings({ …, innerResolve: (r, d, s) => this._resolveInternal(r, d, s) })` (promptLibrary.ts:554). Each inner resolve produces its own `IPromptResolveTrace`, already nested under the outer trace as `IResourceBindingTraceEntry.innerTrace` (trace.ts:112–123, assembled at promptLibrary.ts:973).
- `resolveJsonOutput()` (promptLibrary.ts:593) and `resolveFreeTextOutput()` (promptLibrary.ts:664) each call `this.resolve(req)` internally, then post-process the LLM's `rawOutput`.
- The success trace is only constructed in `_renderResolved` (promptLibrary.ts:969). **On failure, no `IResolvedPrompt` and no `IPromptResolveTrace` are produced** — the failed `Result` carries only a message string.

### Recommendation

**Fire at the public method boundary, never inside `_resolveInternal`.**

- **`resolve()`** emits exactly one record (`phase: 'resolve'`), covering success and failure. Wiring: wrap the existing one-liner —
  ```ts
  public async resolve(req): Promise<Result<IResolvedPrompt>> {
    const startedAt = this._now();
    const result = await this._resolveInternal(req, 0, []);
    await this._observe(this._buildResolveRecord(req, result, this._now() - startedAt));
    return result;
  }
  ```
  Because the fire is at depth 0 only, **nested resource-binding resolves never fire their own record** — they surface inside the outer record's `trace.resourceBindingResolutions[].innerTrace`. This matches the brief's "roll up, NOT a separate hook fire."

- **`resolveJsonOutput()` / `resolveFreeTextOutput()`** each emit one *additional* record (`phase: 'json-output'` / `'free-text-output'`) describing the output round-trip (the `rawOutput` and whether validation passed). The inner `this.resolve(req)` call still fires its own `'resolve'` record, so calling `resolveJsonOutput` produces **two** records — a render record and an output record — cross-linked by `linkedResolveSeq`. This honors the brief's "separate hook fires … with their own concerns" while keeping each record single-responsibility.

  *(Phase B option: if two records per output call is judged noisy, the output methods could pass a flag suppressing the inner render fire and emit one combined record. Recommended default is two cross-linked records.)*

### Async vs sync

`resolve()` is already `async`. Recommend the observer interface be **async** (`observe(record): Promise<Result<unknown>>`) for forward-compat with I/O-backed observers (disk, network, queue). The library **awaits** the fan-out before returning (deterministic ordering, no lost records) but swallows per-observer errors (see Semantics). The default in-memory `PromptObservationStore.observe` is synchronous internally and returns an already-resolved promise, so it adds no real latency. Deployments with heavyweight observers are advised to buffer-and-flush internally rather than block `resolve()`.

*(Phase B option: a fire-and-forget mode for latency isolation. Recommended default is awaited-with-swallow.)*

---

## Q3 — Record shape (`IPromptObservationRecord`)

Modeled as a **`phase`-discriminated union** so render records and output records stay single-responsibility (no optional-field soup):

```ts
/** Common to every observation record. @public */
interface IPromptObservationBase {
  /** Monotonic 1-based seq, assigned by the store, stable across eviction. Ordering key. */
  readonly seq: number;
  /**
   * Dedupe key: CRC32 over RFC 8785 canonical JSON of
   * { promptId, chain, qualifierContext, substitutions } via Hash.Crc32Normalizer.
   * Side-by-side with seq — consumer picks which to key on. (See OQ-1.)
   */
  readonly contentHash: string;
  /** ms epoch from the store's injected clock. */
  readonly timestamp: number;
  /** Wall-clock duration of the observed call. */
  readonly durationMs: number;
  readonly promptId: PromptId;
  /** The request's scope chain (most-specific → general), as supplied. */
  readonly chain: ReadonlyArray<ScopeKey>;
  /** Caller qualifier context (verbatim — privacy is a storage-layer concern). */
  readonly qualifierContext: IQualifierContext;
  /** Caller substitutions, if any (verbatim — may carry PII; deployment redacts). */
  readonly substitutions?: PromptSubstitutions;
}

/** One per public resolve() call. @public */
interface IPromptResolveObservation extends IPromptObservationBase {
  readonly phase: 'resolve';
  readonly outcome: 'success' | 'failure';
  /** Present on success. Scope whose record won (trace.winningScope). */
  readonly winningScope?: ScopeKey;
  /** Present on success: the final rendered body (post-Mustache, post-preface). */
  readonly body?: string;
  /** Present on success: descriptor.output.kind — a top-level filter axis. */
  readonly outputKind?: 'free-text' | 'json';
  /** Present on success: the full existing resolve trace. */
  readonly trace?: IPromptResolveTrace;
  /**
   * Present on success: mirror of trace.safeguardFindings, surfaced top-level
   * so the store can filter on disposition without walking into the trace.
   */
  readonly safeguardFindings?: ReadonlyArray<ISafeguardFinding>;
  /** Present on failure: the failure Result's message. (No trace — see note.) */
  readonly error?: string;
}

/** One per resolveJsonOutput() / resolveFreeTextOutput() call. @public */
interface IPromptOutputObservation extends IPromptObservationBase {
  readonly phase: 'json-output' | 'free-text-output';
  /** seq of the 'resolve' record produced by the inner resolve() call. */
  readonly linkedResolveSeq: number;
  readonly outcome: 'success' | 'failure';
  /** The LLM's raw response string (verbatim — deployment redacts). */
  readonly rawOutput: string;
  /** Present on failure: validation/parse failure message. */
  readonly error?: string;
}

/** @public */
type IPromptObservationRecord = IPromptResolveObservation | IPromptOutputObservation;
```

### Field-by-field provenance

| Field | Source in code |
|---|---|
| `seq`, `timestamp` | assigned by `RetainingRingBuffer.push` (mirrors `ILogRecord.seq/timestamp`) |
| `contentHash` | `Hash.Crc32Normalizer` over canonical `{ promptId, chain, qualifierContext, substitutions }`. `ts-prompt-assist` already imports `Normalizer` from `@fgv/ts-utils` and uses RFC 8785 canonical JSON for its cache keys (promptLibrary.ts:267, 738). CRC32 is sufficient for a *dedupe* key (collisions are acceptable for dedupe; the standards reserve canonical-string equality for exact equality, which this field is not). |
| `promptId`, `chain`, `qualifierContext`, `substitutions` | straight off `IPromptResolveRequest` (promptLibrary.ts:182) |
| `winningScope`, `trace`, `safeguardFindings` | `IResolvedPrompt.trace` (trace.ts:136, 163) |
| `body` | `IResolvedPrompt.body` (trace.ts:165) |
| `outputKind` | `resolved.descriptor.output.kind` (output.ts:33, descriptor.ts:80) |
| `error` | the failed `Result.message` |
| `rawOutput`, `linkedResolveSeq` | the `rawOutput` arg + the inner resolve record's seq |

### Load-bearing finding for Phase B: **failure records carry no trace**

`IPromptResolveTrace` is constructed only on the success path inside `_renderResolved` (promptLibrary.ts:969); a failed `resolve()` returns a `Result.fail` with just a message. So **`IPromptResolveObservation` on `outcome: 'failure'` can carry `error` but not a partial `trace`** without a larger change to `PromptLibrary`'s internals (threading partial-trace state out of every early-return in `_resolveOnce`). Recommend **v0.1 = error-only on failure**; name "thread a partial trace out of the failure path" as a Phase B option (OQ-4). This is the one place the brief's Q3 sketch ("failure: error message + last-known trace state") outruns what the current code can supply cheaply.

---

## Q4 — Filter axis API (storage-layer queries)

`PromptObservationStore.query` echoes `RetainingLogger.getRecords`'s cursor/limit semantics and adds the schema-aware prompt axes. All criteria are AND-combined and compile to **one** predicate handed to `RetainingRingBuffer.query({ sinceSeq, limit, filter })`.

```ts
/** @public */
interface IPromptObservationQuery {
  // --- echoes RetainingLogger.getRecords ---
  readonly sinceSeq?: number;          // records with seq > sinceSeq (incremental paging cursor)
  readonly limit?: number;             // most-recent-N tail, still oldest-first
  // --- timestamp range (ring stores timestamp already) ---
  readonly since?: number;             // timestamp >= since
  readonly until?: number;             // timestamp <= until
  // --- prompt-schema axes ---
  readonly promptId?: PromptId;
  readonly scope?: ScopeKey;           // matches winningScope OR chain membership
  readonly qualifiers?: IQualifierContext; // partial-match: each supplied key must equal
  readonly outputKind?: 'free-text' | 'json';
  readonly outcome?: 'success' | 'failure';
  readonly phase?: IPromptObservationRecord['phase'];
  // --- safeguard axes (success resolve records) ---
  readonly hasSafeguardFindings?: boolean;
  readonly safeguardDisposition?: SafeguardDisposition; // 'reject' | 'warn' | 'info'
  // --- generic escape hatch ---
  readonly filter?: (record: IPromptObservationRecord) => boolean;
}

class PromptObservationStore implements IPromptObserver {
  public static create(opts?: { maxRecords?: number; now?: () => number }): Result<PromptObservationStore>;
  public observe(record: IPromptObservationRecord): Promise<Result<unknown>>; // the hook
  public query(criteria?: IPromptObservationQuery): ReadonlyArray<IPromptObservationRecord>;
  public get lastSeq(): number;        // cursor source, mirrors RetainingLogger.lastSeq
  public clear(): void;                // does NOT reset seq, mirrors RetainingLogger.clear
}
```

Notes:
- `safeguardDisposition` matches if any finding in `safeguardFindings` carries that disposition. Recall reject-disposition findings fail the resolve *before* a trace is built (trace.ts:145–154), so they surface on `outcome: 'failure'` resolve records as `error`, not in `safeguardFindings`; `warn`/`info` surface on success records. The store filter handles both via `outcome` + `safeguardDisposition`.
- `scope` partial-match against chain membership lets a deployment ask "every prompt that consulted `tenant:acme`" regardless of which scope won.

---

## Critical semantics (baked into the interface, not bolted on)

### 1. Observer errors must not break `resolve()` — `MultiLogger`-shaped fan-out

`MultiLogger` (multiLogger.ts:83) forwards to each child and never lets one child's outcome abort the others. Mirror that exactly. The library already injects a diagnostic `logger: Logging.ILogger` (`this.logger`, promptLibrary.ts:301, defaulting to `NoOpLogger`) — **reuse it** as the observer-error fallback sink. No new fallback-wiring parameter needed.

```ts
private async _observe(record: IPromptObservationRecord): Promise<void> {
  await Promise.all(
    this._observers.map(async (obs) => {
      try {
        (await obs.observe(record)).onFailure((msg) => {
          this.logger.warn(`prompt observer failed (swallowed): ${msg}`);
          return fail(msg);
        });
      } catch (e) {
        // a rejected promise from a misbehaving observer is swallowed too
        this.logger.warn(`prompt observer threw (swallowed): ${String(e)}`);
      }
    })
  );
  // never returns a Result — the resolve() result is unaffected regardless
}
```

Key properties: (a) one observer's failure/throw cannot abort another's `observe`; (b) the `resolve()` return value is never affected by any observer outcome; (c) by default (`NoOpLogger`) failures are silently swallowed; a deployment that injects a real `logger` gets warn-level visibility for free.

### 2. Privacy/redaction is a storage-layer concern

The default `PromptObservationStore` is **most-permissive**: it stores `body`, `rawOutput`, `qualifierContext`, and `substitutions` verbatim. The library bakes in **no** retention rule, no redaction, no field-stripping — `ACTIVE_DEVELOPMENT.md` and the brief both forbid baking deployment policy into the library. A production deployment that must redact PII does one of:

- **Wrap:** supply a consumer `IPromptObserver` that transforms/strips the record, then forwards to the default store (`observers: [redactingObserver]`).
- **Substitute:** supply a different `IPromptObserver` entirely (write-to-SIEM, hashing store, etc.).

Because the fan-out takes `observers: ReadonlyArray<IPromptObserver>` (DI, mirroring `store` / `registry` / `logger` on `IPromptLibraryCreateParams`, promptLibrary.ts:110), the deployment owns the entire privacy posture by choosing what it injects. `maxRecords` (size) is likewise the store's constructor concern, not the library's.

---

## DI wiring summary

One additive field on the existing params interface (active-development surface — additive, no compat burden):

```ts
interface IPromptLibraryCreateParams<TResponse, TQualifierNames> {
  // ... existing fields ...
  /** Observers fired once per public resolve / output call. Errors are swallowed. */
  readonly observers?: ReadonlyArray<IPromptObserver>;
}
```

`IPromptObserver` is the single-method hook:

```ts
/** @public */
interface IPromptObserver {
  observe(record: IPromptObservationRecord): Promise<Result<unknown>>;
}
```

No `MultiPromptObserver` class is needed — the library *is* the fan-out point (it holds the array and runs `_observe`), exactly as a `MultiLogger` would but inlined at the one call site. (Phase B may still want a standalone `MultiPromptObserver` for consumers composing observers outside the library; named as OQ-6.)

---

## Open questions for Phase B triage

| # | Question | Phase A lean |
|---|---|---|
| **OQ-1** | id-key: `seq` alone, `contentHash` alone, or both side-by-side? | **Both** — seq for ordering/paging, contentHash for dedupe. Cheap; let the consumer pick. |
| **OQ-2** | Observer-error fallback: silent swallow, log to injected `logger`, or per-observer error handler? | **Log to the existing `this.logger` at warn** (NoOpLogger ⇒ silent by default). No new param. |
| **OQ-3** | Observer interface async vs sync; awaited vs fire-and-forget? | **Async, awaited, per-observer swallow.** Fire-and-forget as an opt-in mode if latency isolation is wanted. |
| **OQ-4** | Failure records: error-only (v0.1) or thread a partial trace out of `_resolveOnce`'s early returns? | **Error-only for v0.1.** Partial-trace threading is a real `PromptLibrary` internals change — defer. |
| **OQ-5** | Output methods: two cross-linked records (render + output) or one combined record? | **Two cross-linked** (`linkedResolveSeq`). Combined-with-suppression as a fallback if judged noisy. |
| **OQ-6** | **Headline (Q1):** ship `RetainingRingBuffer<T>` in `@fgv/ts-utils` (hybrid C-minimal + D), or stay pure-D with a hand-rolled ring inside `ts-prompt-assist`? | **Hybrid C-minimal + D.** Pure-D is the fallback if the cross-library touch isn't wanted. Also decide whether `RetainingLogger` is refactored to compose the new buffer in Phase C (recommend: *not* in Phase C — keep the blast radius to additive). |
| **OQ-7** | Standalone `MultiPromptObserver` class, or is the library's inlined fan-out enough? | Inlined is enough for v0.1; add the class only if a consumer needs to compose observers outside the library. |
| **OQ-8** | Does the output-observation record duplicate the resolved `body`, or only reference it via `linkedResolveSeq`? | Reference only (avoid double-storing the body); the render record already holds it. |

### Hook-ordering note (raised in the brief, resolved here)

Screeners run **pre-render** inside `applySafeguards` (promptLibrary.ts:954); the observer fires **post-resolve** at the public boundary. So the observation record sees screener findings *only* via the trace (`safeguardFindings`), and **never** sees pre-screening slot state — which is correct: the observer is an audit of *what resolved*, not an interception point inside the safeguard pipeline. No additional firing point inside `applySafeguards` is warranted.

---

## Out of scope (confirmed; do not let Phase C creep)

- No `watch` / change-notification (that's `IPromptStoreEvent`'s future job, storeEvents.ts:15 — explicitly v0.1-out per `LIBRARY_CAPABILITIES.md`).
- No persistence/serialization of the default store (in-memory ring only; durable observers are the consumer's to inject).
- No redaction/retention policy in the library (storage-layer concern).
- No LLM-call orchestration — the observer records what `resolve` / output methods already produce; it does not call providers.

---

## Phase A acceptance — self-check

- [x] Q1 answered with a falsifiable recommendation (hybrid C-minimal + D; A/B/full-C rejection rationale; falsifiability via an existing second consumer — `RetainingLogger` itself).
- [x] Q2 sketches the firing point(s) against actual `PromptLibrary` code (public-boundary wrap of `_resolveInternal`; resource-binding roll-up).
- [x] Q3 specifies `IPromptObservationRecord` against `IPromptResolveTrace` / `IResolvedPrompt` / `IPromptResolveRequest`, including the failure-record-has-no-trace finding.
- [x] Q4 specifies the filter axis API echoing `getRecords`.
- [x] Both critical semantics sketched in the proposed interface (error swallow via existing `this.logger`; storage-layer privacy via DI).
- [x] Open questions for Phase B named (OQ-1…OQ-8 + hook-ordering note).
- [x] No source-code changes outside the task substrate.
