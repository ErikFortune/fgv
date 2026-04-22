[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Iana](../README.md) / loadLanguageRegistriesFromZip

# Function: loadLanguageRegistriesFromZip()

> **loadLanguageRegistriesFromZip**(`zipPath`, `subtagsPath`, `extensionsPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

Loads language registries from a ZIP file containing the registry JSON files.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `zipPath` | `string` | `undefined` | Path to the ZIP file containing language-subtags.json and language-tag-extensions.json. |
| `subtagsPath` | `string` | `'language-subtags.json'` | Path to the language-subtags.json file within the ZIP (default: 'language-subtags.json'). |
| `extensionsPath` | `string` | `'language-tag-extensions.json'` | Path to the language-tag-extensions.json file within the ZIP (default: 'language-tag-extensions.json'). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

A Result containing the loaded LanguageRegistries or an error.
