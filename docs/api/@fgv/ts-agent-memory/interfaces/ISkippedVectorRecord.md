[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ISkippedVectorRecord

# Interface: ISkippedVectorRecord

A record a rebuild could not index — because the embed failed or because the
subsequent add did — retained so a partial rebuild reports what it lost rather
than merely how much it kept.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | `string` | The failure message, from either the embed or the subsequent add. |
| <a id="property-target"></a> `target` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | The scope-qualified address of the record that could not be indexed. |
