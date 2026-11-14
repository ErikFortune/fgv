[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSnapshot

# Interface: ITaskSnapshot\<T\>

A task envelope plus its kind-specific details.

## Remarks

At the heterogeneous boundary `T` is `JsonValue` — validated JSON, and deliberately
not a promise of any particular application type. A typed snapshot is obtained by
decoding through a registered [ITaskKindHandle](ITaskKindHandle.md), never by a caller asserting
the type it wants.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-details"></a> `details` | `readonly` | `T` |
| <a id="property-envelope"></a> `envelope` | `readonly` | [`ITaskEnvelope`](ITaskEnvelope.md) |
