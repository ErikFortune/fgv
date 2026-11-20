[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / createQualifierTypeFromSystemConfig

# Function: createQualifierTypeFromSystemConfig()

> **createQualifierTypeFromSystemConfig**(`typeConfig`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../type-aliases/SystemQualifierType.md)\>

Creates a [SystemQualifierType](../type-aliases/SystemQualifierType.md) from a system configuration object.
This factory function determines the appropriate qualifier type based on the systemType
and delegates to the appropriate type-specific createFromConfig method.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `typeConfig` | [`ISystemQualifierTypeConfig`](../namespaces/Config/type-aliases/ISystemQualifierTypeConfig.md) | The [configuration object](../namespaces/Config/type-aliases/ISystemQualifierTypeConfig.md) containing the name, systemType, and optional type-specific configuration. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../type-aliases/SystemQualifierType.md)\>

`Success` with the new [SystemQualifierType](../type-aliases/SystemQualifierType.md)
if successful, `Failure` with an error message otherwise.
