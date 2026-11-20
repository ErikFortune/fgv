[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / buildCycleKey

# Function: buildCycleKey()

> **buildCycleKey**(`edge`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Build the design's `buildCycleKey` — a deterministic, canonical (RFC-8785,
via `Crc32Normalizer` from `@fgv/ts-utils`) identity for a directed edge. Used
to de-duplicate proposed edges so a repeated `(source, target, type)` proposal
contributes a single graph edge (and never spuriously "re-closes" a cycle).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `edge` | [`ICycleGuardEdge`](../interfaces/ICycleGuardEdge.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>
