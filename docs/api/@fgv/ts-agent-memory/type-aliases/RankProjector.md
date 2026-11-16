[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / RankProjector

# Type Alias: RankProjector

> **RankProjector** = (`record`) => `number`

A per-kind host projection from a fully-resolved (post-merge) memory record
to a numeric ordering value. Registered per kind at store construction (see
`rankProjectors`); the store runs it on every put/update over the same
resolved record whose `contentHash` it computes, stamping the result into
[IMemoryEnvelope.rank](../interfaces/IMemoryEnvelope.md#property-rank). The store never interprets the body — the host
owns what the number means. A projector that throws is treated as "no rank
for this record" (logged at `warn`), never failing the write.

Runs on writes only. To apply a newly-registered projector to records that
already exist, call `IMemoryStore.reconcile(kind, 'rank')`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> |

## Returns

`number`
