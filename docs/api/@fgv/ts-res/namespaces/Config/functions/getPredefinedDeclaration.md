[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / getPredefinedDeclaration

# Function: getPredefinedDeclaration()

> **getPredefinedDeclaration**(`name`, `initParams?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md)\>

Returns the [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md) declaration for the
specified predefined system configuration.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`PredefinedSystemConfiguration`](../type-aliases/PredefinedSystemConfiguration.md) | The name of the predefined system configuration. |
| `initParams?` | [`ISystemConfigurationInitParams`](../interfaces/ISystemConfigurationInitParams.md) | Optional [initialization parameters](../interfaces/ISystemConfigurationInitParams.md). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../namespaces/Model/interfaces/ISystemConfiguration.md)\>

`Success` with the [system configuration](../namespaces/Model/interfaces/ISystemConfiguration.md)
declaration if successful, `Failure` with an error message otherwise.
