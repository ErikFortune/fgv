[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Unsd](../../../../../README.md) / [Csv](../../../README.md) / [Converters](../README.md) / loadM49csvFileSync

# Function: loadM49csvFileSync()

> **loadM49csvFileSync**(`csvPath`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IM49CsvRow`](../../Model/interfaces/IM49CsvRow.md)[]\>

**`Internal`**

Loads a UNSD M.49 registry text (csv) file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `csvPath` | `string` | The path from which the file is to be loaded. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IM49CsvRow`](../../Model/interfaces/IM49CsvRow.md)[]\>

`Success` with the parsed file contents or `Failure` with
details if an error occurs.
