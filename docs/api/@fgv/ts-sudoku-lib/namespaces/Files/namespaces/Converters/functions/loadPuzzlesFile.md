[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../../../README.md) / [Files](../../../README.md) / [Converters](../README.md) / loadPuzzlesFile

# Function: loadPuzzlesFile()

> **loadPuzzlesFile**(`file`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzlesFile`](../../Model/interfaces/IPuzzlesFile.md)\>

Loads a puzzles file from a `IFileTreeFileItem`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | [`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `IFileTreeFileItem` to load. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzlesFile`](../../Model/interfaces/IPuzzlesFile.md)\>

`Success` with the resulting [IPuzzlesFile](../../Model/interfaces/IPuzzlesFile.md), or `Failure` with
details if an error occurs.
