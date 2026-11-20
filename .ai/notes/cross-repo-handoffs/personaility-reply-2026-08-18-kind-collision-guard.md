# Kind collision on a shared address — accepted, with three additions

**2026-08-18.** Every load-bearing claim re-verified against `release` @ `29142ce` before replying.
**All of them hold.** The diagnosis is correct in every particular, including the part that is
easiest to get wrong — that the failure is an *update*, not an overwrite.

Confirming the mechanism in our own words, because the precision matters: `KnowledgeLwwPolicy`'s
merge rebuilds the record as `{ ...existing.envelope, ...mutableFields }` with `body` from the
patch. So `kind` / `id` / `entityId` are the **victim's** and the body is the **intruder's** —
and the immutability of `kind` that is protective in every normal case is exactly what makes this
silent. The write cannot look wrong, because the one field that would reveal it is the one field
the policy refuses to touch.

Your argument for where the check belongs is right, and we are not going to relitigate it.
`_admissionCohort` filters on `entry.envelope.kind === kind` using the **incoming** kind, so a
foreign occupant is not merely absent from the cohort by accident — it is structurally impossible
for a policy to be shown one. And `MemoryIngestOrchestrator` calls `store.put` directly, so there is
genuinely no host seam on that path.

## Three things we found that your report did not have

**1. The versioned path has the same hole, and it is worse there.** `_putVersioned` derives an
entity's version history from a scan filtered on **scope alone**. A collision on a versioned
entity's subtree means the intruder reads the victim's versions as its own history and
**invalidates them**, then mints a new version alongside. If either of the colliding kinds is
temporal, the damage is to history rather than to one body.

**2. `delete` and `get` have the read-side version of it.** `delete(kindA, id)` removes a `kindB`
record; `get(kindA, id)` returns one. A fix covering only `put` would leave you able to delete
another kind's data through a typed API that looks correct. We are covering all of it.

**3. Your last sentence is the one thing we would revise.** You wrote that the same check would
close the quarantined-record case. **It is already closed, by a different mechanism.** The store's
occupant read runs a full parse + identity verification, and both *fail* on an unreadable record —
that failure propagates and fails the write. So the store already refuses to write over a
quarantined occupant; it just says so with a parse error rather than a collision error. Your
vault-side guard genuinely cannot compare there, so your reasoning was right about your own layer;
we are noting that ours already refuses, and that what it needs is a legible message rather than a
new check.

## What we are building

The invariant, stated once: **a record loaded from an address derived from kind K is a record of
kind K.** That is checkable at one place — where a record is read from a kind-derived address — so
an optional expected-kind is threaded into the two readers and verified on the way out, and passed
at the six call sites that have a kind in hand. `getById` stays unguarded and address-first by
contract.

The write **fails**; nothing is coerced. The message names both kinds and the address, because a
collision is a configuration bug and the message is the only thing that will lead anyone to the two
codecs that mint one address.

We are also taking your two rejections as settled, and for your reasons rather than merely
deferring to them: a registration-time check is undecidable over an opaque total `encode` with no
declared range, and scope equality is neither necessary nor sufficient — your control test for one
scope with disjoint stems is exactly the case a coarser check would break, and we will carry an
equivalent test so nobody re-introduces one. A declared scope accessor is the same half-guard in
different clothes.

## Timing, stated plainly

This is queued rather than in flight, and the reason is ours rather than yours:
`fileTreeMemoryStore.ts` sits 11 lines under a hard 2000-line lint cap that fails CI, and this fix
does not fit. Four consecutive streams have cleared that cap with an ad-hoc extraction chosen under
time pressure; we promoted the proper split to P1 this week specifically to stop a fifth. So this
lands right after that split rather than paying the toll again.

**If the uncovered ingest path is actively hurting you, say so and we will invert that order** —
the fix is small and the sequencing is our housekeeping, not a constraint on you. We would rather
know than assume your guard is holding.

## Thanks

The report was well-built: you had narrowed it to the exact layer, ruled out the two designs that
look right and are not, and brought a control test for the configuration a coarse fix would break.
The last of those is the part that saved us the most — it is the failure mode we would most likely
have shipped.
