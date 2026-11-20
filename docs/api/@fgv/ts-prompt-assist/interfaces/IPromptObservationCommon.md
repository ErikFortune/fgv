[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptObservationCommon

# Interface: IPromptObservationCommon

Fields common to every [IPromptObservationRecord](../type-aliases/IPromptObservationRecord.md), including the
`'compose'` record — which has no single resolve request and therefore
carries none of the request-shaped fields (`qualifierContext` /
`substitutions`) that [IPromptObservationBase](IPromptObservationBase.md) adds.

## Remarks

`seq` and `timestamp` are assigned by `PromptLibrary` (a single per-instance
authority) before the record is fanned out to observers, so the same record
carries the same `seq` across every store it lands in — which is what makes
[linkedResolveSeq](IPromptOutputObservation.md#property-linkedresolveseq)
correlation work consistently across multiple observers. A `'compose'` record
shares this same `seq` space (it is minted through the same authority via the
[IPromptObservationSeam](IPromptObservationSeam.md)), so a compose record and the contributor
`'resolve'` records it nests order consistently on `seq`.

## Extended by

- [`IPromptObservationBase`](IPromptObservationBase.md)
- [`IPromptComposeObservation`](IPromptComposeObservation.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | The request's scope chain (most-specific → most-general), as supplied. A `'compose'` record has no single resolve request and so carries an empty chain — the contributor chains live on each nested contributor trace. |
| <a id="property-contenthash"></a> `contentHash` | `readonly` | `string` | Dedupe key: CRC32 over RFC 8785 canonical JSON of the record's identity tuple (via `Hash.Crc32Normalizer`). For request-shaped records the tuple is `\{ promptId, chain, qualifierContext, substitutions \}`; for a `'compose'` record it is `\{ composedPromptId, contributors \}` (each contributor's `provenance` + `promptId`). Side-by-side with `seq` — a consumer picks which to key a map / dedupe set on. Two identical operations share a `contentHash` (by design — that is the dedupe signal). |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | Wall-clock milliseconds from the start of the observed call until this record was built — i.e. the resolve (or output round-trip, or compose merge) computation itself. It does NOT include the time spent dispatching this record to observers, so for awaited observers the end-to-end call latency is slightly larger than `durationMs`. |
| <a id="property-promptid"></a> `promptId` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | The prompt id. For request-shaped records this is the request's prompt id; for a `'compose'` record it is the composed descriptor's id. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic 1-based sequence number assigned by `PromptLibrary`, stable across a store's ring eviction. The ordering / paging key. |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Milliseconds since epoch when `PromptLibrary` produced the record. |
