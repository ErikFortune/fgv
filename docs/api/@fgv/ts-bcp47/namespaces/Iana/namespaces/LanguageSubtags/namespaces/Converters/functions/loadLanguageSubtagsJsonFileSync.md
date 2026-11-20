[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Converters](../README.md) / loadLanguageSubtagsJsonFileSync

# Function: loadLanguageSubtagsJsonFileSync()

> **loadLanguageSubtagsJsonFileSync**(`path`): [`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../Model/type-aliases/RegistryFile.md)\>

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | String path from which file is to be loaded. |

## Returns

[`Result`](../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistryFile`](../../Model/type-aliases/RegistryFile.md)\>

`Success` with the resulting [registry file](../../Model/type-aliases/RegistryFile.md)
or `Failure` with details if an error occurs.
