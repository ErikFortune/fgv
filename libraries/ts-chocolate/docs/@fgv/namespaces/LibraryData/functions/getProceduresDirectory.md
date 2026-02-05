[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / getProceduresDirectory

# Function: getProceduresDirectory()

> **getProceduresDirectory**(`tree`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/navigation.ts:180](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/navigation.ts#L180)

Gets the procedures directory from a library tree.

## Parameters

### tree

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The root library FileTree item.

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the procedures directory or `Failure` if not found.
