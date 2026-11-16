[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / CapacityClaimDisposition

# Type Alias: CapacityClaimDisposition

> **CapacityClaimDisposition** = `"reserved"` \| `"consumed"` \| `"indeterminate"`

Whether a claim's charge is still reserved or has been converted to committed use.

## Remarks

A `reserved` claim's `charges` are what it *still* holds. A protected step spends from its
own claim and the claim's charges shrink by what was spent, so the ledger's
`used + reserved` is unchanged by a step that stays within its reservation — the committed
data replaces the reservation it was made from. A `consumed` claim reserves nothing; its
remaining charges are retained as evidence of what was released. (T3 revision: T1 described
conversion as a disposition change only, which cannot express a closeout path that spends
its reservation across two steps — the terminal transition and the archive.)

`indeterminate` is not an error state to clear on sight: ambiguity about whether a
claim was consumed fences admission and cleanup until recovery resolves it, because
the one thing a finite ledger must never do is assume the capacity is free.
