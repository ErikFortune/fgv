# The async Result family — design

**Status:** **implemented and merged** — #596. This document is retained as the rationale
record, not as a statement of pending work. Where the implementation diverged from what is
written below, § 6 records it.
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
| **Transitively async** | `populateObject`, `firstSuccess` | The *algorithm* stays synchronous — serial, short-circuiting. Only the primitives they call are async, so the asynchronicity is inherited, not intrinsic. They want `await`, **never** a concurrency bound. |

The five collectors are one primitive plus five folds. That is the shape of the work.

`populateObject` is serial because each initializer sees `Partial<T>`; a `concurrency` option
would be meaningless at best and a correctness trap at worst, since offering one implies the
initializers are independent when the contract says they are not.

`firstSuccess` is serial because **"first" *means* "do not do work you do not need."** An
earlier draft put it in a third class, treating first-in-order vs. first-to-settle as an open
semantic choice under a concurrency bound. That was wrong. Running N operations and picking the
earliest-indexed success is not the short-circuit contract preserved under parallelism — it is
a *different operation* that does N units of work to report one, with whatever side effects
those N carry. The short-circuit contract admits exactly one implementation: await the first,
and on failure await the next.

**"Transitively async" is the load-bearing idea for this class.** These are synchronous
algorithms that happen to call asynchronous primitives. That framing has a direct API
consequence: neither member should accept `IAsyncResultOptions`, because a `concurrency` field
on an operation that is serial by definition is a lie in the type signature. They take an
aggregator and nothing else.

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
  /** Maximum operations in flight at once. Defaults to `DEFAULT_RESULT_CONCURRENCY`. */
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

Each also carries an `(items, fn, options?)` overload (OQ-3):

```typescript
export function mapResultsAsync<TItem, T>(
  items: Iterable<TItem>,
  fn: (item: TItem, index: number) => Promise<Result<T>>,
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;
```

**Both forms earn their place.** The thunk form makes deferral *visible* — given that "why
can't I just pass promises" is the misunderstanding that produced this design, a signature that
answers the question by its shape is worth the extra `() =>`. It also matches how the family
already reads (`Iterable<X>` in, folded value out) and mirrors `firstSuccess`, which already
accepts thunks. The `(items, fn)` form makes materialized work *structurally inexpressible* —
there is nowhere to put an already-started promise. And they cover different cases: `(items,
fn)` is N applications of one operation, thunks are N different operations, and heterogeneous
fan-out has no natural `items` array.

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

