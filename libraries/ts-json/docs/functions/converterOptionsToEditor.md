[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / converterOptionsToEditor

# Function: converterOptionsToEditor()

> **converterOptionsToEditor**(`partial?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonEditor`](../classes/JsonEditor.md)\>

Creates a new [JsonEditor](../classes/JsonEditor.md) from an optionally supplied partial
[JSON converter options](../interfaces/IJsonConverterOptions.md).
Expands supplied options with default values and constructs an editor with
matching configuration and defined rules.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `partial?` | `Partial`\<[`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)\> | Optional partial [IJsonConverterOptions](../interfaces/IJsonConverterOptions.md) used to create the editor. |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonEditor`](../classes/JsonEditor.md)\>
