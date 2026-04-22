[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [JarConverters](../README.md) / loadRawSubtagRegistryFileSync

# Function: loadRawSubtagRegistryFileSync()

> **loadRawSubtagRegistryFileSync**(`path`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/RegistryFile.md)\>

Loads a text (JAR) format language subtag registry file and returns the registry format
with field names matching legacy test JSON format ("Suppress-Script", "Preferred-Value")
suitable for creating test JSON files that work with JAR converters.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The string path from which the registry is to be loaded. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/RegistryFile.md)\>

`Success` with the transformed registry format or `Failure` with details if an error occurs.
