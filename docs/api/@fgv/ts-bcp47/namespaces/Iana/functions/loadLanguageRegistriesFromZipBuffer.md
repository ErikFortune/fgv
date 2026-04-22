[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Iana](../README.md) / loadLanguageRegistriesFromZipBuffer

# Function: loadLanguageRegistriesFromZipBuffer()

> **loadLanguageRegistriesFromZipBuffer**(`zipBuffer`, `subtagsPath`, `extensionsPath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

Loads language registries from a ZIP buffer containing the registry JSON files (web-compatible).

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `zipBuffer` | `ArrayBuffer` \| `Uint8Array`\<`ArrayBufferLike`\> | `undefined` | ArrayBuffer or Uint8Array containing the ZIP file data. |
| `subtagsPath` | `string` | `'language-subtags.json'` | Path to the language-subtags.json file within the ZIP (default: 'language-subtags.json'). |
| `extensionsPath` | `string` | `'language-tag-extensions.json'` | Path to the language-tag-extensions.json file within the ZIP (default: 'language-tag-extensions.json'). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageRegistries`](../classes/LanguageRegistries.md)\>

A Result containing the loaded LanguageRegistries or an error.
