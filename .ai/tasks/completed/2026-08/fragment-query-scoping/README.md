# `fragment-query-scoping`

**Shipped 2026-08-18.** Breaking, on a pre-1.0 surface, across one contract with two
implementations. Docs #638 and implementation #639 into `integration/fragment-query-scoping`, then
one squash promotion to `release`.

---

## The problem, in one sentence

A fragment-semantic search could not be scoped to a record, so a document-scoped passage search had
to over-fetch globally and discard — which means **the requested `topK` was not the `topK` that
reached the index**, and the answer was exact only when the over-fetch happened to be generous
enough.

The consumer could not fix this at any cost. The truncation happened before they saw anything.

## The shape

```ts
interface IFragmentQuery {
  readonly semantic: string;
  readonly topK?: number;
  readonly maxPerRecord?: number;
  readonly entityId?: EntityId;   // NEW — travels with `kind`
  readonly kind?: Kind;           // NEW — selects the identity codec
}

interface IFragmentQueryOptions {  // NEW — replaces the positional `maxPerRecord?`
  readonly maxPerRecord?: number;
  readonly scope?: MemoryScopeKey;
  readonly id?: MemoryId;
}
```

Plus `IIdentityResolver` — `resolveIdentity(kind, entityId): Result<IIdentityCodecResult>`,
implemented by `IMemoryStore` — and an `identityResolver` on
`FragmentSemanticRetriever.create({ backend?, identityResolver? })`. Wire it as
`{ backend, identityResolver: store }`, mirroring the `{ index, resolver }` shape the
record-granular retrievers already take.

## Three things worth carrying forward

### 1. `kind` is required because it makes the resolution a function

The instinct is that `kind` is a filter, or decoration. It is neither. **`kind` selects the identity
codec, and the codec computes the storage address** — so `(kind, entityId) → target` is a
deterministic function, the same one `IMemoryStore.get(kind, entityId)` already performs.

This matters because the consumer's reply inverted the brief's default. The brief assumed a colliding
`entityId` across kinds was the rare case and planned to fail loudly on ambiguity. It is **the normal
case**: their ingestion produces a document `acme-corp` in `knowledge` and the entity `acme-corp` in
`entities`, by design. A fail-on-ambiguity guard would have fired on the primary path.

Once `kind` was in hand the question dissolved rather than needing an answer — a codec cannot return
two addresses. The index-walk resolution an earlier draft designed, and the vault-enumeration pass
the consumer offered to build, both went away as solutions to a problem the codec had already solved.

**Both halves travel together and a half-supplied narrowing is a `Failure`, not a best effort.** One
without the other is not a partial narrowing; it is not a narrowing at all. So is a narrowing with no
resolver wired — answering a scoped question with an unscoped result is the exact failure this
feature exists to remove.

### 2. A versioned narrowing returns superseded fragments, and nothing marks them

The brief and both handoff notes said the per-entity subtree layout meant "no `asOf` axis" — as
though versioning fell out of the layout completely. **It does not, and this stream had to correct
its own paper trail.**

`TemporalVersionedPolicy._invalidateCurrents` stamps `invalid_at` on the superseded version and
**never calls `fragmentIndex.remove`**. So a versioned narrowing returns every version's fragments,
current and historical alike, and an `IVectorQueryHit` carries `target` + `score` +
`locator?` / `fragmentId?` and **no temporal field at all**.

What the layout removed is the *ambiguity* — "fragments of this entity" has one well-defined meaning
instead of needing a version selector to disambiguate it. It did not remove the need to filter, if
filtering is what you want. This matches the record-granular vector lane exactly, so it is consistent
rather than surprising, but it is a real thing for a consumer to handle on their read side.

Verified against source rather than assumed. Corrected in five places, including a note already sent.

### 3. The gate that earned its keep

The brief required a test proving the narrowing precedes `topK`, and warned that **"a post-filter
passes every naive version of this test."** Both halves proved out.

The in-memory index was temporarily rewritten to score every record, cut to `topK`, and *then* drop
non-matching scopes:

- **The before-the-cut test went red** — `Expected length: 2, Received length: 0`. The fixture gives
  the colliding knowledge record five bare `cat` fragments scoring 1.0 and the fact versions
  `catfish` fragments scoring `1/√2`, so a global top-2 is entirely knowledge and a post-filter of it
  is empty.
- **The other two narrowing tests stayed green.** They query at `topK: 10`, generous enough that a
  post-filter still finds everything. Had the suite contained only those two, it would have passed a
  post-filter implementation and pinned nothing.

`TESTING_GUIDELINES.md` says a regression test you have not watched fail is a guess. This is what
following that literally looks like, and it is the second half — the tests that *stayed green* — that
makes the point.

## Costs recorded rather than paid

**`SqliteVecFragmentIndex` is asymmetric, and the asymmetry runs the wrong way.** A `scope` + `id`
narrowing pushes into the `vec0` `PARTITION KEY` (`AND target_key = ?`), which is where the predicted
win lands. Scope-only cannot — `target_key` equality cannot express a prefix — so it fetches the full
ranked set and applies a `scope\0` prefix filter before the `topK` cut. Correct either way, but it
makes the **versioned** kind the expensive case precisely because it is the more structured one.
`InMemoryFragmentCosineIndex` has no such asymmetry, so the two implementations agree on results
while diverging on cost — which is how this stays easy to miss. Filed to `docs/FUTURE.md` with a
trigger that folds it into the next `vec0` schema change rather than forcing its own (this package's
schema changes require a drop-and-re-index).

**The fourth max-lines toll.** `fileTreeMemoryStore.ts` was at **1999** lines with no room for the
identity resolution this stream needed; `storeIdentity.ts` was extracted, landing at 1989. Fourth
consecutive `ts-agent-memory` stream to pay an unplanned extraction — which fired that `TECH_DEBT.md`
entry's own promotion condition, so it is now **P1** and the split is scheduled work rather than
something to fold into the next feature. Each of the four extractions was chosen under time pressure
to clear a cap rather than on the seam that belonged there; all four are defensible and none was
*chosen*.

## Files

| file | what it holds |
|---|---|
| `brief.md` | the ask, verified claim-by-claim against `release`; the declined `IMemoryEnvelope.scope` route and why; four open questions |
| `result.md` | what shipped, all four OQs answered, the one divergence, the falsification run, the gate table |
| `meta.yaml` | index metadata |
