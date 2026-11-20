[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageTagExtensions](../../../README.md) / [JarConverters](../README.md) / loadRawLanguageTagExtensionsRegistryFileSync

# Function: loadRawLanguageTagExtensionsRegistryFileSync()

> **loadRawLanguageTagExtensionsRegistryFileSync**(`path`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensionRegistryFile`](../../Model/type-aliases/LanguageTagExtensionRegistryFile.md)\>

Loads a text (JAR) format language tag extensions registry file and returns the registry format
with field names matching legacy test JSON format ("Contact_Email", "Mailing_List") suitable for
creating test JSON files that work with JAR converters.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The string path from which the registry is to be loaded. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensionRegistryFile`](../../Model/type-aliases/LanguageTagExtensionRegistryFile.md)\>

`Success` with the transformed registry format or `Failure` with details if an error occurs.
