[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskKindHandle

# Interface: ITaskKindHandle\<T\>

The typed handle returned by a successful registration.

## Remarks

There is deliberately no `get<T>(id)` that trusts a caller-selected type. A handle
re-checks kind and detail version on every decode and obtains `T` through the
converter it was registered with, so a snapshot of another kind — or of another
version of the same kind — fails rather than being reinterpreted.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-commandnames"></a> `commandNames` | `readonly` | readonly `string`[] |
| <a id="property-detailversion"></a> `detailVersion` | `readonly` | `number` |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) |

## Methods

### decode()

> **decode**(`snapshot`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskSnapshot`](ITaskSnapshot.md)\<`T`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`ITaskSnapshot`](ITaskSnapshot.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskSnapshot`](ITaskSnapshot.md)\<`T`\>\>

***

### encode()

> **encode**(`snapshot`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskSnapshot`](ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`ITaskSnapshot`](ITaskSnapshot.md)\<`T`\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskSnapshot`](ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

***

### getCommand()

> **getCommand**(`name`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskCommandHandle`](ITaskCommandHandle.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskCommandHandle`](ITaskCommandHandle.md)\>
