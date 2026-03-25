[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / mergeDefaultJsonConverterOptions

# Function: mergeDefaultJsonConverterOptions()

> **mergeDefaultJsonConverterOptions**(`partial?`): [`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)

Merges an optionally supplied partial set of [options](../interfaces/IJsonConverterOptions.md) with
the default converter options and taking all dynamic rules into account (e.g. template usage enabled
if variables are supplied and disabled if not),  producing a fully-resolved set of
[IJsonConverterOptions](../interfaces/IJsonConverterOptions.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `partial?` | `Partial`\<[`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)\> | An optional partial [IJsonConverterOptions](../interfaces/IJsonConverterOptions.md) to be merged. |

## Returns

[`IJsonConverterOptions`](../interfaces/IJsonConverterOptions.md)
