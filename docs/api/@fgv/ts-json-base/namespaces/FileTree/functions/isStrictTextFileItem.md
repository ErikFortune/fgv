[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isStrictTextFileItem

# Function: isStrictTextFileItem()

> **isStrictTextFileItem**\<`TCT`\>(`item`): `item is IStrictTextFileTreeFileItem<TCT>`

Narrows a file item to [FileTree.IStrictTextFileTreeFileItem](../interfaces/IStrictTextFileTreeFileItem.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> \| [`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\> \| [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> |

## Returns

`item is IStrictTextFileTreeFileItem<TCT>`

## Remarks

Type narrowing only — see that interface's remarks. `FileItem` always
satisfies this guard; whether the call succeeds depends on the store.