export function firstSuccessAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  aggregatedErrors?: IMessageAggregator
): Promise<Result<T>>;
```

Note neither takes `IAsyncResultOptions`. They are transitively async (§ 2c) — serial by
contract — so a `concurrency` field would be a lie in the type signature.

Serial by construction, same `order` semantics. **Deliberately no `concurrency`** — offering
one would imply initializers are independent, which the `Partial<T>` contract says they are
not.

---

## 4. Open questions

**All five resolved.** Retained with their reasoning, since three of the five reversed at least once during review.

**OQ-1 — `firstSuccessAsync` — RESOLVED: ship it, serial, with no concurrency option.**

This reversed twice, so the reasoning is recorded rather than just the answer.

It is **not** part of the bounded-concurrency story — per § 2(c) it is transitively async, so
the motivation driving the rest of this design does not apply to it. It belongs here only
because it is a family member that needs `await`.

The first pass at this question cut it, on the evidence that **`firstSuccess` has zero
production callers in this repository** — of 34 references, 32 are its own tests and 2 are
generated `.d.ts`. That evidence was read backwards. The repository performs *all* file I/O
through `FileTree`, which is asynchronous, so every naturally fallback-shaped job here is
async and **the synchronous version is structurally incapable of serving any of them.** Zero
adoption of a synchronous tool for an inherently asynchronous job is not evidence that the job
does not exist; it is evidence that the tool never fit.

The motivating case: *load the first of an ordered list of `n` candidate files* — a local
override before a default, or a search path walked in precedence order. Serial is not a
compromise there, it is the requirement: the whole point is not to read the later files when
an earlier one answers.

**Honest caveat on strength of evidence.** Unlike the five collectors — which have three
existing hand-rolled call sites in-repo — this one has **no existing call site**. A search for
serial candidate-file fallbacks across all of `libraries/` and `tools/` found none. It ships on
a named prospective use case, not demonstrated demand. That is a weaker justification, and it
is the reason to keep the surface minimal: a serial loop plus the error aggregation a
hand-rolled version invariably forgets.

```typescript
export function firstSuccessAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  aggregatedErrors?: IMessageAggregator
): Promise<Result<T>>;
```

**No options bag, and deliberately so** — a `concurrency` field on an operation that is serial
by definition would be a lie in the type signature. When every attempt fails, the failure
carries *every* attempt's message, matching the sync sibling.

The nearest in-repo shape remains `ts-prompt-assist`'s `chainWalker`, and it is worth recording
that this would **not** serve it: `chainWalker` treats a store failure as fatal and only
advances on a *missing* record. That is "first found," not "first success" — a different
contract, and not a call site to migrate.

**OQ-2 — default `concurrency` — RESOLVED: optional, with a documented default.**

`concurrency?: number` on `IAsyncResultOptions`, defaulting to a documented constant exported
alongside it (so callers can read and reference it rather than guessing). The default must be
finite — an unbounded default would reproduce the exact bug the primitive exists to prevent for
any caller who does not think about it.

**OQ-3 — `(items, fn)` convenience overload — RESOLVED: ship it.**

The question asked was what the risk is. Having looked at it concretely, it is low:

- **Overload ambiguity is smaller than it first appears.** The forms are `(work, options?)` and
  `(items, fn, options?)`; the second argument discriminates cleanly (a function versus an
  options object), and a single-argument call can only be the thunk form. `populateObject`
  already carries overloads, so this is a familiar shape in this file.
- The one genuinely ambiguous case is a `TItem` that is *itself* a function type, where both
  readings could type-check. It is rare, and it surfaces as a type error rather than silent
  wrong behaviour.
- **Real cost is surface, not correctness**: two documented forms and two test paths on a
  stable package.

There is also a benefit that argues for it beyond convenience: **`(items, fn)` makes
materialized work structurally inexpressible.** The caller supplies data and a function; there
is no place to put an already-started promise. Given that "why can't I just pass promises" is
the misunderstanding that produced this whole design, the form that makes the mistake
unsayable is worth having.

The two forms serve genuinely different cases and neither subsumes the other: `(items, fn)` is
N applications of *one* operation; thunks are N *different* operations. Heterogeneous fan-out
has no natural `items` array.

**OQ-4 — cancellation — RESOLVED: defer it. Retrofitting is safe, which was worth checking.**

The question asked what a retrofit looks like. It splits in two, and both halves are cheaper
than expected:

*Scheduler-level abort* (stop launching new work) is purely additive — an optional `signal`
field on `IAsyncResultOptions`, which already exists.

*Work-level abort* (hand each operation a signal so in-flight work can cancel itself) means
widening `AsyncDeferredResult<T>` from `() => Promise<Result<T>>` to
`(signal: AbortSignal) => Promise<Result<T>>`. **That widening is not a breaking change**, and
this is the load-bearing fact: TypeScript accepts a zero-argument function where one taking
arguments is expected, so every existing `() => doThing()` call site keeps compiling. Verified
against the repo's own `tsc`, in both directions:

```
// () => X  assignable to  (s: AbortSignal) => X       — OK, no error
// (s: AbortSignal) => X  assignable to  () => X       — error TS2322:
//   Target signature provides too few arguments. Expected 1 or more, but got 0.
```

The narrowing direction is the one that fails, and we would never need it. The only code a
retrofit could break is code that *itself invokes* an `AsyncDeferredResult` value — i.e. a
consumer reimplementing the scheduler, which is neither expected nor supported.

So there is no need to pre-commit the signature defensively. Ship without cancellation; add it
if a consumer asks.

Failure behaviour, separately: the `map*` family **keeps scheduling and aggregates every
error**, matching the sync contract. `allSucceedAsync` is the one member with an obvious
short-circuit, and it deliberately does not take it — consistency with `allSucceed`'s
aggregate-everything contract beats a faster failure path.

**OQ-5 — home and release tag — RESOLVED: `ts-utils`, tagged `@public`.**

This is core `Result` vocabulary and the sync siblings live there; splitting the family across
packages to dodge a stability obligation would be the tail wagging the dog.

**Tagged `@public`, not `@beta`.** The entire release line is pre-release, so `@beta` on an
individual export adds no information — and PR #588 established that stale `@beta` tags carry
real cost: promoting `DetailedResult` removed **168** `ae-incompatible-release-tags` warnings
from `ts-utils.api.md`, every one produced by a `@public` signature referencing a `@beta` type.
Shipping new `@beta` exports that `@public` code will reference would manufacture that same
liability from day one.

---

## 5. Scope note

Five collectors + `populateObjectAsync` + `firstSuccessAsync` + one scheduler. The scheduler is the only novel logic;
the five folds are near-copies of their sync siblings against a different input shape. Estimate
is **one session**, plus the in-repo migrations (`HybridRetriever`, the prompt-assist observer
fan-out, the bcp47 loader) which are optional and separable.

**Not in scope:** retry, timeout, or backoff inside the scheduler — those are orthogonal and
belong to the caller's work function. A scheduler that also retries is two primitives wearing
one coat.

---

## 6. Divergences found in implementation

Recorded so this document describes what shipped, not what was intended.

**`mapDetailedResultsAsync` deliberately diverges from its sync fold.** `mapDetailedResults`
ignores a failure whose `detail` is falsy (`result.detail && !ignore.includes(result.detail)`).
A rejected thunk has *no* detail, so a literal transposition would have **silently swallowed
rejected promises** — the same defect class as the safer-fetch body-read escape (#594). Capture
failures are therefore always reported and can never be ignored. The inner fold is otherwise
identical, falsy-detail quirk included; that quirk is pre-existing sync behaviour and changing
it is a separate, breaking decision.

**OQ-3's ambiguity assessment was too optimistic, for one member.** § 4 stated the ambiguous
overload case "surfaces as a type error rather than silent wrong behaviour." That holds for
four of the five collectors, whose second parameter is an options bag. It did **not** hold for
`allSucceedAsync`, whose second parameter is a caller-supplied `successValue: T`: a call with a
function-valued `successValue` *and* options type-checked cleanly under the deferred overload
and then failed at runtime with `func(...).then is not a function`.

Settled by discriminating on the **first** argument instead — deferred work is an iterable of
functions, items are arbitrary `TItem`. The residual is an `(items, fn)` call whose items are
themselves functions, which is rarer than what it rules out and expressible via the deferred
form. Note the rejected alternative: keying on `fn.length === 2` would misdispatch the common,
correct `(item) => ...` callback that ignores its index, trading a rare bug for a frequent one.

**Invalid `concurrency` clamps rather than fails.** Forced by `mapFailuresAsync`, which returns
`Promise<string[]>` and has no `Result` to fail into. `NaN` mattered specifically: an unguarded
`Math.min(NaN, …)` would have scheduled nothing and returned an array of holes.

## 7. Follow-up: migrating the in-repo call sites

The three hand-rolled sites in § 2(d) — `HybridRetriever`, the prompt-assist observer fan-out,
the bcp47 registry loader — are **not** migrated. They are left deliberately as a separate
stream, because migration is a **behaviour change, not a refactor**: those sites are unbounded today
and would pick up `DEFAULT_RESULT_CONCURRENCY` (8). That is the right default, but whether each
site wants it — versus `Number.POSITIVE_INFINITY` to preserve current behaviour — is a
per-site judgement about its workload, and should not ride along in a mechanical sweep.

---

## 8. Follow-on: detail-preserving async chaining (`AsyncDetailedResult`)

**Status: implemented; PR [#602](https://github.com/ErikFortune/fgv/pull/602) open against
`release`, not yet merged** — the `ts-utils-async-detailed-result` stream. (§ 1–§ 7 above describe
#596, which *is* merged; this section is newer and its status is tracked separately.) Recorded here
because this is the same family, found by the same kind of sweep, and the next person asking "does
the async side of `Result` cover `DetailedResult`?" should find the answer in one place.

### The gap, and why it was silent

§ 2–§ 5 above transposed the *collectors* to async. What none of them touched is the **chaining**
half of the surface — `thenOnSuccess` / `thenOnFailure`, which bridge a synchronous `Result` into
an `AsyncResult` chain.

`DetailedSuccess<out T, out TD> extends Success<T>` and `DetailedFailure<out T, out TD> extends
Failure<T>`. Both override `onSuccess` / `onFailure` to return `DetailedResult<TN, TD>`. **Neither
overrode `thenOnSuccess` / `thenOnFailure`**, so both inherited the base implementations, whose
signature is `thenOnSuccess<TN>(cb): AsyncResult<TN>` — no detail type parameter, and no
`AsyncDetailedResult` for them to return.

The consequence: `someDetailedResult.thenOnSuccess(async (v) => ...)` type-checked, returned
`AsyncResult<TN>`, and `TD` was gone.

**The dangerous part was that nothing failed at the chain site.** The loss surfaced later, as a
mismatch at whatever boundary expected the detail back — or not at all, if the caller was going to
widen anyway. A consumer whose failure taxonomy *is* its product could lose it by writing idiomatic
code. That is what makes this a primitive-level defect rather than a consumer-level one, and it is
the case `CODING_STANDARDS` § "Extending Core Libraries Over Working Around Them" names directly.

Surfaced by `safer-fetch-s3` (#601), which recorded the constraint rather than working around it:

> `thenOnSuccess` returns `AsyncResult<T>` and drops the `FetchFailureReason` detail, so async
> steps stay explicit awaits; that is a constraint of the current ts-utils surface, not a style
> choice.

### The shape chosen, and the one thing that forced it

`AsyncDetailedResult<T, TD>` is a sibling of `AsyncResult<T>` in the same sense
`DetailedSuccess` is a sibling of `Success` — which is to say **it extends it**, and that is not a
stylistic preference. It is the only shape that works.

A standalone class would not have: an override's return type must be assignable to the base
method's. `DetailedSuccess.onSuccess` can return `DetailedResult<TN, TD>` where `Success.onSuccess`
returns `Result<TN>` *only because* `DetailedSuccess extends Success` makes the former assignable to
the latter. The async override needs exactly the same property, so `AsyncDetailedResult<T, TD>` must
extend `AsyncResult<T>`. Confirming that this held — rather than tripping the variance problem the
brief flagged as the signal to prefer distinct method names — was the design's one real risk, and it
compiled on the first attempt.

Two consequences worth recording:

- **The rejection guard moves ahead of `super()`.** `AsyncResult`'s constructor converts a rejection
  to `fail<T>(...)` — a plain `Failure`. If the subclass let that happen it would resolve to
  something *typed* `DetailedResult` that was really a plain `Failure`: the exact silent-detail-loss
  bug, reintroduced one layer down. So the promise is guarded with `failWithDetail` *before* being
  handed to `super()`, and the base's own `.catch` is then unreachable. Both views observe the same
  settled values and cannot disagree.
- **`from` could not be overridden, so the static is named `fromDetailed`.** A static member
  narrowing its parameter from `Result` to `DetailedResult` is unsound on the static side, which
  *is* the contravariant-position signal the brief named — it just landed on the static rather than
  the instance surface, where renaming costs nothing. The inherited `AsyncResult.from` still works
  and still returns a plain `AsyncResult`.

Per OQ-2, the ladder goes exactly as far as the methods `AsyncResult` already has — `onSuccess`,
`thenOnSuccess`, `onFailure`, `thenOnFailure`, `withErrorFormat`, `aggregateError`, `report`,
`then`. **No new combinators were invented**, and there is deliberately no
`captureAsyncDetailedResult`: a captured throw has no detail to supply, so the function would
differ from `captureAsyncResult` only in its return type.

### Rejections and throws carry no detail — deliberately

A callback that throws synchronously or returns a rejected promise becomes a `DetailedFailure`
whose `detail` is `undefined`, never an escaped exception.

`undefined` is the only honest answer. The thrown error supplies no `TD`, and carrying the
*upstream* detail forward would pair this failure's message with a previous operation's detail —
on the success path it would additionally promote a *success* detail onto a failure. This matches
§ 6's `mapDetailedResultsAsync` divergence exactly: a work function that throws or rejects
"produces no detail at all, so there is nothing for `ignore` to match."

### The first consumer, measured

`saferFetch.ts` is the extension's first real consumer, which is what kept it from shipping
speculatively. The pass was measured rather than asserted, and the measurement is the finding:

| | before | after |
|---|---|---|
| `isFailure()`/`isSuccess()` checks | 21 | 18 |
| chaining calls | 12 | 15 |
| `_propagate` call sites | 11 | 8 |

Of the 21 checks, **7** are on an awaited `DetailedResult` — the only ones the gap could have
blocked — and **3** converted. The other 4 are exempt for reasons unrelated to this extension:
three are `_walk`'s hop-loop control flow (the exemption in `CODING_STANDARDS`, upheld by S3's own
reviewer), and one is `_runAttempt`'s retry branch, which reads `walked.detail` to decide whether to
recurse. The remaining 14 are on synchronous results or on plain `Result`s that never had a detail
to lose.

So **the ts-utils gap explained a minority of the file's imperative checks, and most of
`saferFetch.ts` legitimately stays imperative.** That was an anticipated outcome (OQ-3), and forcing
the remainder into chains to move the number would have cost readability for nothing.

The most telling number is the last row: `_propagate` — a helper that exists *only* to re-type a
failure across a stage boundary because the detail could not propagate through a chain — lost 3 of
its 11 call sites, with every existing test passing unmodified.

### One thing the conversion did change, and the general lesson in it

Catching an exception *earlier* is not free when the failure type is a taxonomy.

Moving `_receive` inside a `thenOnSuccess` callback meant that a throw from inside it — a bug in
this module rather than in a collaborator the guards already capture — no longer propagated as a
rejection to `_execute`'s top-level `captureAsyncResult`. `AsyncDetailedResult` catches it first and
yields `detail: undefined`, which is exactly right *for a chaining primitive*: a thrown error
supplies no reason and inventing one would be worse. But `safer-fetch`'s entire product is that
**every failure carries a machine-readable `FetchFailureReason`**, so a caller switching on
`detail.kind` would have faulted on `undefined`. Measured against both revisions:

| | before | after the pass | after the fix |
|---|---|---|---|
| `detail` | `{kind:'unknown', …}` | `undefined` | `{kind:'unknown', …}` |

Reconciled with `_withReason` at `_execute` — the single boundary where an `Outcome` becomes the
caller's result — which re-stamps a detail-less failure as `'unknown'` with the identical prefix.
Both contracts are right; the boundary between them is where they have to meet, and it is worth
naming because **any** consumer adopting `AsyncDetailedResult` with a non-optional detail
convention will meet the same seam.

### Why the in-repo migration is deferred again

§ 7 deferred migrating the collectors' hand-rolled call sites because migration there is a
*behaviour* change (unbounded → `DEFAULT_RESULT_CONCURRENCY`). This deferral is for a different and
weaker reason: **there is nothing to migrate.**

A sweep of every `thenOnSuccess` / `thenOnFailure` call site in the repo found 34 outside
`ts-utils`, and **none of them is on a `DetailedResult`**. The five other `DetailedResult` consumer
packages — `ts-json`, `ts-res`, `ts-json-base`, `ts-utils-jest`, `ts-web-extras` — do not use the
async bridge at all. `ts-agent-memory`, `ts-prompt-assist` and `tools/ks`, which use it heavily, do
not reference `DetailedResult` anywhere.

**No consumer is silently losing its detail today.** The trap was armed and only `safer-fetch` had
walked into it — which is consistent with `safer-fetch` being the package that surfaced it, since a
consumer whose taxonomy is its product is the one that notices. The corollary is that this fix is
preventive rather than remedial, and that a future migration stream would be adopting a new
capability, not repairing existing damage.
