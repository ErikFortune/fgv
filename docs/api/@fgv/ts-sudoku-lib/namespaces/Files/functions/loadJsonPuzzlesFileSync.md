[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Files](../README.md) / loadJsonPuzzlesFileSync

# Function: loadJsonPuzzlesFileSync()

> **loadJsonPuzzlesFileSync**(`path`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzlesFile`](../namespaces/Model/interfaces/IPuzzlesFile.md)\>

Loads an arbitrary JSON file and parses it to return a validated
[IPuzzlesFile](../namespaces/Model/interfaces/IPuzzlesFile.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | String path to the file |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzlesFile`](../namespaces/Model/interfaces/IPuzzlesFile.md)\>

`Success` with the resulting file, or `Failure` with details if an
error occurs.
