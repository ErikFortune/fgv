[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageTagExtensions](../../../README.md) / [JarConverters](../README.md) / loadRawLanguageTagExtensionsRegistryFromString

# Function: loadRawLanguageTagExtensionsRegistryFromString()

> **loadRawLanguageTagExtensionsRegistryFromString**(`content`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensionRegistryFile`](../../Model/type-aliases/LanguageTagExtensionRegistryFile.md)\>

Parses a text (JAR) format language tag extensions registry from string content and returns the registry format
with field names matching legacy test JSON format ("Contact_Email", "Mailing_List").

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `content` | `string` | The string content of the registry file to be parsed. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`LanguageTagExtensionRegistryFile`](../../Model/type-aliases/LanguageTagExtensionRegistryFile.md)\>

`Success` with the transformed registry format or `Failure` with details if an error occurs.
