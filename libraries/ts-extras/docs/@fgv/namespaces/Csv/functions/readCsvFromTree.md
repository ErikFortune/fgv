[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Csv](../README.md) / readCsvFromTree

# Function: readCsvFromTree()

> **readCsvFromTree**(`fileTree`, `filePath`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

**`Beta`**

Reads a CSV file from a FileTree.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The FileTree to read from. |
| `filePath` | `string` | Path of the file within the tree. |
| `options?` | [`CsvOptions`](../interfaces/CsvOptions.md) | optional parameters to control the processing |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

The parsed CSV data.
