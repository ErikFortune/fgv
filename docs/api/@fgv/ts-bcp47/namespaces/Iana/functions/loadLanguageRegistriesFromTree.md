[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Iana](../README.md) / loadLanguageRegistriesFromTree

# Function: loadLanguageRegistriesFromTree()

> **loadLanguageRegistriesFromTree**(`fileTree`, `subtagsPath`, `extensionsPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

Loads language registries from a FileTree (web-compatible).

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `fileTree` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | `undefined` | The FileTree containing the registry JSON files. |
| `subtagsPath` | `string` | `'language-subtags.json'` | Path to the language-subtags.json file within the tree. |
| `extensionsPath` | `string` | `'language-tag-extensions.json'` | Path to the language-tag-extensions.json file within the tree. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

A Result containing the loaded LanguageRegistries or an error.
