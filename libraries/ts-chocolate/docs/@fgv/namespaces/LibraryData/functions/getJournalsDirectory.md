[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / getJournalsDirectory

# Function: getJournalsDirectory()

> **getJournalsDirectory**(`tree`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/navigation.ts:160](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/navigation.ts#L160)

Gets the journals directory from a library tree.

## Parameters

### tree

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The root library FileTree item.

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>\>

`Success` with the journals directory or `Failure` if not found.
