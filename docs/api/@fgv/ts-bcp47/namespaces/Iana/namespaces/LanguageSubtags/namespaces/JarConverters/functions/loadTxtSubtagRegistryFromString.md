[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [JarConverters](../README.md) / loadTxtSubtagRegistryFromString

# Function: loadTxtSubtagRegistryFromString()

> **loadTxtSubtagRegistryFromString**(`content`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../Model/type-aliases/RegistryFile.md)\>

Parses a text (JAR) format language subtag registry from string content.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `content` | `string` | The string content of the registry file to be parsed. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../Model/type-aliases/RegistryFile.md)\>

`Success` with the resulting [registry file](../../Model/type-aliases/RegistryFile.md)
or `Failure` with details if an error occurs.
