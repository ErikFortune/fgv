[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / tags

# Function: tags()

> **tags**(`from`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTag`](../classes/LanguageTag.md)[]\>

Creates an array of [language tags](../classes/LanguageTag.md) from an incoming array of
[language specifiers](../type-aliases/LanguageSpec.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | [`LanguageSpec`](../type-aliases/LanguageSpec.md)[] | The array of [Bcp47.LanguageSpec](../type-aliases/LanguageSpec.md) to be converted. |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | (optional) The [options](../interfaces/ILanguageTagInitOptions.md) used to construct and validate any created tags. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTag`](../classes/LanguageTag.md)[]\>

`Success` with an array of [language tags](../classes/LanguageTag.md), or `Failure`
with details if an error occurs.
