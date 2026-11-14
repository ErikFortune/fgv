[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentReconcileReport

# Interface: IFragmentReconcileReport

A fragment-vector reconcile.

## Remarks

Note there is no `restamped`: the fragment lane has **no envelope marker**, so
there is no reference that can go missing and nothing to restamp. The
asymmetry with [IVectorReconcileReport](IVectorReconcileReport.md) is real rather than an oversight.

## Extends

- [`IReconcileReportBase`](IReconcileReportBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-alreadyindexed"></a> `alreadyIndexed` | `readonly` | `number` | Records already represented, needing no embedder call. |
| <a id="property-artifact"></a> `artifact` | `readonly` | `"fragment-vector"` | - |
| <a id="property-declined"></a> `declined` | `readonly` | `number` | Records whose embedder produced no fragments — this lane's decline. |
| <a id="property-examined"></a> `examined` | `readonly` | `number` | Records of this kind considered. The denominator for everything else. |
| <a id="property-failed"></a> `failed` | `readonly` | readonly [`ISkippedVectorRecord`](ISkippedVectorRecord.md)[] | Records that failed, with the error. A fault, never a decline. |
| <a id="property-fragments"></a> `fragments` | `readonly` | `number` | Fragments written by this call — the fan-out `repaired` cannot express. |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The kind reconciled — named by the caller, so every count below is scalar. |
| <a id="property-repaired"></a> `repaired` | `readonly` | `number` | Records whose derived artifact was (re)produced by this call. |
