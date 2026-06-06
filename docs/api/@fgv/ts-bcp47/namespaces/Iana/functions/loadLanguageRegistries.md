[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Iana](../README.md) / loadLanguageRegistries

# Function: loadLanguageRegistries()

> **loadLanguageRegistries**(`root`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

Loads language registries from filesystem.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `root` | `string` | The root directory containing the registry JSON files or path to a ZIP file. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

A Result containing the loaded LanguageRegistries or an error.
