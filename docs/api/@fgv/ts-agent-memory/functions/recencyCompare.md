[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / recencyCompare

# Function: recencyCompare()

> **recencyCompare**(`a`, `b`): `number`

Recency comparator: most-recently-updated first, with a `seq` tiebreak so
equal-`updated` records sort deterministically. Mirrors the B1 index ordering.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |
| `b` | [`IEnvelopeCarrier`](../interfaces/IEnvelopeCarrier.md) |

## Returns

`number`
