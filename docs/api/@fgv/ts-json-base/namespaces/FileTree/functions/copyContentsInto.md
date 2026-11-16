[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / copyContentsInto

# Function: copyContentsInto()

> **copyContentsInto**\<`TCT`\>(`source`, `destination`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ICopyReport`](../interfaces/ICopyReport.md)\>

Copies every child of a source directory into a destination directory, recursing for
subdirectories. The source directory itself is not reproduced — its contents are.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> | The directory whose contents to copy. |
| `destination` | [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\> | The directory to copy them into. Narrow with [isMutableDirectoryItem](isMutableDirectoryItem.md). |
| `options?` | [`ICopyOptions`](../interfaces/ICopyOptions.md) | Optional [options](../interfaces/ICopyOptions.md). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ICopyReport`](../interfaces/ICopyReport.md)\>

`Success` with an [ICopyReport](../interfaces/ICopyReport.md), or `Failure` with
a message naming the path that could not be copied.

## Remarks

Carries the same faithfulness guarantee as
[copyItemInto](copyItemInto.md); see its remarks.
