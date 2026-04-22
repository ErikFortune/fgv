[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [JarConverters](../README.md) / loadTxtSubtagRegistryFileSync

# Function: loadTxtSubtagRegistryFileSync()

> **loadTxtSubtagRegistryFileSync**(`path`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../Model/type-aliases/RegistryFile.md)\>

**`Internal`**

Loads a text (JAR) format language subtag registry file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | The string path from which the registry is to be loaded. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../Model/type-aliases/RegistryFile.md)\>

`Success` with the resulting [registry file](../../Model/type-aliases/RegistryFile.md)
or `Failure` with details if an error occurs.
