[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / getPredefinedSystemConfiguration

# Function: getPredefinedSystemConfiguration()

> **getPredefinedSystemConfiguration**(`name`, `initParams?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemConfiguration`](../classes/SystemConfiguration.md)\>

Returns the [SystemConfiguration](../classes/SystemConfiguration.md) for the specified
predefined system configuration.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`PredefinedSystemConfiguration`](../type-aliases/PredefinedSystemConfiguration.md) | The name of the predefined system configuration. |
| `initParams?` | [`ISystemConfigurationInitParams`](../interfaces/ISystemConfigurationInitParams.md) | Optional [initialization parameters](../interfaces/ISystemConfigurationInitParams.md). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemConfiguration`](../classes/SystemConfiguration.md)\>

`Success` with the [SystemConfiguration](../classes/SystemConfiguration.md)
if successful, `Failure` with an error message otherwise.
