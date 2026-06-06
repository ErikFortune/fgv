[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Files](../README.md) / loadJsonPuzzlesFromTree

# Function: loadJsonPuzzlesFromTree()

> **loadJsonPuzzlesFromTree**(`fileTree`, `filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzlesFile`](../namespaces/Model/interfaces/IPuzzlesFile.md)\>

Loads a puzzles file from a [FileTree](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | FileTree containing the file |
| `filePath` | `string` | Path within the FileTree to the puzzles file |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzlesFile`](../namespaces/Model/interfaces/IPuzzlesFile.md)\>

`Success` with the resulting file, or `Failure` with details if an
error occurs.
