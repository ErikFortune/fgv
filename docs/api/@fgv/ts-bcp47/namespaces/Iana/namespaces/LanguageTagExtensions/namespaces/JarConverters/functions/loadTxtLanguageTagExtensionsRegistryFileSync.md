[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageTagExtensions](../../../README.md) / [JarConverters](../README.md) / loadTxtLanguageTagExtensionsRegistryFileSync

# Function: loadTxtLanguageTagExtensionsRegistryFileSync()

> **loadTxtLanguageTagExtensionsRegistryFileSync**(`path`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensions`](../../Model/type-aliases/LanguageTagExtensions.md)\>

**`Internal`**

Loads language tag extensions registry data from a text (JAR-formatted) file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | String path from which registry data is to be read. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensions`](../../Model/type-aliases/LanguageTagExtensions.md)\>

`Success` with the loaded language tag extension data
or `Failure` with details if an error occurs.
