[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Files](../README.md) / loadJsonPuzzlesFromTree

# Function: loadJsonPuzzlesFromTree()

> **loadJsonPuzzlesFromTree**(`fileTree`, `filePath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzlesFile`](../namespaces/Model/interfaces/IPuzzlesFile.md)\>

Loads a puzzles file from a [FileTree](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | FileTree containing the file |
| `filePath` | `string` | Path within the FileTree to the puzzles file |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzlesFile`](../namespaces/Model/interfaces/IPuzzlesFile.md)\>

`Success` with the resulting file, or `Failure` with details if an
error occurs.
