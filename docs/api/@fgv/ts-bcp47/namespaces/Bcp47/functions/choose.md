[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / choose

# Function: choose()

> **choose**(`desired`, `available`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTag`](../classes/LanguageTag.md)[]\>

Matches a list of desired [languages](../type-aliases/LanguageSpec.md) to a list of available [languages](../type-aliases/LanguageSpec.md),
return a list of matching languages ordered from best to worst.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `desired` | [`LanguageSpec`](../type-aliases/LanguageSpec.md)[] | An array of [language specifications](../type-aliases/LanguageSpec.md) containing an ordered list of preferred languages. |
| `available` | [`LanguageSpec`](../type-aliases/LanguageSpec.md)[] | An array of [language specifications](../type-aliases/LanguageSpec.md) containing an unordered list of available languages. |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) & [`ILanguageChooserOptions`](../interfaces/ILanguageChooserOptions.md) | (optional) Parameters to control language tag conversion or comparison |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTag`](../classes/LanguageTag.md)[]\>

`Success` with an ordered list of matching [languages](../classes/LanguageTag.md), or `Failure` with details if
an error occurs.
