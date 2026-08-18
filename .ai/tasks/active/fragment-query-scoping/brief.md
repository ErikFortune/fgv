# Stream brief — `fragment-query-scoping`

**Status: QUEUED 🟢 — ready to start.** Filed 2026-08-18 from a PersonAIlity ask.
**Shape:** breaking, on a pre-1.0 surface, across two contracts and two implementations.

## The ask, verified

**Every load-bearing claim was re-verified against source on `release` (`b3d2483`) before
filing** — the standing rule for consumer asks. All four hold:

| claim | verified |
|---|---|
| `IFragmentQuery` is `{ semantic, topK?, maxPerRecord? }` with no way to scope to a record | ✅ `ts-agent-memory.api.md:318` |
| `IVectorQueryHit.target` is an `IEdgeTarget` — `{ scope, id }` | ✅ `:790`, `:250` |
| `IMemoryEnvelope` carries `id` and `entityId` but **no `scope`** | ✅ `:441` — thirteen members, none of them `scope` |
| `IFragmentVectorIndex.query(vector, topK, maxPerRecord?)` takes no target | ✅ `:349` |

The diagnosis is correct and the consequence is real: **the requested `topK` is not the
`topK` that reaches the index.** A document-scoped passage search must over-fetch globally
and discard, so the answer is exact only when the over-fetch happened to be generous enough.
That cannot be fixed on the consumer's side at any cost, because the truncation happens
before they see anything.

Their rejection of both workarounds is right, but **the reasoning on the first one needs
correcting, and the correction matters.** They call `id === entityId` "a projection detail our
own vault documents as deliberately avoided". Our own source asserts it as a **contract**, in
two places: `IMemoryEnvelope.entityId` is documented *"Consumer-supplied domain key. Equals
`id` for non-temporal kinds"* (`envelope.ts:124`), and the `EntityId` brand repeats it
(`ids.ts:17-23`). So relying on it for a non-temporal kind is not coupling to an accident.

**It is still the wrong route, for a better reason: it yields the wrong half.** A hit is
addressed by `{ scope, id }`; knowing `id === entityId` supplies `id` and says nothing about
`scope`, which is the half they actually lack. And it breaks outright on temporal kinds, where
the two deliberately diverge. Sending this back matters because a consumer told only *"don't
rely on it"* may reasonably conclude the equality is unstable and design around a
non-problem.

## One correction to send with the reply

**"There is no route from the identifier a caller has to the pair a hit is addressed by" is
narrowly false.** `IIndexedMemoryEntry` is `{ envelope, scope }` (`:385`), and
`IMemoryStore.listEntries()` (`:135`) returns every entry — **no selection required and no
file reads**. So an `entityId → scope` resolution is available today, envelope-only, without
either workaround they correctly rejected.

**It does not rescue the ask, and the reply must say so in the same breath.** It moves the
discard from after-resolution to before-resolution, which is worth having, but the
over-fetch and the wrong-`topK` are untouched — those are upstream of anything a caller can
do. Offering it as a fix would be answering a cheaper question than the one they asked.
Offer it as an interim, and only alongside the real change.

## Mission

Make a fragment search expressible as *"the best `topK` passages **of this record**"*, with
the narrowing applied **during selection, before `topK`**, so the requested `topK` is the
`topK` that reaches the index.

## Design direction — decided here, not asked

Per `CODING_STANDARDS.md` § "We Build General Capabilities", the shape is ours to settle;
only sequencing is theirs. The ask offers two routes and **the second should be declined**:

> *"or `IVectorQueryHit` / `IMemoryEnvelope` gains enough to resolve a hit's scope from an
> entity identifier without a read"*

**Declined: do not put `scope` on `IMemoryEnvelope`.** The index already holds it, on
`IIndexedMemoryEntry`. Copying it into the record makes the envelope a second source of truth
about storage layout — the exact defect our own index-conformance rule exists to prevent, one
level down. A record that can disagree with the index about where it lives is worse than a
record that does not know.

So: **the narrowing goes on the query, and is pushed into the index.**

### The crux the ask does not resolve

If the filter takes an `IEdgeTarget`, the caller still cannot construct one — that is the
complaint restated, not answered. If it takes an `EntityId`, the *index* cannot apply it,
because the index is keyed on `edgeTargetKey` and knows nothing about entity ids.

**Resolve it at the retriever, push a target at the index.** `FragmentSemanticRetriever`
resolves the caller's identifier to a target **once**, then passes a real target narrowing
down to `IFragmentVectorIndex.query`. That keeps the index seam honest (it deals in the keys
it actually holds) and lets the caller speak the identifier they actually have.

