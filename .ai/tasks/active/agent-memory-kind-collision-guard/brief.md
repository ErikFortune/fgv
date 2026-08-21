# Stream brief — `agent-memory-kind-collision-guard`

**Status: QUEUED 🟢 — diagnosis verified, fix shape settled, blocked on a sequencing call.**
Filed 2026-08-18 from a PersonAIlity ask, itself filed from a defect they fixed as far as their
side can reach.
**Shape:** small, behaviour-changing on the store's write path, pre-1.0.

## The defect

A record is addressed by `(scope, idStem)`. **The address carries no `kind` component.** Two
registered kinds whose identity codecs can mint the same address therefore name one record file.

The failure is worse than an overwrite: the second write applies as an **update to the first
record**, and because `kind` is immutable to every write policy, the victim keeps its own kind and
takes the intruder's body. The intruder's own `list` comes back empty. Nothing fails.

## Every claim in the ask, verified against `release` @ `29142ce`

| claim | verdict | evidence |
|---|---|---|
| the address carries no kind | ✅ | `fileTreeMemoryStore.ts:877` — `codec.encode(entityId)` yields `{ scope, idStem, isVersioned }` |
| the store reads the occupant and never compares its kind | ✅ | `_writeResolved` → `_readRecord(scope, idStem)` (`:948`); no kind comparison anywhere on the path |
| victim keeps its kind, takes the intruder's body | ✅ | `KnowledgeLwwPolicy._rebuild` (`writePolicy.ts:279`) spreads `...existing.envelope` and sets `body: merged.body` — so `kind` / `id` / `entityId` are the **victim's**, the body is the **intruder's** |
| the intruder's `list` comes back empty | ✅ | by construction: the record is filed under the victim's kind |
| neither side reports anything | ✅ | `put` returns `succeed({ record, evicted: [] })` |
| `IWritePolicy.admit` cannot close it | ✅ | `_admissionCohort` (`:1503`) filters `entry.envelope.kind === kind` on the **incoming** kind, so a foreign occupant is structurally never in the cohort |
| the orchestrator's ingest path bypasses a host-side `put` wrapper | ✅ | `ingest/orchestrator.ts:802` calls `this._store.put(record)` directly |

**The diagnosis is correct in every particular, and the reasoning about where the check belongs is
correct too.** The store is the only place that sees both the incoming record and the existing
occupant on every write path.

### Three things the ask did not have

1. **The versioned path has the same hole, and it is worse there.** `_putVersioned` derives the
   entity's version history from `_versionsForEntity(scope)` (`:1196`), which filters on
   `entry.scope === scope` **and nothing else**. An intruder colliding on a versioned entity's
   subtree would read the victim's versions as its own history and **invalidate them**, then mint
   a new version alongside. Same root cause, larger blast radius.

2. **`delete` and `get` have the read-side version of it.** `_deleteFlat` (`:1154`) reads the
   occupant and deletes it with no kind check, so `delete(kindA, id)` removes a `kindB` record.
   `get(kindA, id)` (`:513`) returns the `kindB` record. A fix that covers only `put` leaves a
   consumer able to delete another kind's data through a typed API that looks correct.

3. **The quarantined-record case is already closed, differently.** `_readRecord` runs
   `parseMemoryFile` + `_verifyLoaded`, both of which **fail** on an unreadable occupant, and that
   failure propagates through `.thenOnSuccess` and fails the `put`. So the store already refuses
   that write — loudly, but with a message about parsing rather than about collision. This does
   not need the new check; it needs the message to be legible. Worth telling the consumer, whose
   own guard genuinely cannot compare there.

## Fix shape

**The invariant to enforce, stated once:** *a record loaded from an address that was derived from
kind K is a record of kind K.* That is checkable at exactly one place — the point where a record is
read from a kind-derived address.

Thread an **optional expected kind** into the two readers and verify on the way out:

- `_readRecord(scope, idStem, expectedKind?)` — verify `record.envelope.kind === expectedKind`.
  Optional because `getById(scope, id)` takes a raw address with no kind in play, and must keep
  working.
- `_versionsForEntity(scope, expectedKind?)` / `_readVersionedCurrent(scope, expectedKind?)` — same.

Then pass the kind at the call sites that have one: `get` (`:511`, `:513`), `put` flat (`:948`),
`put` versioned (`:1233`), `delete` flat (`:1154`), and the versioned delete (`:1435`). Leave
`getById` / `listEntries` / the resolver seam (`:1605`) unguarded — they are address-first by
contract.

**Failure, not repair.** The write fails; nothing is coerced. The message must name both kinds and
the address, because a collision is a **configuration** bug — two codecs minting one address — and
the message is the only thing that will lead anyone to the cause.

## Explicitly NOT in scope

- **A registration-time check.** The consumer established it is undecidable, and they are right:
  `encode` is an opaque total function over an unbounded domain with no declared range. Scope
  equality is neither necessary (two kinds sharing a root that never collide — a working
  configuration a scope check would reject) nor sufficient (one scope with disjoint stems is safe;
  they hold a passing control test for exactly that).
- **A declared scope accessor on `IIdentityCodec`.** Also rejected on their side, for the right
  reason: a declaration the codec does not honour is the same half-guard in different clothes.
- **Content-hash dedup.** `_contentHash(kind, body, links)` already takes `kind` as an input, so a
  cross-kind false positive is impossible. Verified, nothing to do.

## The sequencing problem — read before commissioning

`fileTreeMemoryStore.ts` is at **1989 lines against a 2000-line `max-lines` cap**, and that cap is
a **CI failure**, not a warning. Eleven lines of headroom does not fit a helper plus threading
across six call sites at this file's comment density.

So this stream cannot land without either:

- **(a)** the `TECH_DEBT.md` **P1** `fileTreeMemoryStore.ts` split happening first, or
- **(b)** a **fifth** consecutive ad-hoc extraction to clear the cap.

That P1 entry was promoted on 2026-08-18 precisely because four consecutive streams took (b), each
choosing its extraction under time pressure to clear a cap rather than on the seam that belonged
there — and it says in terms that the split should be scheduled work rather than folded into the
next feature. **Taking (b) here would be the fifth instance of the thing that entry exists to
stop.** Recommend (a), with this stream immediately after it.

## Gates

- [ ] `rushx build` / `lint` / `test` at 100% coverage in `@fgv/ts-agent-memory`
- [ ] Repo-wide `rush rebuild` — this changes store behaviour that `samples/testbed` exercises
- [ ] Change file for `@fgv/ts-agent-memory`
- [ ] A test per guarded call site — `put` flat, `put` versioned, `delete`, `get` — each
      **watched failing** against the unguarded implementation first, since a guard that has never
      been seen to fire is a guess
- [ ] A control test proving the *legal* configuration still works: two kinds sharing a scope root
      with disjoint stems, which the consumer specifically warns a coarser check would break
- [ ] A test pinning that `getById` stays unguarded and address-first
- [ ] Consumer note: confirmation, the three additions above, and the quarantine nuance
