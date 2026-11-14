[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryEmbedder

# Type Alias: MemoryEmbedder

> **MemoryEmbedder** = (`record`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Float32Array` \| `undefined`\>\>

Embeds a complete record into a vector for the store's embed-on-write hook.
Async and `Result`-returning, since a real embedder does a network call (cloud
provider) or in-process model inference. The consumer wires this — the core
package never calls an embedding provider directly, staying embedder-agnostic.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\> |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Float32Array` \| `undefined`\>\>

## Remarks

Resolving to `undefined` means **"intentionally not embedded"** — a deliberate
decline, not an error. The record is stored without an embedding reference, no
failure is reported, and **the decline itself logs nothing**. This is distinct
from a `Failure`, which means the embedder *tried and could not*.

"Logs nothing" is a statement about the decline, not a promise of silence: a
decline on a record that was already embedded also prunes the vector that
reference named, and if that prune fails it is a genuine fault and warns like
any other. What a decline never does is warn merely for having happened.

The distinction is load-bearing wherever the two are treated differently. On the
rebuild path a declined record is **excluded** from the index and counted on
[IVectorRebuildReport.declined](../interfaces/IVectorRebuildReport.md#property-declined); a failed one is a genuine error and, under
`onRecordError: 'skip'`, is reported on [IVectorRebuildReport.skipped](../interfaces/IVectorRebuildReport.md#property-skipped). Collapsing "I chose not to" into `fail` would
make a deliberate policy indistinguishable from an embedder outage in the logs,
and would put a routine decision on whatever error path the caller has wired.

The embedder receives the whole record, so the usual reason to decline is the
record's `kind` — a control or bookkeeping row that no query should ever return.
