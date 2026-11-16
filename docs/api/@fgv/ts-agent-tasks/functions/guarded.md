[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / guarded

# Function: guarded()

> **guarded**\<`T`\>(`guard`, `write`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\>

**`Internal`**

Runs `write` through `guard` when there is one. A gate that throws or rejects is a failure, never
an exception out of the helper.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `guard` | [`ITaskHostWriteGuard`](../interfaces/ITaskHostWriteGuard.md) \| `undefined` |
| `write` | () => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\> |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\>
