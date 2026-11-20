[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IVectorReconcileReport

# Interface: IVectorReconcileReport

A record-vector reconcile.

## Extends

- [`IReconcileReportBase`](IReconcileReportBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-alreadyindexed"></a> `alreadyIndexed` | `readonly` | `number` | Records the index already held and which needed **no embedder call** — the whole point of a targeted repair, and the number that shows what it saved against a `rebuild`. |
| <a id="property-artifact"></a> `artifact` | `readonly` | `"record-vector"` | - |
| <a id="property-declined"></a> `declined` | `readonly` | `number` | Records the embedder intentionally declined. Not a failure, not a gap. |
| <a id="property-examined"></a> `examined` | `readonly` | `number` | Records of this kind considered. The denominator for everything else. |
| <a id="property-failed"></a> `failed` | `readonly` | readonly [`ISkippedVectorRecord`](ISkippedVectorRecord.md)[] | Records that failed, with the error. A fault, never a decline. |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The kind reconciled — named by the caller, so every count below is scalar. |
| <a id="property-repaired"></a> `repaired` | `readonly` | `number` | Records whose derived artifact was (re)produced by this call. |
| <a id="property-restamped"></a> `restamped` | `readonly` | `number` | Records whose vector the index held but whose envelope had **lost its `embeddingRef`** — repaired by restamping the reference, with no embedder call. **Remarks** This case is invisible to an `embeddingRef`-only check, which is one of the two reasons `IVectorIndex.has` is on the contract: a reference-absent record looks identical to a never-embedded one until you ask the index. |
