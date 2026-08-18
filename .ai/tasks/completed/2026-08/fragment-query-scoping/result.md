# Result — `fragment-query-scoping`

**Shipped 2026-08-18.** Implementation on `claude/fragment-query-scoping-impl` → PR #639 →
`integration/fragment-query-scoping`; docs on `claude/fragment-query-scoping` → PR #638 → the same
integration branch; one squash promotion to `release`.

## What shipped

A fragment-semantic search can be narrowed to one record, with the narrowing applied **during
selection, before the `topK` cut**.

```ts
interface IFragmentQuery {
  readonly semantic: string;
  readonly topK?: number;
  readonly maxPerRecord?: number;
  readonly entityId?: EntityId;   // NEW — travels with `kind`
  readonly kind?: Kind;           // NEW — selects the identity codec
}

interface IFragmentQueryOptions {   // NEW — replaces the positional `maxPerRecord?`
  readonly maxPerRecord?: number;
  readonly scope?: MemoryScopeKey;
  readonly id?: MemoryId;
}

interface IFragmentVectorIndex {
  query(vector: Float32Array, topK: number, options?: IFragmentQueryOptions): Promise<Result<…>>;
}
```

Plus `IIdentityResolver` (`resolveIdentity(kind, entityId): Result<IIdentityCodecResult>`),
implemented by `IMemoryStore`, and `FragmentSemanticRetriever.create({ backend?, identityResolver? })`
— matching the `{ index, resolver }` shape the record-granular retrievers already take.

**BREAKING** on `IFragmentVectorIndex.query`. Both implementations and the testbed scenario landed in
the same PR, per the shared-contract rule. Pre-1.0 per `ACTIVE_DEVELOPMENT.md`, so no shim.

## Open questions, answered

**OQ-1 — is `entityId` alone unambiguous?** Settled in the brief before implementation and unchanged
by it. `kind` selects the codec, the codec computes the address, so `(kind, entityId) → target` is a
function. Ambiguity is structurally impossible rather than merely unlikely.

**OQ-2 — what does a narrowing that matches nothing return?** The brief's suspicion was right, and the
implementation takes the split it proposed: an **unresolvable identifier fails** (no codec for the
kind, or the codec rejects the id — both caller errors, both loud), while a **resolvable identifier
naming a record with no fragments succeeds empty**. This falls out of the design rather than needing
a check: `resolveIdentity` encodes without touching storage, so it cannot distinguish "no such
record" from "record with no fragments" and does not pretend to. The narrowing is an *address*, and
an address that resolves to nothing is an ordinary empty result.

**OQ-3 — options bag vs. a fourth positional parameter.** Bag, as recommended. The narrowing needed
two more parameters, not one, and the third and fourth positional slots would have been two
`undefined`s at every uncapped call site.

**OQ-4 — does the record lane want the same thing?** No, and this is genuinely fragment-only rather
than a half-fix. `IMemoryQuery` already narrows by `scope` / `kind` / `tag` / `provenanceSource`, and
those axes are applied by the shared pre-filter before ordering and paging — so the record lane never
had the bind this stream fixes. The fragment lane had no narrowing axis at all, which is why its
`topK` was the one being spent on records the caller did not ask about.

## Divergences from the brief

**One, and it is a correction to the brief rather than to the code.** The brief and both handoff
notes said the per-entity subtree layout meant "no `asOf` axis" — as though versioning fell out of
the layout completely. It does not. `TemporalVersionedPolicy._invalidateCurrents` stamps `invalid_at`
on the superseded version and **never calls `fragmentIndex.remove`**, so a versioned narrowing returns
every version's fragments, current and superseded alike, and **nothing on an `IVectorQueryHit`
distinguishes them** — a hit carries `target` + `score` + `locator?` / `fragmentId?` and no temporal
field.