The cost is that `FragmentSemanticRetriever.create({ backend? })` (`:155`) currently takes
**no index and no resolver**, so it gains one — which is the same shape as the
`IRetrieverCreateParams` `{ index, resolver }` the record-granular retrievers already take,
so the family stays consistent rather than acquiring a second convention.

### Surface sketch, to be confirmed in design

```ts
interface IFragmentQuery {
  readonly semantic: string;
  readonly topK?: number;
  readonly maxPerRecord?: number;
  readonly entityId?: EntityId;   // NEW — narrowing, applied before topK
  readonly kind?: Kind;           // NEW — disambiguator; see OQ-1, which is answered
}

interface IFragmentVectorIndex {
  query(vector: Float32Array, topK: number, options?: {
    readonly maxPerRecord?: number;
    readonly target?: IEdgeTarget;   // NEW — applied during selection
  }): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;
}
```

Note the `query` signature is shown collapsing `maxPerRecord` into an options bag rather than
growing a fourth positional parameter. That is a **breaking** change to a seam with two
implementations; see OQ-3.

## Open questions

1. **~~Is `entityId` alone unambiguous?~~ Answered: no, and nothing promises it is.**
   `EntityId` is *"Consumer-supplied domain key… the package never mints identity"*
   (`ids.ts:17`). **No stated uniqueness beyond a scope**, and a vault has many scopes — so
   two scopes may legitimately carry the same `entityId`, and the resolution
   `entityId → IEdgeTarget` is **one-to-many in the general case**.

   This decides the signature rather than leaving it open: the narrowing **cannot** be
   `entityId` alone. Either it carries a disambiguator (`kind`, or the scope itself), or the
   retriever resolves and **fails loudly on ambiguity** rather than silently picking one —
   silently picking is the failure mode this whole ask exists to remove, reintroduced one
   level down. The design must pick; the brief's recommendation is *fail loudly*, because a
   consumer with a genuinely ambiguous id needs to know that, and a disambiguator they cannot
   supply is no better than the target they cannot construct today.
2. **What does a narrowing that matches nothing return?** An empty success is the obvious
   answer and is probably wrong: *"this record has no fragments"* and *"no such record"* are
   different, and the second is a caller bug. Consider a `Failure` for an unresolvable
   identifier and an empty success for a resolvable one with no fragments.
3. **Options bag vs. a fourth positional parameter on `query`.** The bag is better and is
   breaking for both `InMemoryFragmentCosineIndex` and `SqliteVecFragmentIndex` plus any
   consumer double. Pre-1.0, so allowed — but it must land in one PR with both
   implementations, per the shared-contract rule.
4. **Does the record lane want the same thing?** `IMemoryQuery` already narrows by
   `scope`/`kind`/`tag`/`provenanceSource`, so the record lane is not in the same bind. Worth
   one paragraph confirming this is genuinely fragment-only rather than a half-fix.

## Also in scope

- **`SqliteVecFragmentIndex` pushes the narrowing into SQL**, not into a post-filter. Its
  `target_key` is a `PARTITION KEY`, so a scoped query should be a partition-restricted KNN
  — which is where the actual performance win lives, and the reason this is worth doing in
  the library rather than by over-fetching.
- **`maxPerRecord` interacts with the narrowing.** With a single-record narrowing it is
  either redundant or a second cap on the same axis; say which, in the docstring.
- `LIBRARY_CAPABILITIES.md` — the fragment-retrieval decision shortcut currently tells a
  caller to query globally.

## Explicitly NOT in scope

- `scope` on `IMemoryEnvelope` (declined above, with reasoning).
- Multi-record narrowing (a set of targets). Wait for a second consumer; a one-record filter
  is what was asked for and generalizes cleanly later.
- Any change to the record-granular `IVectorIndex.query`. Different lane, different bind.

## Gates

- [ ] `rushx build` / `lint` / `test` at 100% coverage in `ts-agent-memory` **and**
      `ts-agent-memory-sqlite-vec`
- [ ] **Repo-wide `rush rebuild`** — this changes a shared contract with two implementations
      and test doubles, which is the checkbox four consecutive streams needed
- [ ] Change files for both packages
- [ ] A test proving the narrowing is applied **before** `topK` — i.e. that a scoped query
      returns `topK` hits from the target record when a global query at the same `topK`
      would have returned fewer. **Watch it fail** against a post-filter implementation
      first; a post-filter passes every naive version of this test.
- [ ] Both index implementations behave identically under the narrowing
- [ ] `code-reviewer` on the final diff before first push
- [ ] Consumer note: the correction above, the declined `IMemoryEnvelope.scope` route with
      its reasoning, and the resulting call-site shape
