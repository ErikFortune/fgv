[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / buildEnvelopeConverters

# Function: buildEnvelopeConverters()

> **buildEnvelopeConverters**(`bounds`, `ids`, `values`): [`IEnvelopeConverters`](../interfaces/IEnvelopeConverters.md)

Builds the [IEnvelopeConverters](../interfaces/IEnvelopeConverters.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bounds` | [`ITaskFieldBounds`](../interfaces/ITaskFieldBounds.md) |
| `ids` | [`IIdentityConverters`](../interfaces/IIdentityConverters.md) |
| `values` | [`IValueConverters`](../interfaces/IValueConverters.md) |

## Returns

[`IEnvelopeConverters`](../interfaces/IEnvelopeConverters.md)

## Remarks

Strict throughout: an unrecognized property anywhere in the envelope is a conversion
failure, not a field quietly dropped. That is what makes "runtime validation
produces the same public shape the declarations promise" checkable rather than
asserted.
