[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IExternalCommand

# Interface: IExternalCommand\<TDetails\>

One command a source executes, erased to `JsonValue` parameters by [ExternalTaskSource.command](../classes/ExternalTaskSource.md#command).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails"></a> `TDetails` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-handle"></a> `handle` | `readonly` | [`ITaskCommandHandle`](ITaskCommandHandle.md) | The erased handle to register on the task kind, so the broker validates with the same schema. |

## Methods

### apply()

> **apply**(`binding`, `request`, `expectedSourceRevision?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ExternalCommandResult`](../type-aliases/ExternalCommandResult.md)\<`TDetails`\>\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](ISourceBinding.md) |
| `request` | [`ICommandRequest`](ICommandRequest.md) |
| `expectedSourceRevision?` | [`ISourceRevision`](ISourceRevision.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ExternalCommandResult`](../type-aliases/ExternalCommandResult.md)\<`TDetails`\>\>\>
