[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / tag

# Function: tag()

> **tag**(`from`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTag`](../classes/LanguageTag.md)\>

Creates a new [language tag](../classes/LanguageTag.md) from a [language specifier](../type-aliases/LanguageSpec.md)

The supplied initializer must be at least
[well-formed according to RFC 5646](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9).
Higher degrees of validation along with any normalizations may be optionally specified.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | [`LanguageSpec`](../type-aliases/LanguageSpec.md) | The [language specifier](../type-aliases/LanguageSpec.md) from which the tag is to be created. |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | (optional) The [options](../interfaces/ILanguageTagInitOptions.md) used to construct and validate the tag. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTag`](../classes/LanguageTag.md)\>

`Success` with a valid [language tag](../classes/LanguageTag.md) or `Failure` with details
if an error occurs.
