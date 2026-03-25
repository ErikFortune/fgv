[**@fgv/ts-sudoku-lib**](../../../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../../../README.md) / [Files](../../../README.md) / [Converters](../README.md) / loadPuzzlesFile

# Function: loadPuzzlesFile()

> **loadPuzzlesFile**(`file`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzlesFile`](../../Model/interfaces/IPuzzlesFile.md)\>

Loads a puzzles file from a `IFileTreeFileItem`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | [`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `IFileTreeFileItem` to load. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzlesFile`](../../Model/interfaces/IPuzzlesFile.md)\>

`Success` with the resulting [IPuzzlesFile](../../Model/interfaces/IPuzzlesFile.md), or `Failure` with
details if an error occurs.
