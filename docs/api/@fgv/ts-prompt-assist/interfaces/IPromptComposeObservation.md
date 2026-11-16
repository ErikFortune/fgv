[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptComposeObservation

# Interface: IPromptComposeObservation

One observation per [HorizontalComposer.compose](../classes/HorizontalComposer.md#compose) call, emitted only when
the composer is wired to a [IPromptObservationSeam](IPromptObservationSeam.md). Covers both success
and failure, mirroring [IPromptResolveObservation](IPromptResolveObservation.md).

## Remarks

A compose operation has no single resolve request, so it carries only the
[IPromptObservationCommon](IPromptObservationCommon.md) fields — `promptId` is the composed
descriptor's id and `chain` is empty. The per-contributor resolve traces
(each contributor's own `chain` / `qualifierContext` / winning scope) live on
[contributors](#property-contributors).

The composed body is deliberately NOT duplicated here — it is derived from the
merged slot values and is reconstructable from the contributor traces +
`provenanceTrace`, mirroring how [IPromptOutputObservation](IPromptOutputObservation.md) avoids
re-storing the resolved body.

## Extends

- [`IPromptObservationCommon`](IPromptObservationCommon.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | The request's scope chain (most-specific → most-general), as supplied. A `'compose'` record has no single resolve request and so carries an empty chain — the contributor chains live on each nested contributor trace. |
| <a id="property-contenthash"></a> `contentHash` | `readonly` | `string` | Dedupe key: CRC32 over RFC 8785 canonical JSON of the record's identity tuple (via `Hash.Crc32Normalizer`). For request-shaped records the tuple is `\{ promptId, chain, qualifierContext, substitutions \}`; for a `'compose'` record it is `\{ composedPromptId, contributors \}` (each contributor's `provenance` + `promptId`). Side-by-side with `seq` — a consumer picks which to key a map / dedupe set on. Two identical operations share a `contentHash` (by design — that is the dedupe signal). |
| <a id="property-contributors"></a> `contributors` | `readonly` | readonly [`IPromptComposeContributorObservation`](IPromptComposeContributorObservation.md)[] | The contributors to this composition, in declared order, each nesting its full resolve trace. Present on success and failure alike (contributors are inputs to the compose, available regardless of outcome). |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | Wall-clock milliseconds from the start of the observed call until this record was built — i.e. the resolve (or output round-trip, or compose merge) computation itself. It does NOT include the time spent dispatching this record to observers, so for awaited observers the end-to-end call latency is slightly larger than `durationMs`. |
| <a id="property-error"></a> `error?` | `readonly` | `string` | Present on failure: the compose failure `Result`'s message. |
| <a id="property-outcome"></a> `outcome` | `readonly` | `"success"` \| `"failure"` | Whether the composition succeeded. |
| <a id="property-phase"></a> `phase` | `readonly` | `"compose"` | Discriminator. |
| <a id="property-promptid"></a> `promptId` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | The prompt id. For request-shaped records this is the request's prompt id; for a `'compose'` record it is the composed descriptor's id. |
| <a id="property-provenancetrace"></a> `provenanceTrace?` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), readonly [`ISlotProvenanceEntry`](ISlotProvenanceEntry.md)[]\> | Present on success: per-composed-logical-slot contribution provenance, keyed by logical slot name — the same [IComposedPrompt.provenanceTrace](IComposedPrompt.md#property-provenancetrace) shape, reused rather than a parallel summary, so "where did this composed slot come from" is answerable directly. |
| <a id="property-safeguardfindings"></a> `safeguardFindings?` | `readonly` | readonly [`ISafeguardFinding`](ISafeguardFinding.md)[] | Present on success: the composed prompt's warn / info safeguard findings. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | Monotonic 1-based sequence number assigned by `PromptLibrary`, stable across a store's ring eviction. The ordering / paging key. |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Milliseconds since epoch when `PromptLibrary` produced the record. |
