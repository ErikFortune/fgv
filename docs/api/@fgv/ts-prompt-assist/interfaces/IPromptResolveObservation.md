[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptResolveObservation

# Interface: IPromptResolveObservation

One observation per public [PromptLibrary.resolve](../classes/PromptLibrary.md#resolve) call (and per inner
resolve of an output call). Covers both success and failure.

## Remarks

On failure, only `error` is populated alongside the base fields — the resolve
trace is constructed only on the success path inside `PromptLibrary`, so a
failed resolve carries no `trace` (v0.1; see the stream's OQ-4 lock).

## Extends

- [`IPromptObservationBase`](IPromptObservationBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body?` | `readonly` | `string` | Present on success: the final rendered body (post-Mustache, post-preface). |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | The request's scope chain (most-specific → most-general), as supplied. A `'compose'` record has no single resolve request and so carries an empty chain — the contributor chains live on each nested contributor trace. |
| <a id="property-composition"></a> `composition?` | `readonly` | [`IPromptComposition`](IPromptComposition.md) | Present on success, and only when the request supplied [IPromptResolveRequest.composition](IPromptResolveRequest.md#property-composition): the resolve's [IResolvedPrompt.composition](IResolvedPrompt.md#property-composition), carried whole. See [IPromptComposition](IPromptComposition.md). |
| <a id="property-contenthash"></a> `contentHash` | `readonly` | `string` | Dedupe key: CRC32 over RFC 8785 canonical JSON of the record's identity tuple (via `Hash.Crc32Normalizer`). For request-shaped records the tuple is `\{ promptId, chain, qualifierContext, substitutions \}`; for a `'compose'` record it is `\{ composedPromptId, contributors \}` (each contributor's `provenance` + `promptId`). Side-by-side with `seq` — a consumer picks which to key a map / dedupe set on. Two identical operations share a `contentHash` (by design — that is the dedupe signal). |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | Wall-clock milliseconds from the start of the observed call until this record was built — i.e. the resolve (or output round-trip, or compose merge) computation itself. It does NOT include the time spent dispatching this record to observers, so for awaited observers the end-to-end call latency is slightly larger than `durationMs`. |
| <a id="property-error"></a> `error?` | `readonly` | `string` | Present on failure: the failure `Result`'s message. |
| <a id="property-outcome"></a> `outcome` | `readonly` | `"success"` \| `"failure"` | Whether the resolve succeeded. |
| <a id="property-outputkind"></a> `outputKind?` | `readonly` | [`PromptObservationOutputKind`](../type-aliases/PromptObservationOutputKind.md) | Present on success: the resolved descriptor's `output.kind`. |
| <a id="property-phase"></a> `phase` | `readonly` | `"resolve"` | Discriminator. |
| <a id="property-promptid"></a> `promptId` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | The prompt id. For request-shaped records this is the request's prompt id; for a `'compose'` record it is the composed descriptor's id. |
| <a id="property-qualifiercontext"></a> `qualifierContext` | `readonly` | [`IQualifierContext`](../type-aliases/IQualifierContext.md) | The caller's qualifier context, verbatim. Privacy / redaction is a storage-layer concern — see [PromptObservationStore](../classes/PromptObservationStore.md). |
| <a id="property-safeguardfindings"></a> `safeguardFindings?` | `readonly` | readonly [`ISafeguardFinding`](ISafeguardFinding.md)[] | Present on success: a top-level mirror of `trace.safeguardFindings`, surfaced so a store can filter on disposition without walking the trace. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic 1-based sequence number assigned by `PromptLibrary`, stable across a store's ring eviction. The ordering / paging key. |
| <a id="property-substitutions"></a> `substitutions?` | `readonly` | `Readonly`\<`Record`\<`string`, `string` \| [`SlotBinding`](../type-aliases/SlotBinding.md)\>\> | The caller's substitutions, if any, verbatim. May carry PII — redaction is a storage-layer concern, not a library concern. |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Milliseconds since epoch when `PromptLibrary` produced the record. |
| <a id="property-trace"></a> `trace?` | `readonly` | [`IPromptResolveTrace`](IPromptResolveTrace.md) | Present on success: the full existing resolve trace. |
| <a id="property-winningscope"></a> `winningScope?` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Present on success: scope whose record won (`trace.winningScope`). |
