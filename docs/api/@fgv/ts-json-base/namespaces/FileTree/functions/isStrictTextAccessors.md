[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / isStrictTextAccessors

# Function: isStrictTextAccessors()

> **isStrictTextAccessors**\<`TCT`\>(`accessors`): `accessors is IStrictTextFileTreeAccessors<TCT>`

Narrows accessors to [FileTree.IStrictTextFileTreeAccessors](../interfaces/IStrictTextFileTreeAccessors.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `accessors` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> |

## Returns

`accessors is IStrictTextFileTreeAccessors<TCT>`

## Remarks

Unlike the file-item guards, this one is a genuine capability check on the
store. Note it reports whether the store *implements* strict decoding, not
whether any particular file can be judged — a store that keeps some files as
bytes and others as already-decoded strings implements the capability and
fails per-file for the latter.
