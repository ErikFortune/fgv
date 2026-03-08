[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Csv](../README.md) / readCsvFileSync

# Function: readCsvFileSync()

> **readCsvFileSync**(`srcPath`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

**`Beta`**

Reads a CSV file from a supplied path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Source path from which the file is read. |
| `options?` | [`CsvOptions`](../interfaces/CsvOptions.md) | optional parameters to control the processing |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

The contents of the file.
