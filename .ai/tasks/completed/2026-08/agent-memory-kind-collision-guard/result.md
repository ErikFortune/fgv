# Result — `agent-memory-kind-collision-guard`

**Shipped 2026-08-21 via #648** (`6afde57d`). Behaviour-changing on `@fgv/ts-agent-memory`'s
store read and write paths; pre-1.0, no shim.

*(Finalized retroactively 2026-08-22. The stream shipped with its brief, its change files and
its consumer note, but was never migrated out of `.ai/tasks/active/` and never got a ledger
entry — so `docs/WORKSTREAMS.md` was silent on a shipped stream, which is what prompted the
consumer's "did we ship this or is it another dropped task" a day later. The code was never
in doubt; the bookkeeping was.)*

## What shipped

One invariant, enforced at the one layer that can see both sides:

> **A record loaded from an address derived from kind K is a record of kind K.**

`verifyOccupantKind(expected, scope, idStem, record)` in `storeIdentity.ts`, threaded through
the readers and applied at every call site that has a kind in hand. The write fails; nothing
is coerced, nothing is repaired.

```
memory address '<scope>/<idStem>' is occupied by a record of kind '<found>', not
'<expected>': two identity codecs mint the same address
```

The message names both kinds and the address deliberately: a collision is a **configuration**
bug — two codecs minting one address — and the message is the only thing that leads anyone to
the cause.

`getById` stays **address-first and unguarded**, and a test pins that. No kind is in play
there, so there is nothing to compare against and guarding it would break the contract.

## The failure was worse than an overwrite

Not "the second write wins". The store read the occupant and never compared its kind, so the
write applied as an **update**: `KnowledgeLwwPolicy._rebuild` spreads `...existing.envelope`
and sets `body: merged.body`, and `kind` is immutable to every write policy. So the victim
kept its own `kind` / `id` / `entityId` and took the intruder's body, while the intruder's own
`list` returned nothing. `put` returned `succeed(...)`. Neither side reported anything.

## Three things the ask did not have, all confirmed and all fixed

The consumer's diagnosis was correct in every particular — each of their seven claims was
verified against source before commissioning. What the brief added:

1. **The versioned path has the same hole and a larger blast radius.** `_versionsForEntity`
   filters on `entry.scope === scope` **and nothing else**, so an intruder colliding on a
   versioned entity's subtree would read the victim's versions as its own history and
   **invalidate them**, then mint a new version alongside.
2. **`delete` and `get` have the read-side version of it.** `delete(kindB, id)` removed a
   `kindA` record through a typed API that looked correct. A `put`-only fix would have left
   a consumer able to delete another kind's data.
3. **The quarantined-record case was already closed, by a different mechanism.** The
   consumer asked for this check to cover it; it does not need to. `_readRecord` runs
   `parseMemoryFile` + `_verifyLoaded`, both of which fail on an unreadable occupant, and
   that failure already fails the write — loudly, but with a parse error rather than a
   collision error. Told to them directly, since their own vault-side guard genuinely cannot
   compare there.

## What was refused, and why the consumer was right to rule it out

- **A registration-time check.** Undecidable: `encode` is an opaque total function over an
  unbounded domain with no declared range. Scope equality is neither necessary (their two
  built-in kinds share a root and never collide — a working configuration a scope check
  would reject) nor sufficient (one scope with disjoint stems is safe; they hold a passing
  control test for exactly that, and so do we now).
- **A declared scope accessor on `IIdentityCodec`.** They rejected this on their own side
  first, for the right reason: a declaration the codec does not honour is the same half-guard
  in different clothes.
- **Content-hash dedup as a mitigation.** `_contentHash(kind, body, links)` already takes
  `kind` as an input, so a cross-kind false positive was impossible. Verified; nothing to do.

## The sequencing call was taken the expensive way, deliberately

`fileTreeMemoryStore.ts` was at **1989 lines against a 2000-line `max-lines` cap** — a CI
failure, not a warning. Eleven lines of headroom does not fit a helper plus threading across
six call sites at that file's comment density.

The brief laid out the two options and recommended the harder one: do the `TECH_DEBT.md` **P1**
split first rather than take a **fifth** consecutive ad-hoc extraction to clear the cap. Four
prior streams had taken the ad-hoc route, each choosing its extraction under time pressure
rather than on the seam that belonged there — which is why the P1 entry existed at all.

That is what happened. `storeFileAccess.ts` (156 lines) came out on a seam, as a **separate
commit**, with `api.md` byte-identical. 1989 → 1885 at the time; 1907 today.

## The defect CodeRabbit found, and why nothing else could have

The first version threaded `expectedKind` into `_readVersionedCurrent` and **never consumed
it**. The parameter was accepted, passed, and ignored — so the versioned read path looked
guarded and was not.

**A 100% coverage gate cannot see this**, because every line still ran. It is the exact shape
`TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called" was
written about, one layer in: not a caller that stopped passing a value, but a callee that
stopped reading one. Fixed, with the missing test added and **watched failing** first.

## Gates

| gate | result |
|---|---|
| `rushx build` / `lint` / `test` (`@fgv/ts-agent-memory`) | pass, 100% coverage |
| repo-wide `rush rebuild` | pass |
| change files | two — the guard and the split, separately |
| a test per guarded call site, watched failing first | 8 tests in `kindCollision.test.ts` |
| the control test the consumer warned about | *"two kinds sharing one scope with disjoint stems both work"* |
| `getById` stays unguarded | pinned |
| consumer note | `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-18-kind-collision-guard.md` |

## Not in scope

- Any change to `IIdentityCodec`'s surface.
- Making the quarantined-occupant message mention collision — it is a parse failure and
  saying so is accurate; conflating them would be worse.
- A host-side seam on the ingest path. The consumer asked for the check in the store precisely
  so no such seam is needed, and that is where it went.
