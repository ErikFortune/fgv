[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / isTemporalRecord

# Function: isTemporalRecord()

> **isTemporalRecord**(`record`): `boolean`

Whether a record participates in the versioned (temporal) layout. A temporal
record always carries a [temporal](../interfaces/ITemporalBlock.md) block (the store
stamps `valid_at` on every versioned write); an atemporal record never does,
so presence of `temporal` is the discriminator. Independent of `id`/`entityId`
divergence (MTM is flat yet has `entityId !== id`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |

## Returns

`boolean`
