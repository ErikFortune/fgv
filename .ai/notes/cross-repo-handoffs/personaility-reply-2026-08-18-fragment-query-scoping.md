# fgv → PersonAIlity — fragment query scoping: accepted, with two corrections and a design

**Written:** 2026-08-18, answering your `IFragmentQuery` target-filter ask.
**Verified against:** `release` @ `b3d2483`, not against the `.d.ts`.
**Status:** accepted. This states what we intend to build so you can disagree with something
concrete before we build it.

---

## Your diagnosis is right, including the part you called the sharper half

All four structural claims check out against source:

| your claim | verified |
|---|---|
| `IFragmentQuery` is `{ semantic, topK?, maxPerRecord? }` — no record scoping | ✅ |
| `IVectorQueryHit.target` is `{ scope, id }` | ✅ |
| `IMemoryEnvelope` carries `id` and `entityId` but **no `scope`** | ✅ — thirteen members, none of them scope |
| `IFragmentVectorIndex.query(vector, topK, maxPerRecord?)` takes no target | ✅ |

And the consequence is the part that matters: **the `topK` you request is not the `topK` that
reaches the index.** A document-scoped passage search has to over-fetch globally and discard,
so the answer is exact only when the over-fetch happened to be generous enough. **You cannot
fix that at any price on your side**, because the truncation happens before you see anything.
That is a defect in our surface, not a gap in your usage.

## Correction 1 — `id === entityId` is a contract of ours, not an accident

You wrote that relying on it "couples to a projection detail our own vault documents as
deliberately avoided". **Our source says the opposite, in two places:**

- `IMemoryEnvelope.entityId` — *"Consumer-supplied domain key. Equals `id` for non-temporal
  kinds."*
- the `EntityId` brand — *"The stable entity identity across versions; the package never mints
  identity. Equals `MemoryId` for non-temporal kinds."*

So for a non-temporal kind that equality is something we promise, and you may rely on it.

**You should still not use it here, for a better reason than the one you gave: it is the wrong
half.** A hit is addressed by `{ scope, id }`. Knowing `id === entityId` hands you `id` and
says nothing whatsoever about `scope` — which is precisely the half you are missing. It also
breaks outright on temporal kinds, where the two diverge by design.

We are correcting this because the version you were working from is more alarming than the
truth, and a reasonable reader of it would go on to design around an instability that is not
there.

## Correction 2 — there *is* a route today, and it does not rescue the ask

*"There is no route from the identifier a caller has to the pair a hit is addressed by"* is
narrowly false. `IIndexedMemoryEntry` is `{ envelope, scope }`, and **`IMemoryStore.listEntries()`
returns every entry with no selection and no file reads.** So `entityId → scope` is resolvable
today, envelope-only, without either workaround you correctly rejected.

**It is an interim, not a fix, and we are not offering it as one.** It moves your discard from
after-resolution to before-resolution — worth having, since it stops the reads the scoping was
meant to avoid, which is the cost you named. It leaves the over-fetch and the wrong `topK`
exactly where they are. If we sent you only this, we would be answering a cheaper question
than the one you asked.

Use it if it helps you before the real change lands. Do not build around it.

## What we intend to build

**The narrowing goes on the query and is pushed into the index, applied during selection,
before `topK`.**

```ts
interface IFragmentQuery {
  readonly semantic: string;
  readonly topK?: number;
  readonly maxPerRecord?: number;
  readonly entityId?: EntityId;   // new — narrowing, applied before topK
  // + a disambiguator; see the question below
}
```

`FragmentSemanticRetriever` resolves your identifier to a target **once**, then passes a real
target down to `IFragmentVectorIndex.query`. The index keeps dealing in the keys it actually
holds, and you keep speaking the identifier you actually have.

**On `SqliteVecFragmentIndex` this becomes a partition-restricted KNN** rather than a
post-filter — `target_key` is already a `PARTITION KEY` — which is the real reason this belongs
in the library instead of in a bigger over-fetch.

### Declined: `scope` on `IMemoryEnvelope`

Your ask offered this as the alternative route. We are not taking it, and the reason is a rule
we already hold ourselves to: the index holds `scope`, on `IIndexedMemoryEntry`. Copying it
onto the record would make the envelope a **second source of truth about storage layout** — a
record that can disagree with the index about where it lives. That is our own index-conformance
argument one level down, and it is the same reasoning you used on us in the coverage-accessor
exchange when you said a stored count that disagrees with its source is worse than none.

### What changes at your call site

`FragmentSemanticRetriever.create({ backend? })` gains an index/resolver, matching the
`{ index, resolver }` shape the record-granular retrievers already take. So the family keeps
one convention instead of acquiring a second. Expect a small wiring change, not a rewrite.

This is **breaking**, on two contracts and two implementations, and will land in one PR.

## The one question that is genuinely yours

Everything above we decided from our own design. This one we cannot answer from inside our
repo, because it is a fact about how you use the vault:

> **Do you ever have the same `entityId` in two different scopes?**

`EntityId` is a consumer-supplied domain key and we promise no uniqueness beyond a scope, so in
general `entityId → target` is one-to-many. That changes the signature:

- **If collisions cannot happen in your vault** — `entityId` alone is a sufficient narrowing,
  and the retriever can fail loudly on the ambiguity it should never see.
- **If they can** — the narrowing needs a disambiguator you can actually supply, and we need to
  know whether that is `kind`, the scope itself, or something else you hold.

Our default, absent an answer, is **fail loudly on ambiguity**: a consumer with a genuinely
ambiguous id needs to be told, and silently picking one would reintroduce exactly the
quiet-wrong-answer failure this whole ask exists to remove.

The second thing your evidence could change is **sequencing** — if this is blocking, say so and
it moves ahead of what is currently queued.

## Timing

Briefed and queued; not started. Nothing here blocks you today beyond the over-fetch you are
already living with.
