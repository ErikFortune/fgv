[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / DerivedArtifact

# Type Alias: DerivedArtifact

> **DerivedArtifact** = `"rank"` \| `"record-vector"` \| `"fragment-vector"`

Which derived artifact a [IMemoryStore.reconcile](../interfaces/IMemoryStore.md#reconcile) call repairs.

## Remarks

**The operation names its artifact rather than repairing everything wired**,
and the reasons are structural rather than stylistic: the record and fragment
lanes are independently wirable (so an unnamed repair on a fragment-only store
would have to no-op or guess), their units are incommensurable (one vector per
record vs. N), and their costs differ by orders of magnitude — a measured case
put 68 fragments behind a single 56 KB record. An operation whose cost varies
that much along a dimension it does not name is the accidental-expense shape
`IMemoryStore.list`'s required selection exists to prevent.
