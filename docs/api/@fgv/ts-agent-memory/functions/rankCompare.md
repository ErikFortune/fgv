[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / rankCompare

# Function: rankCompare()

> **rankCompare**(`a`, `b`): `number`

Rank comparator: store-computed [IMemoryEnvelope.rank](../interfaces/IMemoryEnvelope.md#property-rank) descending, with
[recencyCompare](recencyCompare.md) as the tiebreak. Records with an absent `rank` sort LAST
(after every ranked record), then by recency among themselves. Mirrors the
index's rank-view ordering.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |
| `b` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |

## Returns

`number`
