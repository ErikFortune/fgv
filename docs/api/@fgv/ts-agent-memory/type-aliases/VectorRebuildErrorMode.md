[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / VectorRebuildErrorMode

# Type Alias: VectorRebuildErrorMode

> **VectorRebuildErrorMode** = `"skip"` \| `"fail"`

How a vector-index rebuild treats a record it cannot index — whether the
**embedding** failed or the subsequent **add** did. Both are governed by this
one mode; neither is unconditionally fatal.

## Remarks

Deliberately mirrors the store's own open-time `onRecordError` mode, including
its default: `'fail'` preserves the historical all-or-nothing contract exactly,
and `'skip'` is opt-in. Defined here rather than imported from the store packlet
— the `vector` packlet does not depend on `store`, and the two modes describe
different domains that merely happen to share a shape.

A **decline** (a [MemoryEmbedder](MemoryEmbedder.md) resolving `undefined`) is not an error
and is unaffected by this mode: it is always **excluded** from the index and
counted on [IVectorRebuildReport.declined](../interfaces/IVectorRebuildReport.md#property-declined), **never** appearing in
[IVectorRebuildReport.skipped](../interfaces/IVectorRebuildReport.md#property-skipped). The word is worth being careful with here:
`skipped` is now a formal field meaning *a fault*, and a decline is the opposite.
