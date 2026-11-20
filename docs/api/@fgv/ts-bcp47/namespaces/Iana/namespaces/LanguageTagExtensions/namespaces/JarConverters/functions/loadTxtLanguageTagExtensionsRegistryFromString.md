[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageTagExtensions](../../../README.md) / [JarConverters](../README.md) / loadTxtLanguageTagExtensionsRegistryFromString

# Function: loadTxtLanguageTagExtensionsRegistryFromString()

> **loadTxtLanguageTagExtensionsRegistryFromString**(`content`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensions`](../../Model/type-aliases/LanguageTagExtensions.md)\>

Parses language tag extensions registry data from string content.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `content` | `string` | The string content of the registry file to be parsed. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensions`](../../Model/type-aliases/LanguageTagExtensions.md)\>

`Success` with the loaded language tag extension data
or `Failure` with details if an error occurs.
