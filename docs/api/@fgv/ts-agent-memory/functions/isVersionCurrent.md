[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / isVersionCurrent

# Function: isVersionCurrent()

> **isVersionCurrent**(`record`): `boolean`

Whether a temporal record is a *current* version — its `temporal.invalid_at`
is `null` or absent (the still-valid sentinel). A non-temporal record is never
current in this sense (returns `false`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |

## Returns

`boolean`
