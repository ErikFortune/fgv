# Stream brief — `vector-rebuild-report-by-kind`

**Status: QUEUED 🟢 — ready to start.** Filed 2026-08-15 out of a four-round exchange with
PersonAIlity that began as their ask 1 of 9 ("an empty vector index is indistinguishable from an
unmatched query") and ended somewhere neither side started.

**Shape:** breaking, on a pre-1.0 surface, by agreement. `@fgv/ts-agent-memory`.

## How this got here, because the path is the justification

Their original ask shipped in `5.1.0-48`. They closed it, then noticed the arithmetic did not
add up: a rebuild over a store whose `embedKinds` omits some kinds leaves those records in none
of `indexed` / `declined` / `skipped`, so a caller computing coverage undercounts **in the
direction of looking healthier**.

Their proposed fix — `excluded: number` on `IVectorRebuildReport` — was in the wrong layer, and
we said so: `rebuild` never sees excluded records, because `asRecordSource()` applies the
`embedKinds` filter upstream. They conceded and named the lesson themselves: *"we proposed the
fix at the layer where we noticed the symptom rather than the layer where the decision is made."*

They then countered that a **bare** `excluded: number` reproduces the exact defect the whole
thread was about — a number that reads identically in the healthy and the broken case. We agreed
and extended it to `declined`, which they had not named. They then asked the question that
settles the design: **what is the rule, so the next person is not deciding a fourth field by
re-running this argument?**

That question inverted the answer we were about to give. See "The rule" below.

## The rule

> **Every count in a coverage report is resolved by kind, because such a report exists to answer
> *"is my coverage what I intended?"*, and no bare total can answer that — in either direction.**

The tempting exception — that `indexed` is the positive case and recoverable from the index —
was **tested and is false**. From `etc/ts-agent-memory.api.md`: `IVectorQueryHit` carries
`target` (`{ scope, id }`) and **not** `kind`; `query` takes a probe vector and a `topK`, so it
answers "what is near this" rather than "what is in here"; and `IVectorIndex` exposes no
enumeration — `size` is a scalar. The positive case is no more recoverable from the index than
the negative ones.

`indexed` is in fact the **more** dangerous count to leave bare: it is the number a coverage
surface actually renders, so 500 `ingestion-job` rows with zero `knowledge` is a healthy-looking
number for a catastrophically broken index.

## Mission

```ts
interface IVectorRebuildReport {
  readonly indexed: ReadonlyMap<Kind, number>;
  readonly declined: ReadonlyMap<Kind, number>;
  readonly excluded?: ReadonlyMap<Kind, number>;
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;   // unchanged
}
```

- **`skipped` needs no change.** Per-record already implies per-kind and carries the error besides.
- **Totals stay derivable by summing.** Nothing is asserted that could disagree with itself —
  the property the consumer asked for from the start.
- **Optionality is per-field and semantic, not uniform.** Only `excluded` is optional, because
  only the *source* can genuinely not know. `indexed` and `declined` are knowable by
  construction: the rebuild either added the vector or the embedder answered.

### `excluded` requires a seam change

`IMemoryRecordSource.list()` must report what it filtered — the count has to originate where the
decision is made. Rejected alternatives, with reasons, so they are not re-litigated:

- **A store accessor (`excludedRecordCount()`).** Additive and non-breaking, but it answers a
  *different question* than the report does — "excluded right now" versus "excluded in this
  reconcile" — and those legitimately differ whenever records are written between reconciles.
  Two correct-and-unequal numbers is worse than one incomplete number: it invites treating a
  real difference as a bug, or picking whichever supports the conclusion you already hold. This
  argument is the consumer's and it is better than the one we gave.
- **Moving the `embedKinds` filter into `rebuild`.** Costs nothing (`listScoped()` already
  materializes the whole vault before filtering, so the saving was only ever the embed call) but
  pushes a store concern — `Kind`, `embedKinds` — into the `IVectorIndex` contract that
  `SqliteVecVectorIndex` and every consumer implementation would inherit.

### Bundled: decouple coverage from the error-handling mode

Under `onRecordError: 'fail'` the failure path returns `fail(error)` and **no report**, so
coverage is unavailable exactly when a caller most wants it. The consumer's framing, which we
are implementing against: *returning a report alongside the failure is strictly more information
at no semantic cost.*

**Do not change the `'fail'` contract.** It still resets, still aborts, still returns a failure —
the all-or-nothing rollback is load-bearing and the consumer relies on it. It simply also
carries what it had established before it stopped. Nothing a caller may assume changes.

## Docstring obligation — this is a deliverable, not a nicety

The consumer asked for the sentence that stops this thread recurring. It must land on
`IVectorRebuildReport`, and the last clause is the part that does the work:

> Every count in this report is resolved by kind. A coverage report exists to answer *"is my
> coverage what I intended?"*, and a bare total cannot: `indexed: 500` reads identically whether
> the right kinds were indexed or a policy drift silently redirected coverage, and the same is
> true of every other count here. Totals are derivable by summing; the per-kind breakdown is not
> derivable from anything else. **A new count added to this report is resolved by kind unless
> there is a stated reason it cannot be.**

That inverts the default: kind-resolution becomes automatic and the burden falls on the
exception.

## Breaking-change posture

`indexed` and `declined` change type, so **every existing reader of the report breaks**,
including the consumer's. Accepted knowingly by both sides: cheaper now than after they build
their coverage surface on the current shape. `@fgv/ts-agent-memory` is pre-1.0 with a no-shim
posture, so no compatibility layer.

**Coordination is required and is not optional.** Their bump tooling takes the whole `@fgv` set
at once, so a breaking seam change arrives with everything else and gets discovered by a red
build rather than by reading. Flag the alpha that carries this; do not let it land silently.

## Explicitly NOT in scope

- **Changing the `'fail'` contract.** Not asked for, and the rollback is relied upon.
- **A records-seen-at-last-reconcile count.** Superseded — summing the maps gives it.
- **Anything on `IVectorIndex.query`.** The consumer's original option 3 became unnecessary once
  `size` landed; do not revisit.
- **The fragment index.** `IFragmentVectorIndex` has no rebuild report; out of scope here.

## Gates

- [ ] `rushx build` / `rushx lint` / `rushx test` green, 100% coverage, in `ts-agent-memory` **and** `ts-agent-memory-sqlite-vec`
- [ ] Repo-wide `rush rebuild` — this changes a shared contract; test doubles in `samples/` and `tools/` are the usual casualty
- [ ] Change file for every touched package
- [ ] A test proves the totals still sum to what a caller would compute
- [ ] A test proves `'fail'` returns a report **and** still resets and fails
- [ ] A test proves a source that does not report exclusion yields `excluded === undefined`, distinct from an empty map
- [ ] `LIBRARY_CAPABILITIES.md` updated in the same PR
- [ ] `code-reviewer` on the final diff before first push

## Reply owed

Whether they want it staged (`excluded` + `declined` now, `indexed` later) or in one change. We
prefer one; they said they are not blocked either way.
