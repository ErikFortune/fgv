# Reply — the `excluded` count, and the decline-path question

**Answering:** your close-out of the vector-index coverage ask, 2026-08-15, verified against `5.1.0-49`.

Two answers. **§4 first, because it is unambiguous good news. §3 needs a correction — your diagnosis is right and the fix you propose cannot work where you have put it.**

---

## §4 — yes, the decline-path pruning is in `-48` and `-49`

It is there, and your inability to confirm it from the bundle is structural rather than a gap: it lives in an `@internal` collaborator that does not surface in the `.d.ts` rollup.

`VectorMaintenance` was extracted from the store in **#616** (a `max-lines` refactor forced by CI), and the decline/exclusion path sits in `vectorMaintenance.ts`. Earliest tag containing it: **`@fgv/ts-agent-memory_v5.1.0-48-alpha`**. Confirmed by `git tag --contains`, not inferred.

The behaviour you were looking for:

> A decline on a record that **was** embedded drops the inherited `embeddingRef` **and** removes the stale vector — because clearing the reference alone is worse than doing nothing: the index entry survives and keeps answering queries on the record's superseded content while the record itself claims not to be indexed.

The `remove` runs **only when a reference was actually inherited**, so the ordinary decline (a record never embedded) still costs no index round trip. A failed `remove` is logged and the reference is dropped anyway — best-effort, like the rest of the vector path.

**How to see it from outside:** you cannot, from the type surface. Drive it instead — put a record with an embedder that embeds, re-put it with an embedder that declines, then `query`. The stale vector should be gone. That is the only externally visible proof, which is a fair criticism of the shape.

---

## §3 — the arithmetic gap is real. `excluded` on the report cannot close it.

**`rebuild` never sees excluded records.** The filter is applied by the *source*, upstream of the index:

```ts
// FileTreeMemoryStore.asRecordSource()
list: async () => (await this.listScoped()).onSuccess((scoped) =>
  succeed(scoped.filter((s) => this.embedsKind(s.record.envelope.kind)))
)
```

So `IVectorRebuildReport` counts exactly what it was handed, and `indexed + declined + skipped.length` is a correct total **of the source's yield**. Adding `excluded: number` would require `rebuild` to report a population that structurally never reaches it — the index has no concept of `Kind` or `embedKinds`, and giving it one to make a count work would be the wrong trade.

**But you are right that a caller computing coverage against the vault gets a number biased toward healthy**, and right that this is silent. The mismatch is real; it just lives at the source boundary, not the report.

### Why the obvious fix is tempting and still wrong

Move the filter from `asRecordSource` into `rebuild` and it sees everything, skips excluded kinds without calling the embedder, and can count them. Cost is unchanged — `listScoped()` already materializes the whole vault before filtering, so the saving was only ever on the embed call.

It fails on layering. `IVectorIndex` is implemented by `SqliteVecVectorIndex` and by anything you write; teaching every implementation about `embedKinds` to fix a count would push a store concern into the index contract.

### The three shapes that actually work

1. **`IMemoryRecordSource.list()` reports what it filtered** — `{ records, excluded }` or similar. The count originates where the decision is made. Breaking on a pre-1.0 seam with one in-repo implementation; our preference, and it keeps your "one structure, total derivable rather than asserted" property.
2. **A store accessor** — `excludedRecordCount()` alongside `embedsKind`. Additive, non-breaking, but it is a second number that can disagree with the first, which is the thing you explicitly did not want.
3. **Derive it today, no API change** — `listScoped()` minus `asRecordSource().list()`. Correct right now, and two full vault materializations, so fine for a diagnostic and not for a hot path.

**We are inclined to (1).** Tell us if you would rather have (2) sooner; it is smaller and we would not have to coordinate a seam change with your adoption.

## The coupling you named in passing — agreed, and it is the sharper point

> "can I see coverage?" and "should one bad record empty my index?" are currently the same switch.

That is a real design defect and we would not have separated those on our own. Under `onRecordError: 'fail'` the failure path returns `fail(error)` and no report, so coverage is unavailable exactly when a caller most wants it.

We are not changing the `'fail'` contract — you did not ask us to, and the all-or-nothing semantics are load-bearing for callers who want a clean empty index over a partial one they cannot reason about. But **returning a report alongside the failure** is not the same thing as making `'fail'` lenient, and it decouples the two switches. Worth doing in the same change as whichever of (1)/(2)/(3) we land.

## What we would like back

Your preference between (1) and (2), and whether the coupling fix matters enough to bundle. If (1), we will want to coordinate the `IMemoryRecordSource` change with your adoption rather than shipping it into an alpha you pick up unawares.
