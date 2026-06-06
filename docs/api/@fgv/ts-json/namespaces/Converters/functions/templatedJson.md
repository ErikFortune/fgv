[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [Converters](../README.md) / templatedJson

# Function: templatedJson()

> **templatedJson**(`options?`): [`JsonConverter`](../../../classes/JsonConverter.md)

Helper function which creates a new [JsonConverter](../../../classes/JsonConverter.md) which converts an
`unknown` value to JSON, rendering any property names or string values using mustache with
the supplied context.  See the mustache documentation for details of mustache syntax and view.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`TemplatedJsonConverterOptions`](../../../type-aliases/TemplatedJsonConverterOptions.md)\> | [Options and context](../../../type-aliases/TemplatedJsonConverterOptions.md) for the conversion. |

## Returns

[`JsonConverter`](../../../classes/JsonConverter.md)
