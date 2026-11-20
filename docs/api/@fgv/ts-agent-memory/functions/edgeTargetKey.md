[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / edgeTargetKey

# Function: edgeTargetKey()

> **edgeTargetKey**(`target`): `string`

The canonical composite-key string for an [IEdgeTarget](../interfaces/IEdgeTarget.md): scope + id,
NUL-separated. NUL is excluded from both components (scope segments are
filename-safe; [MemoryId](../type-aliases/MemoryId.md) is portable-filename-safe), so it is a
collision-proof separator. This is the ONE canonicalization every consumer
that keys on a scoped target uses — the backlink index, the cycle guard, and
the ingest edge-validation path all route through it so their notions of
"same target" cannot drift.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`IEdgeTarget`](../interfaces/IEdgeTarget.md) |

## Returns

`string`
