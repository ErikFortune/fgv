[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / buildCapacityConverters

# Function: buildCapacityConverters()

> **buildCapacityConverters**(`bounds`, `ids`, `values`, `failures`): [`ICapacityConverters`](../interfaces/ICapacityConverters.md)

Builds the [ICapacityConverters](../interfaces/ICapacityConverters.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bounds` | [`ITaskFieldBounds`](../interfaces/ITaskFieldBounds.md) |
| `ids` | [`IIdentityConverters`](../interfaces/IIdentityConverters.md) |
| `values` | [`IValueConverters`](../interfaces/IValueConverters.md) |
| `failures` | [`IFailureConverters`](../interfaces/IFailureConverters.md) |

## Returns

[`ICapacityConverters`](../interfaces/ICapacityConverters.md)

## Remarks

These converters validate repository-generated data on its way to and from storage.
They are deliberately **not** reachable from any request, command or tool-argument
shape: a claim is something the repository computes, never authority a caller issues.
