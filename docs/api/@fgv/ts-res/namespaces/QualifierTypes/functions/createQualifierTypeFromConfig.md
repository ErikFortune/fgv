[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / createQualifierTypeFromConfig

# Function: createQualifierTypeFromConfig()

> **createQualifierTypeFromConfig**(`typeConfig`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

Creates a [QualifierType](../../../classes/QualifierType.md) from a configuration object.
This factory function determines the appropriate qualifier type based on the systemType
and delegates to the appropriate type-specific createFromConfig method.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `typeConfig` | [`IAnyQualifierTypeConfig`](../namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md) | The [configuration object](../namespaces/Config/interfaces/IQualifierTypeConfig.md) containing the name, systemType, and optional type-specific configuration. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\>

`Success` with the new [QualifierType](../../../classes/QualifierType.md)
if successful, `Failure` with an error message otherwise.
