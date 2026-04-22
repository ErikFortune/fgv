[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Config](../../../README.md) / [Convert](../README.md) / validateSystemConfiguration

# Function: validateSystemConfiguration()

> **validateSystemConfiguration**(`config`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../../Model/interfaces/ISystemConfiguration.md)\>

Validate a [ISystemConfiguration](../../Model/interfaces/ISystemConfiguration.md) object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `unknown` | The system configuration to validate |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemConfiguration`](../../Model/interfaces/ISystemConfiguration.md)\>

`Success` with the validated system configuration if successful,
or `Failure` with an error message if validation fails.
