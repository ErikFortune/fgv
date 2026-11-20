[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [Converters](../README.md) / richJson

# Function: richJson()

> **richJson**(`options?`): [`JsonConverter`](../../../classes/JsonConverter.md)

Helper function which creates a new [JsonConverter](../../../classes/JsonConverter.md) which converts a
supplied `unknown` to strongly-typed JSON, by first rendering any property
names or string values using mustache with the supplied context, then applying
multi-value property expansion and conditional flattening based on property names.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`RichJsonConverterOptions`](../../../type-aliases/RichJsonConverterOptions.md)\> | [Options and context](../../../type-aliases/RichJsonConverterOptions.md) for the conversion. |

## Returns

[`JsonConverter`](../../../classes/JsonConverter.md)
