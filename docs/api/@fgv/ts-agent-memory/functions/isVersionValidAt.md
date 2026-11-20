[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / isVersionValidAt

# Function: isVersionValidAt()

> **isVersionValidAt**(`record`, `asOf`): `boolean`

Whether a temporal record's validity interval contains `asOf` (epoch ms):
`valid_at <= asOf` and (`invalid_at` is null/absent OR `asOf < invalid_at`).
The version's `valid_at` defaults to its `created` when absent; a non-temporal
record is never "valid at" a point (returns `false`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |
| `asOf` | `number` |

## Returns

`boolean`
