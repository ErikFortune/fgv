[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentIndexCoverage

# Interface: IFragmentIndexCoverage

Coverage of the fragment-granular vector index.

## Remarks

**Aggregate only, and the reason is structural rather than an omission.** The
record lane has a per-record marker on the envelope (`embeddingRef`), so its
numerator falls out of the same free walk that produces the denominator. The
fragment lane has **no envelope marker at all** — nothing on a record says
whether it has fragments — so a per-kind numerator would cost one
`IFragmentVectorIndex.has` call per record, and coverage is contractually
cheap (see [IMemoryStore.coverage](IMemoryStore.md#coverage)).

The per-kind **denominator** is still available on
[IDerivedStateCoverage.records](IDerivedStateCoverage.md#property-records). A caller who needs the per-kind
numerator runs `reconcile(kind, 'fragment-vector')`, which reports it because
it is already paying for the walk.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-indexfragmentcount"></a> `indexFragmentCount` | `readonly` | `number` | Total fragments held — the fan-out. Mirrors `IFragmentVectorIndex.fragmentCount`. |
| <a id="property-indexrecordcount"></a> `indexRecordCount` | `readonly` | `number` | Records with at least one fragment held. Mirrors `IFragmentVectorIndex.recordCount`. |
