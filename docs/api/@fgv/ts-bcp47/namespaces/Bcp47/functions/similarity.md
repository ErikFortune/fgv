[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / similarity

# Function: similarity()

> **similarity**(`t1`, `t2`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

Determine how similar two language tags are to each other.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t1` | [`LanguageSpec`](../type-aliases/LanguageSpec.md) | First tag to match, supplied as one of `string`, individual [subtags](../namespaces/Subtags/README.md), or constructed [language tag](../classes/LanguageTag.md). |
| `t2` | [`LanguageSpec`](../type-aliases/LanguageSpec.md) | Second tag to match, supplied as one of `string`, individual [subtags](../namespaces/Subtags/README.md), or constructed [language tag](../classes/LanguageTag.md). |
| `options?` | [`ILanguageTagInitOptions`](../interfaces/ILanguageTagInitOptions.md) | (optional) A set of [language tag options](../interfaces/ILanguageTagInitOptions.md) which control any necessary conversion or parsing. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

A numeric value in the range 1.0 (exact match) to 0.0 (no match).

## See

For a set of common levels of similarity, see [similarity](../variables/tagSimilarity.md).
