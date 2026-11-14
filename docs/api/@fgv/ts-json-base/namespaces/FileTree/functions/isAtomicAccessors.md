[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isAtomicAccessors

# Function: isAtomicAccessors()

> **isAtomicAccessors**\<`TCT`\>(`accessors`): `accessors is IAtomicFileTreeAccessors<TCT>`

Type guard to check if accessors support atomic writes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `accessors` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The accessors to check. |

## Returns

`accessors is IAtomicFileTreeAccessors<TCT>`

`true` if the accessors implement [FileTree.IAtomicFileTreeAccessors](../interfaces/IAtomicFileTreeAccessors.md).
