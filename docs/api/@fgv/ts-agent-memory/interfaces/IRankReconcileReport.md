[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IRankReconcileReport

# Interface: IRankReconcileReport

A `rank` reconcile: re-run the projector and restamp what changed.

## Extends

- [`IReconcileReportBase`](IReconcileReportBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-artifact"></a> `artifact` | `readonly` | `"rank"` | - |
| <a id="property-examined"></a> `examined` | `readonly` | `number` | Records of this kind considered. The denominator for everything else. |
| <a id="property-failed"></a> `failed` | `readonly` | readonly [`ISkippedVectorRecord`](ISkippedVectorRecord.md)[] | Records that failed, with the error. A fault, never a decline. |
| <a id="property-kind"></a> `kind` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The kind reconciled — named by the caller, so every count below is scalar. |
| <a id="property-repaired"></a> `repaired` | `readonly` | `number` | Records whose derived artifact was (re)produced by this call. |
