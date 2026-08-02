# The async Result family — design

**Status:** design only. No implementation.
**Package:** `@fgv/ts-utils`, `base` packlet.
**Origin:** PersonAIlity asked for "N independent async `Result`-returning operations with a
concurrency bound." Rather than add one function, this sweeps the whole
`mapResults` / `populateObject` family and asks what making it properly async looks like.

---

## 1. The gap is real — verified, not assumed

The consumer's analysis of `populateObject` was checked against the source and is exactly
right on all three counts:

- `FieldInitializers<T> = { [key in keyof T]: (state: Partial<T>) => Result<T[key]> }`
  (`mapResults.ts:216`) — synchronous, no promise anywhere in the type.
- It builds a keyed heterogeneous object, not a homogeneous array of N identical operations.
- Its `order` option threads `Partial<T>` through a serial loop so each initializer sees the
  previously-populated fields. That is **dependency sequencing, deliberately serial** — the
  opposite of what a concurrency-bounded fan-out needs.

And the negative holds: **`grep` for `concurrency` / `maxConcurrent` / `semaphore` / `inFlight`
across all of `ts-utils` returns nothing.** There is no scheduler in the library.

## 2. What the sweep found that the original ask did not

**a) The blocker is structural, and it is the same one in every family member.**

Every existing helper takes `Iterable<Result<T>>` — *already-materialized* results:

| Helper | Input | Output |
|---|---|---|
| `mapResults<T>` | `Iterable<Result<T>>` | `Result<T[]>` — all-or-aggregate |
| `mapDetailedResults<T,TD>` | `Iterable<DetailedResult<T,TD>>` + `ignore: TD[]` | `Result<T[]>` |
| `mapSuccess<T>` | `Iterable<Result<T>>` | `Result<T[]>` — successes only |
| `mapFailures<T>` | `Iterable<Result<T>>` | `string[]` |
| `allSucceed<T>` | `Iterable<Result<unknown>>` + `successValue` | `Result<T>` |
| `firstSuccess<T>` | `Iterable<Result<T> \| DeferredResult<T>>` | `Result<T>` |
| `populateObject<T>` | `FieldInitializers<T>` | `Result<T>` |

For synchronous code, materializing is free — the work already happened. **For async,
materializing means the promise has already started.** So `mapResultsAsync(promises)` cannot
bound anything; by the time it is called, all N operations are in flight. This is precisely the
consumer's point about `succeed(promise)`, and it generalizes: *no async sibling in this family
can take materialized work.* Every one must take deferred work.

**b) The family already has the answer, in one member.**

`firstSuccess` is the only helper that accepts `DeferredResult<T> = () => Result<T>`
(`result.ts:38`) — because it short-circuits, so it must not evaluate what it may not need.

That is the exact shape the async siblings require, for a different reason: laziness is what
makes bounding possible. **The deferral concept is already in the library and already
exported.** The async family is `AsyncDeferredResult<T> = () => Promise<Result<T>>` — a sibling
of an existing type, not a new concept.

**c) The family does not transpose uniformly. It splits two ways.**

This is the core finding, and it is why "add async variants" is the wrong framing:

| Class | Members | What async does to it |
|---|---|---|
| **Bounded-parallel collectors** | `mapResults`, `mapDetailedResults`, `mapSuccess`, `mapFailures`, `allSucceed` | Mechanical. All five want the *same* scheduler and differ only in how they fold results. |
| **Inherently serial** | `populateObject`, `firstSuccess` | Want async support but **not** a concurrency bound — they are serial by contract, for different reasons. |

The five collectors are one primitive plus five folds. That is the shape of the work.

`populateObject` is serial because each initializer sees `Partial<T>`; a `concurrency` option
would be meaningless at best and a correctness trap at worst, since offering one implies the
initializers are independent when the contract says they are not.

`firstSuccess` is serial because **"first" *means* "do not do work you do not need."** An
earlier draft of this document put it in a third class, treating first-in-order vs.
first-to-settle as an open semantic choice under a concurrency bound. That was wrong. Running
N operations and picking the earliest-indexed success is not the short-circuit contract
preserved under parallelism — it is a *different operation* that does N units of work to
report one, with whatever side effects those N carry. The short-circuit contract admits
exactly one implementation: await the first, and on failure await the next.

(The first-to-settle variant is a real thing — it is `Promise.any` with `Result` folding — but
it is a distinct primitive that would want a distinct name. Nobody has asked for it, and it is
not proposed here.)

**d) There are in-repo consumers today, hand-rolling it unbounded.**

The ask is not only external. `ts-agent-memory`'s `HybridRetriever`:

```ts
const perRetriever: Result<ReadonlyArray<IMemoryRecord<unknown>>>[] = await Promise.all(
  this._retrievers.map((retriever) => retriever.retrieve(this._projectQuery(query, retriever)))
);
return mapResults(perRetriever)
```

That is `mapResultsAsync` with unbounded concurrency, spelled out by hand — `Promise.all` then
`mapResults`. `ts-prompt-assist`'s observer fan-out and `ts-bcp47`'s registry loader are the
same shape. **This addresses the "ships with no in-repo consumer" concern directly:** the
primitive has at least three internal call sites that can migrate, in addition to the external
ask.

---

## 3. Proposed shape