What the layout removed is the *ambiguity* ("fragments of this entity" has one meaning), not the
filtering. Verified against source rather than assumed, and corrected in five places: the
`IFragmentQueryOptions` docstring, `IFragmentQuery.entityId`, `_resolveOptions`,
`LIBRARY_CAPABILITIES.md`, and the round-2 handoff note. The consumer is told plainly, given the
read-side workaround (`getById` each hit's target, check `temporal.invalid_at`), and invited to ask
for a currency filter as a real ask rather than one already answered.

**The max-lines toll, again.** `fileTreeMemoryStore.ts` was at **1999** lines with no room for the
identity resolution this stream needed. `storeIdentity.ts` was extracted (codec lookup, identity
resolution, loaded-identity verification), landing at 1989. This is the **fourth consecutive**
`ts-agent-memory` stream to pay an unplanned extraction to clear the cap, which is exactly the
condition `TECH_DEBT.md`'s own entry named for promotion — so that entry is now **P1**.

## The gate that mattered: watching the test fail

The brief required a test proving the narrowing is applied **before** `topK`, and warned that "a
post-filter passes every naive version of this test." Both halves proved out.

The in-memory index was temporarily rewritten to score every record, cut to `topK`, and *then* drop
non-matching scopes. Against that sabotage:

- **The `before the topK cut` test went red**: `Expected length: 2, Received length: 0`. The fixture
  gives the colliding knowledge record five bare `cat` fragments scoring 1.0 and the fact versions
  `catfish` fragments scoring `1/√2`, so a global top-2 is entirely knowledge and a post-filter of it
  is empty.
- **The other two narrowing tests stayed green.** They query at `topK: 10`, which is generous enough
  that the post-filter still finds everything. That is the brief's warning made concrete: had the
  suite contained only those two, it would have passed a post-filter implementation and pinned
  nothing.

Restored and re-verified green afterward.

## Review

**Layer 1 (`code-reviewer`, pre-push)** — one P1, two P2s, one P3, all resolved:

1. **P1 — dead branch.** `_selectRecords` re-derived through `options?.` after an early return that
   already implied `options !== undefined`, producing an optional-chain arm that could not fire.
   Narrowed once instead. Coverage went from a masked gap to a genuine `100 | 100 | 100 | 100`.
2. **P2 — narrowing validated after the paid call.** `_resolveOptions` ran after `embedQuery`, so a
   typo'd `kind` bought a network round trip before failing. Moved ahead of it; pinned with a
   call-counting test asserting `embedCalls === 0` on a bad narrowing and `1` on a good one.
3. **P2 — every versioned test used mocks or fixtures.** No test wrote two versions of a temporal
   entity through a real `FileTreeMemoryStore` with a real fragment index and embedder and confirmed
   a scope-narrowed query returned both. Three now do, in
   `test/unit/store/fragmentEmbedOnWrite.test.ts`.
4. **P3 — the scope-only scan cost was undocumented.** Filed to `docs/FUTURE.md` with what a real fix
   would need.

**Layer 2 (Copilot on #639)** — round 1 returned **three findings, all real**, and none of them a
nitpick. That is a useful data point on its own: layer 1 had passed clean on this diff, so the
substantive round-1 profile matches `CODING_STANDARDS.md`'s note that a native-boundary package
(here `SqliteVecFragmentIndex` over `better-sqlite3` / `vec0`) under-covers the runtime-edge class at
layer 1 — but the two *other* findings were pure-TS and layer 1 should have caught them.

1. **A throwing `identityResolver` escaped `retrieve()`.** `resolveIdentity` was called bare while
   the two backend hooks were normalized through `_callBackend`. `IIdentityResolver` is exactly as
   consumer-injectable as they are, so a throw broke the `Promise<Result<...>>` contract. Wrapped in
   `captureResult`; pinned by a test with a throwing resolver.
2. **`address.idStem as MemoryId` asserted a brand the library validates.** `idStem` is a plain
   `string` on the codec result, but `MemoryId` **is** the filename stem by contract and
   `Convert.memoryId` is what enforces the portable-stem rule. The assertion is now a validation, so
   a resolver returning `nested/stem` fails loudly rather than querying the index with an id that
   matches nothing and reads as an ordinary empty result. Pinned.
3. **`SqliteVecFragmentIndex` over-fetched an already-partition-restricted query.** `fetchK` expanded
   to the table-wide `fragmentCount` whenever `maxPerRecord` was set — including under a
   single-record narrowing, where the query is already restricted to one partition. The cap forces
   the full ranked set *only* when other records can fill from behind a capped one; with one record
   the result is exactly `min(topK, maxPerRecord, fragments)` and those are the first rows KNN
   returns, so `k = topK` suffices. Fixed, and the guard test was **verified discriminating** by
   sabotaging `k` to 1 on the single-record path and watching exactly it (and the sibling
   before-the-cut test) go red.

Gates re-run green after the fixes, repo-wide `rush rebuild` included.

**Round 2 returned nothing** — no new threads, no new comments. **Stopped there on diminishing
returns**, at 2 rounds: round 1 was entirely substantive and every finding was fixed with a test,
round 2 found nothing to add. Per `CODING_STANDARDS.md` the stop criterion is the finding profile
rather than the round count, and a round that surfaces zero findings after a round that surfaced
three real ones is the clearest version of that signal.

**One thing layer 1 should have caught and did not**, worth naming rather than filing under
"native-boundary packages are a known blind spot": findings 1 and 2 are pure-TS repo-pattern issues
— an un-normalized consumer hook next to two normalized ones, and a brand asserted where the library
ships a validator for it. The native-boundary allowance covers finding 3, not those two.

## Costs recorded rather than paid

`SqliteVecFragmentIndex` pushes a `scope` + `id` narrowing into the `vec0` partition
(`AND target_key = ?`), which is where the win the brief predicted actually lands. **Scope-only
cannot** — `target_key` equality cannot express a prefix — so it fetches the full ranked set and
applies a `scope\0` prefix filter before the `topK` cut. Correct either way (the caller's `topK` is
applied to the narrowed set, which is the property that matters), but it makes the *versioned* kind
the expensive case precisely because it is the more structured one, and `InMemoryFragmentCosineIndex`
has no such asymmetry — so the two implementations agree on results while diverging on cost, which is
how this stays easy to miss. Filed to `docs/FUTURE.md` with the two candidate fixes and a trigger
that folds it into the next `vec0` schema change (this package's schema changes require a
drop-and-re-index, so it should not force its own).

## Gates

| gate | status |
|---|---|
| `rushx build` in both packages | ✅ |
| `rushx lint` in both packages | ✅ |
| `rushx test` at 100% coverage in both packages | ✅ `100 \| 100 \| 100 \| 100` |
| repo-wide `node common/scripts/install-run-rush.js rebuild` | ✅ exit 0, **zero** warnings |
| `rush change --verify --target-branch origin/release` | ✅ both packages |
| a test proving the narrowing precedes `topK`, **watched failing** first | ✅ see above |
| both index implementations behave identically under the narrowing | ✅ |
| `code-reviewer` on the final diff before first push | ✅ |
| Copilot loop driven by implementer, stopped on diminishing returns | ✅ 2 rounds (3 findings → 0) |
| `LIBRARY_CAPABILITIES.md` updated | ✅ |
| consumer note | ✅ round-2 note, plus the correction above |
