[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / updateSystemConfigurationQualifierDefaultValues

# Function: updateSystemConfigurationQualifierDefaultValues()

> **updateSystemConfigurationQualifierDefaultValues**(`config`, `qualifierDefaultValues`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md)\>

Creates a copy of the provided [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md)
with updated qualifier default values.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md) | The base [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md) to copy. |
| `qualifierDefaultValues` | `Record`\<`string`, `string` \| `null`\> | Map of qualifier names to default values. Use `null` to remove existing values. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md)\>

`Success` with the updated [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md)
if successful, `Failure` with an error message otherwise.