```typescript
/** A unit of async work, deferred so a scheduler can decide when to start it. @public */
export type AsyncDeferredResult<T> = () => Promise<Result<T>>;

/** @public */
export interface IAsyncResultOptions {
  /** Maximum operations in flight at once. See § 4, OQ-2. */
  readonly concurrency?: number;
  /** Optional aggregator, matching the sync family's third parameter. */
  readonly aggregatedErrors?: IMessageAggregator;
}

export function mapResultsAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>, options?: IAsyncResultOptions
): Promise<Result<T[]>>;

export function mapDetailedResultsAsync<T, TD>(
  work: Iterable<() => Promise<DetailedResult<T, TD>>>, ignore: TD[], options?: IAsyncResultOptions
): Promise<Result<T[]>>;

export function mapSuccessAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>, options?: IAsyncResultOptions
): Promise<Result<T[]>>;

export function mapFailuresAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>, options?: IAsyncResultOptions
): Promise<string[]>;

export function allSucceedAsync<T>(
  work: Iterable<AsyncDeferredResult<unknown>>, successValue: T, options?: IAsyncResultOptions
): Promise<Result<T>>;
```

Each mirrors its sync sibling's name, parameter order, and fold. A caller who knows the sync
family knows these.

**Why `Iterable<() => Promise<Result<T>>>` and not `(items, fn)`.** The `() =>` is one extra
character at the call site and it makes the deferral *visible*. Given that "why can't I just
pass promises" is the exact misunderstanding that produced this ask, a signature that answers
the question by its shape is worth more than the brevity. It also matches how the family
already reads — `Iterable<X>` in, folded value out — and `firstSuccess` already accepts thunks.
A `(items, fn)` convenience can be layered on later additively if call sites want it (OQ-3).

**Results stay in input order** regardless of completion order, for all five. Out-of-order
results would be a silent correctness trap for anyone zipping them back against their inputs.

**`populateObject` gets an async sibling with no `concurrency` option:**

```typescript
export type AsyncFieldInitializers<T> = {
  [key in keyof T]: (state: Partial<T>) => Promise<Result<T[key]>>;
};

export function populateObjectAsync<T>(
  initializers: AsyncFieldInitializers<T>,
  options?: PopulateObjectOptions<T>,
  aggregatedErrors?: IMessageAggregator
): Promise<Result<T>>;
```

Serial by construction, same `order` semantics. **Deliberately no `concurrency`** — offering
one would imply initializers are independent, which the `Partial<T>` contract says they are
not.

---

## 4. Open questions

OQ-1 is resolved; four remain.

**OQ-1 — `firstSuccessAsync` — RESOLVED: do not ship it.**

Per § 2(c) it could only ever be a serial loop, so the "bounded concurrency" motivation that
drives this whole design does not apply to it. That leaves one honest justification — the sync
version aggregates *every* attempt's failure message when all attempts fail, which a
hand-rolled loop typically forgets — and that is not enough on its own.

The deciding evidence is adoption. **`firstSuccess` has zero production callers in this
repository.** Of 34 references, 32 are in its own test file and 2 are generated `.d.ts`
output. The synchronous version has not earned its place in-repo since it shipped; adding an
async sibling for a pattern with no demonstrated demand, which no consumer has requested, is
speculative surface on a stable package.

The nearest in-repo shape is `ts-prompt-assist`'s `chainWalker`, and examining it reinforces
the cut rather than undermining it: it walks a scope chain serially and stops at the first
*found* record, but a store failure is **fatal** — it aborts the walk rather than falling
through to the next scope. That is "first found," not "first success," and
`firstSuccessAsync` would not have served it. The one real fallback-shaped walk in the repo
has a different contract.

If a consumer later asks with a concrete use case, this is additive and cheap to revisit.

**OQ-2 — default `concurrency`.** Unbounded default reproduces the exact bug the primitive
exists to prevent, for any caller who does not think about it. A required parameter is safe but
heavy for a general-purpose utility. A small default (4? 8?) is safe but arbitrary. Note the
safer-fetch precedent (D-3): required-then-relax is the direction that can be loosened later
without a break, whereas permissive-then-tighten cannot. **My lean: default 1 is wrong (that is
just a serial loop), unbounded is wrong, so either required or a documented small default.**

**OQ-3 — `(items, fn)` convenience overload.** Ship now or wait for a call site to want it?
Additive either way. My lean: wait.

**OQ-4 — cancellation.** Should a failure stop scheduling remaining work? The sync family has
no notion — `mapResults` evaluates nothing, it folds. For async, "keep going and aggregate all
errors" matches `mapResults`' contract; "stop on first failure" matches what most callers want
from a bounded pool. `allSucceedAsync` in particular has an obvious short-circuit. Related:
should any of these take an `AbortSignal`? **My lean: match the sync contract (aggregate all)
for the `map*` family, and leave `AbortSignal` out of v1** — but flag that this makes
`allSucceedAsync` slower than a hand-rolled version in the failure case.

**OQ-5 — is `ts-utils` the right home?** It is a **stable, non-active-development** surface, so
this is purely additive and carries compatibility obligations from the day it ships. The
alternative is `ts-extras`. My lean is `ts-utils` — this is core `Result` vocabulary, the sync
siblings live there, and splitting the family across packages to avoid a stability obligation
would be the tail wagging the dog.

---

## 5. Scope note

Five collectors + `populateObjectAsync` + one scheduler (no `firstSuccessAsync`, per OQ-1). The scheduler is the only novel logic;
the five folds are near-copies of their sync siblings against a different input shape. Estimate
is **one session**, plus the in-repo migrations (`HybridRetriever`, the prompt-assist observer
fan-out, the bcp47 loader) which are optional and separable.

**Not in scope:** retry, timeout, or backoff inside the scheduler — those are orthogonal and
belong to the caller's work function. A scheduler that also retries is two primitives wearing
one coat.
