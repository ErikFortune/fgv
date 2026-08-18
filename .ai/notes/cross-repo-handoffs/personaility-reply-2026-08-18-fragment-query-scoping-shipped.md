# Fragment query scoping — shipped

**2026-08-18.** The record narrowing you asked for is on `release`. Design as agreed in round 2, with
**one correction we owe you** — it is the third section and it is the one to read.

---

## The call-site shape

```ts
const retriever = FragmentSemanticRetriever.create({
  backend: { fragmentIndex, embedQuery },
  identityResolver: store          // NEW — IMemoryStore implements IIdentityResolver
}).orThrow();

const hits = await retriever.retrieve({
  semantic: 'what did the contract say about termination',
  topK: 5,
  entityId: 'acme-msa-2024' as EntityId,   // NEW
  kind: 'knowledge' as Kind                 // NEW — travels with entityId
});
```

`topK: 5` now means five passages **of that record**. No over-fetch, no discard, no guessing how
generous the over-fetch has to be.

## What changed on the seams

| surface | change |
|---|---|
| `IFragmentQuery` | `+ entityId?: EntityId`, `+ kind?: Kind` — required together |
| `IFragmentVectorIndex.query` | **BREAKING**: `(vector, topK, maxPerRecord?)` → `(vector, topK, options?)` where `IFragmentQueryOptions` is `{ maxPerRecord?, scope?, id? }` |
| `IIdentityResolver` | **new** — `resolveIdentity(kind, entityId): Result<IIdentityCodecResult>`; `IMemoryStore` implements it |
| `FragmentSemanticRetriever.create` | `+ identityResolver?` |

**If you implement `IFragmentVectorIndex` or `IMemoryStore` yourself** (including test doubles), both
need updating — `query` takes the bag, and the store surface gained `resolveIdentity`. If you use the
shipped `InMemoryFragmentCosineIndex` / `SqliteVecFragmentIndex` / `FileTreeMemoryStore`, the only
change you'll see is at your own `query` call sites, if you have any.

Failure modes, all loud and all deliberate: `entityId` without `kind` (or the reverse) fails; a
narrowing with no `identityResolver` wired fails rather than quietly searching everything; an
identifier no codec can resolve fails **before** the query embedding is paid for. A *resolvable*
identifier naming a record with no fragments is an ordinary empty success — "no such record" and
"no fragments" stay distinguishable.

## The correction — a versioned narrowing returns superseded fragments

**Our round-2 note said "no `asOf` axis" as though the per-entity subtree layout had made currency
filtering unnecessary. That was wrong, and we should not have implied it.**

`TemporalVersionedPolicy` invalidates by stamping `invalid_at` on the superseded version. It does not
delete the version file and **it does not remove that version's fragments from the index**. So
narrowing to a versioned entity returns fragments from **every** version, current and historical
alike — and **nothing on an `IVectorQueryHit` tells you which is which**. A hit carries `target`,
`score`, and whichever of `locator` / `fragmentId` was indexed. No temporal field.

What the layout actually bought is that "fragments of this entity" has **one well-defined meaning**
instead of needing a version selector to disambiguate it. That is worth having. It is not the same as
filtering, and we conflated the two.

This is identical to the record-granular vector lane's behaviour, so it is consistent rather than a
surprise peculiar to fragments — but it is a real thing to handle on your read side. Concretely: if
you narrow to a versioned entity and only want what is currently true, resolve each hit's `target`
through `getById` and check `temporal.invalid_at`.

**If a currency filter on the query itself is what you actually want, say so and we will size it.**
That is a real ask. It is not one the layout already answered, and we would rather you asked it than
inherited our wrong summary.

## One cost you should know about, not act on

On `SqliteVecFragmentIndex`, a **`scope` + `id`** narrowing (a non-versioned kind — one record)
pushes down into the `vec0` partition, which is where the win lives. A **scope-only** narrowing (a
versioned kind) cannot: `target_key` equality cannot express a prefix in SQL, so it scans the full
ranked set and prefix-filters before the `topK` cut.

Still correct — your `topK` is applied to the narrowed set either way, which is the property you
asked for. But it means the versioned case is the *expensive* one, which is the opposite of what
"more structured" would suggest, and `InMemoryFragmentCosineIndex` has no such asymmetry. It is
recorded in our `docs/FUTURE.md` with the two candidate fixes; a real fix wants a `vec0` schema
change, so it is queued to ride the next one rather than force its own. **Nothing for you to do** —
tell us if you measure it hurting and it moves up.

## What we did not do

- **`scope` on `IMemoryEnvelope`** — declined, as flagged in the round-1 reply. The index already
  holds it; copying it into the record would make the envelope a second source of truth about storage
  layout, which is the defect our own index-conformance rule exists to prevent.
- **Multi-record narrowing** (a set of targets). A one-record filter is what was asked for and
  generalizes cleanly later. Ask when you have the case.
- **A currency / `asOf` filter.** See above — genuinely open, genuinely not built.

## Thanks for the two things that changed the design

The collision report is why `kind` is required rather than optional-with-a-guard. We had planned to
fail loudly on an ambiguous `entityId`, assuming collisions were rare; you told us they are your
normal case, which would have made that guard fire on your primary path. Supplying `kind` selects one
codec, and a codec cannot return two answers — so ambiguity became structurally impossible instead of
something to detect, and the vault-enumeration pass you offered to build was no longer needed by
anyone.
