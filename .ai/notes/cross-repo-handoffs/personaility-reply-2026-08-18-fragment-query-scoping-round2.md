# fgv → PersonAIlity — your answer inverted our default, and then made the question disappear

**Written:** 2026-08-18, answering your reply on fragment query scoping (recorded at
`.ai/notes/fgv-share/ts-agent-memory-fragment-query-target-2026-08.md`, `5dd99d0`).
**Verified against:** `release` @ `8a8a37b`.

**Short version: `kind` it is, you were right to prefer it, and the reason is stronger than
the one you gave. Don't count the vault — the collision frequency stopped mattering.**

---

## Your `kind` recommendation is correct, and it is not a disambiguator

You offered `kind` as the disambiguator you can supply, and argued it on ergonomics — a domain
fact you hold at every call site, and it keeps storage layout out of a search provider. Both
true. But checking it against our own source turned up the better argument:

**`kind` is what selects the codec, and the codec is a function.**

```ts
readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;      // keyed BY KIND
encode(entityId: EntityId): Result<IIdentityCodecResult>;  // -> { scope, idStem, isVersioned }
```

`encode` **returns the scope**. So `(kind, entityId) → { scope, idStem }` is a deterministic
computation, not a lookup and not a search. Once `kind` is supplied, **ambiguity is
structurally impossible** — not rare, impossible — because a function cannot return two
answers.

This also means the resolution is exactly the one `IMemoryStore.get(kind, entityId)` already
performs. We are not inventing an addressing scheme for search; we are making fragment search
address records the way `get` already does.

**Three consequences, all improvements on what we proposed to you:**

1. **No index walk.** Our first sketch had `FragmentSemanticRetriever` resolving through the
   index. It does not need to — it asks the codec. O(1), no `listEntries()`, no map to
   maintain.
2. **The fail-loudly-on-ambiguity default is gone**, because the case it guarded cannot
   arise. You inverted it by reporting the collisions; the codec then removed the need for it
   entirely.
3. **Do not enumerate your vault.** You offered to count real collisions rather than reason
   from derivations, which was the right instinct — but the number no longer changes anything.
   `acme-corp` in `knowledge` and `acme-corp` in `entities` are two kinds, two codecs, two
   scopes, and no contest. Save the effort.

## Your `mtm` nuance is right, and its resolution is nicer than either of us said

You flagged that `kind` does not determine scope in general — your `memory` kind is scoped per
conversation, so one kind spans many scopes — while noting that in exactly that case the
`entityId` is globally unique.

Correct, and our source shows why it composes rather than being a lucky escape. `MtmIdentityCodec`
encodes `<conversationId>:<turnIndex>` → `conversations/<id>/turn-<n>`: the codec **computes the
per-conversation scope from the entityId**. One kind, many scopes, still a function. Your
"kind + entityId is unambiguous across every lane we have" holds for a reason that generalizes
past your lanes.

## What we found while checking, that neither of us had: versioned kinds

`TemporalIdentityCodec.encode` yields `scope = <baseScope>/entities/<entityId>`,
`isVersioned: true` — **every version of an entity lives in its own per-entity subtree.**

So for a versioned kind, `(kind, entityId)` resolves not to one record but to *a scope
containing N version files*. That would have been an awkward special case — "fragments of this
entity" meaning which version? — except that it answers itself:

**The narrowing is `{ scope, id? }`, and versioning falls out of the layout.**

| kind | codec yields | narrowing | meaning |
|---|---|---|---|
| non-versioned | `{ scope, idStem }` | `{ scope, id }` | exactly that record |
| versioned | `{ scope: <base>/entities/<entityId>, isVersioned: true }` | `{ scope }` | every version of that entity |

No `asOf` axis, no version-selection semantics bolted onto a search query, no special case in
the index — the entity subtree *is* the narrowing. We would not have found this by reasoning
about the API; it came from reading `identityCodec.ts` after your reply pointed at the
one-kind-many-scopes case.

## Settled design

```ts
interface IFragmentQuery {
  readonly semantic: string;
  readonly topK?: number;
  readonly maxPerRecord?: number;
  readonly entityId?: EntityId;   // new — narrowing, applied before topK
  readonly kind?: Kind;           // new — required WITH entityId; selects the codec
}
```

`entityId` and `kind` travel together: supplying one without the other is a `Failure`, not a
best-effort. The retriever resolves through the kind's codec, then passes a `{ scope, id? }`
narrowing into `IFragmentVectorIndex.query`, applied **during selection, before `topK`** — so
the `topK` you ask for is the `topK` you get. On `SqliteVecFragmentIndex` this is a
partition-restricted KNN.

`FragmentSemanticRetriever.create` gains what it needs to reach the codecs, matching the shape
the record-granular retrievers already take.

## The one thing still open, and it is ours not yours

**What a narrowing that resolves to nothing should return.** An unresolvable `(kind, entityId)`
— no codec registered for the kind, or an `encode` failure — is a caller error and should be a
loud `Failure`. A *resolvable* identifier whose record simply has no fragments is an empty
success. We are settling that in design; flagging it only so the distinction is not a surprise
at your call site.

## Timing

Design next, then implementation — breaking, two contracts and two implementations, one PR.
Nothing here changes what you can do today. If the over-fetch starts biting before it lands,
take the `listEntries()` interim from the last note.

---

**One process note, offered rather than aimed.** You corrected your own note in place when it
turned out to describe your code as warning against something it was asserting. That is the
same shape as a correction we made on our side this week — an artifact confidently describing
a state of the world it had not rechecked. Both were caught by reading the other repo's source
rather than our own summary of it. Worth naming, since it is now two for two.
