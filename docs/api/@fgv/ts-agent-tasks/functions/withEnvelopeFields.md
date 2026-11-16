[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / withEnvelopeFields

# Function: withEnvelopeFields()

> **withEnvelopeFields**(`envelope`, `changes`): [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md)

An envelope with some optional fields replaced or removed, every other field carried over.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) |
| `changes` | [`OptionalEnvelopeChanges`](../type-aliases/OptionalEnvelopeChanges.md) |

## Returns

[`ITaskEnvelope`](../interfaces/ITaskEnvelope.md)

## Remarks

Built field by field, so a removed field is absent — never present as `undefined` — and the
result has exactly the envelope's shape.
