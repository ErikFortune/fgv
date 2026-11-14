[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / CapacityClaimPurpose

# Type Alias: CapacityClaimPurpose

> **CapacityClaimPurpose** = `"terminal-closeout"` \| `"first-resolution"` \| `"accepted-operation-settlement"` \| `"subscription-activation"` \| `"receipt-preparation"` \| `"admitted-source-replay"`

What a capacity claim reserves room for.

## Remarks

These six purposes are exactly the protected allocations: a task's terminal closeout,
an unresolved registration's first resolution, an accepted operation's settlement, a
subscription's activation, a subscription's reusable receipt preparation, and an admitted
source replay envelope.

`first-resolution` was added by T3. Design §8.6 requires that "any unresolved
registration also reserves first resolution and the path through terminal closeout" —
two bundles, not one — and T1's five purposes had nowhere to put the first.

`subscription-activation` replaced T1's `subscription-acknowledgement` in T7. A stored claim per
(subscription, update) would be committed in the task record and consumed in the consumer record —
two records, the cross-record ambiguity §8.6 warns against. Instead the audience link *is* the
reservation: a commit that adds links spends their acknowledgement evidence from the task's own
claims, and the subscription's ledger entry holds it, derived from its owed links, until the exact
ID lands in its history. What a subscription does need a stored claim for is the window between
its pending inventory entry and its live record, which is what `subscription-activation` holds.
