[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [JarConverters](../README.md) / loadRawSubtagRegistryFromString

# Function: loadRawSubtagRegistryFromString()

> **loadRawSubtagRegistryFromString**(`content`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/RegistryFile.md)\>

Parses a text (JAR) format language subtag registry from string content and returns the registry format
with field names matching legacy test JSON format ("Suppress-Script", "Preferred-Value").

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `content` | `string` | The string content of the registry file to be parsed. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/RegistryFile.md)\>

`Success` with the transformed registry format or `Failure` with details if an error occurs.
