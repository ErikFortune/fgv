[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryRecord

# Interface: IMemoryRecord\<TBody\>

A complete memory record: the invariant [IMemoryEnvelope](IMemoryEnvelope.md) plus the
typed, per-kind body. The store's public surface uses
`IMemoryRecord<unknown>`; consumers narrow `TBody` by checking
`envelope.kind` and validating through the registered Converter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tbody"></a> `TBody` | `unknown` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `TBody` | The per-kind, Converter-validated body. |
| <a id="property-envelope"></a> `envelope` | `readonly` | [`IMemoryEnvelope`](IMemoryEnvelope.md) | The invariant identity + transaction-time envelope. |
