[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptOutputObservation

# Interface: IPromptOutputObservation

One observation per [PromptLibrary.resolveJsonOutput](../classes/PromptLibrary.md#resolvejsonoutput) /
[PromptLibrary.resolveFreeTextOutput](../classes/PromptLibrary.md#resolvefreetextoutput) call, describing the LLM output
round-trip and cross-linked to its resolve record via `linkedResolveSeq`.

## Remarks

Does not duplicate the rendered body — that lives on the linked resolve
record (the stream's OQ-8 lock). Correlate via
[linkedResolveSeq](#property-linkedresolveseq).

## Extends

- [`IPromptObservationBase`](IPromptObservationBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | The request's scope chain (most-specific → most-general), as supplied. A `'compose'` record has no single resolve request and so carries an empty chain — the contributor chains live on each nested contributor trace. |
| <a id="property-contenthash"></a> `contentHash` | `readonly` | `string` | Dedupe key: CRC32 over RFC 8785 canonical JSON of the record's identity tuple (via `Hash.Crc32Normalizer`). For request-shaped records the tuple is `\{ promptId, chain, qualifierContext, substitutions \}`; for a `'compose'` record it is `\{ composedPromptId, contributors \}` (each contributor's `provenance` + `promptId`). Side-by-side with `seq` — a consumer picks which to key a map / dedupe set on. Two identical operations share a `contentHash` (by design — that is the dedupe signal). |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | Wall-clock milliseconds from the start of the observed call until this record was built — i.e. the resolve (or output round-trip, or compose merge) computation itself. It does NOT include the time spent dispatching this record to observers, so for awaited observers the end-to-end call latency is slightly larger than `durationMs`. |
| <a id="property-error"></a> `error?` | `readonly` | `string` | Present on failure: the parse / validation / resolve failure message. |
| <a id="property-linkedresolveseq"></a> `linkedResolveSeq` | `readonly` | `number` | `seq` of the `'resolve'` record produced by this call's inner resolve. |
| <a id="property-outcome"></a> `outcome` | `readonly` | `"success"` \| `"failure"` | Whether the output round-trip (resolve + validation) succeeded. |
| <a id="property-phase"></a> `phase` | `readonly` | `"json-output"` \| `"free-text-output"` | Discriminator. |
| <a id="property-promptid"></a> `promptId` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | The prompt id. For request-shaped records this is the request's prompt id; for a `'compose'` record it is the composed descriptor's id. |
| <a id="property-qualifiercontext"></a> `qualifierContext` | `readonly` | [`IQualifierContext`](../type-aliases/IQualifierContext.md) | The caller's qualifier context, verbatim. Privacy / redaction is a storage-layer concern — see [PromptObservationStore](../classes/PromptObservationStore.md). |
| <a id="property-rawoutput"></a> `rawOutput` | `readonly` | `string` | The LLM's raw response string, verbatim. Redaction is a storage-layer concern. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic 1-based sequence number assigned by `PromptLibrary`, stable across a store's ring eviction. The ordering / paging key. |
| <a id="property-substitutions"></a> `substitutions?` | `readonly` | `Readonly`\<`Record`\<`string`, `string` \| [`SlotBinding`](../type-aliases/SlotBinding.md)\>\> | The caller's substitutions, if any, verbatim. May carry PII — redaction is a storage-layer concern, not a library concern. |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Milliseconds since epoch when `PromptLibrary` produced the record. |
