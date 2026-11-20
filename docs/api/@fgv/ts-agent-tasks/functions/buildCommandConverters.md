[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / buildCommandConverters

# Function: buildCommandConverters()

> **buildCommandConverters**(`bounds`, `ids`): [`ICommandConverters`](../interfaces/ICommandConverters.md)

Builds the [ICommandConverters](../interfaces/ICommandConverters.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bounds` | [`ITaskFieldBounds`](../interfaces/ITaskFieldBounds.md) |
| `ids` | [`IIdentityConverters`](../interfaces/IIdentityConverters.md) |

## Returns

[`ICommandConverters`](../interfaces/ICommandConverters.md)

## Remarks

Command names use the same bounded safe syntax as identifiers: a command name
reaches a model's tool surface and a stored dedup key, so free text is not an option.
