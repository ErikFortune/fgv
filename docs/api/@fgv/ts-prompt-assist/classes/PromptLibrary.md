[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptLibrary

# Class: PromptLibrary\<TResponse, TQualifierNames\>

Main entry point per design §4.1.

## Remarks

Generic over `TResponse extends \{ kind: string \}` so the JSON output
pipeline (B-4) wires up without any cast.

Holds one long-lived ts-res `ResourceManagerBuilder` (imported from
`@fgv/ts-res`) for the lifetime of the instance (per design
§15.5 Option C / §17.1). Prompt records materialize into the builder
on first resolve via `addLooseCandidate`; subsequent resolves reuse
the cached materialization and ride ts-res's intrinsic O(1)
condition / conditionSet / decision caches.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) | [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger` | `public readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Diagnostic logger. Exposed as public readonly so internal helpers (and B-2 / B-4 follow-ons) can emit events without re-threading the value through every API. |
| <a id="property-resourcebindingdepthlimit"></a> `resourceBindingDepthLimit` | `public readonly` | `number` | Per-instance resource-binding depth limit. Exposed as public readonly so B-2's recursive resource-binding resolver can pin against the same value the consumer supplied. |

## Accessors

### materializedCount

#### Get Signature

> **get** **materializedCount**(): `number`

Number of prompt records currently materialized into the long-lived
ts-res builder. Mirrors the observability surface ts-res exposes
for its own caches; useful for editor surfaces and tests that need
to verify materialization deduplication is working.

##### Returns

`number`

***

### observationSeam

#### Get Signature

> **get** **observationSeam**(): [`IPromptObservationSeam`](../interfaces/IPromptObservationSeam.md)

A narrow observation seam — `\{ nextSeq, now, observe \}` — bound to this
library's `seq` authority, injected clock, and observer fan-out. Hand it to
[HorizontalComposer](HorizontalComposer.md) via [IHorizontalComposeParams.observation](../interfaces/IHorizontalComposeParams.md#property-observation)
so a horizontal composition emits a `'compose'` observation that shares this
library's `seq` space (ordering consistently against the contributor
`'resolve'` records) and reaches every wired observer under the same
swallow-and-log contract — without the composer depending on the whole
library or minting its own sequence numbers.

##### Remarks

When no observers are wired, `observe` is a no-op fan-out; `nextSeq` still
advances the shared counter (harmless). The composer only reaches for the
seam when [IHorizontalComposeParams.observation](../interfaces/IHorizontalComposeParams.md#property-observation) is set, so an
unwired composition pays nothing.

##### Returns

[`IPromptObservationSeam`](../interfaces/IPromptObservationSeam.md)

## Methods

### describe()

> **describe**(`id`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptDescriptor`](../interfaces/IPromptDescriptor.md)\>\>

Returns the descriptor for a prompt by id, searching across all scopes.
Convenience for editor surfaces that don't want to specify a scope chain.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`PromptId`](../type-aliases/PromptId.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptDescriptor`](../interfaces/IPromptDescriptor.md)\>\>

#### Remarks

Cache key is `id` alone. To honor the design's invariant that
descriptors for the same id are identical across scopes, the load-
time check validates that all `store.list({ id })` entries are
structurally equal (via RFC 8785 canonical-JSON) and fails loudly on
drift. The cache survives subsequent calls; consumers wanting to
drop an entry (e.g. after a write through a future write-capable
adapter) call [PromptLibrary.invalidateDescriptor](#invalidatedescriptor).

***

### invalidateDescriptor()

> **invalidateDescriptor**(`id`): `void`

Drops the descriptor cache entry for `id`. Intended for consumers
driving a future write-capable adapter; the v0.1 read-only
`FileTreePromptStore` never needs this.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`PromptId`](../type-aliases/PromptId.md) |

#### Returns

`void`

***

### resolve()

> **resolve**(`req`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResolvedPrompt`](../interfaces/IResolvedPrompt.md)\>\>

Resolves a prompt against the supplied chain + qualifier context +
caller substitutions. Returns the rendered body plus full trace.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | [`IPromptResolveRequest`](../interfaces/IPromptResolveRequest.md)\<`TQualifierNames`\> |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IResolvedPrompt`](../interfaces/IResolvedPrompt.md)\>\>

#### Remarks

Resource bindings declared on the resolved record are recursively
resolved (depth-capped per [PromptLibrary.resourceBindingDepthLimit](#property-resourcebindingdepthlimit); cycle-
detected via RFC 8785 canonical-JSON keys on
`\{ chain, id \}` pairs). The inner resolves flow through the same
long-lived ts-res `ResourceManagerBuilder` so materialization caches
hit across the recursion.

***

### resolveFreeTextOutput()

> **resolveFreeTextOutput**(`req`, `rawOutput`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Resolves a prompt and returns the LLM's raw free-text output verbatim.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | [`IPromptResolveRequest`](../interfaces/IPromptResolveRequest.md)\<`TQualifierNames`\> | The resolve request — id, scope chain, qualifier context, and optional substitutions. |
| `rawOutput` | `string` | The raw LLM response string. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

On success, `rawOutput` verbatim. On failure, a `Result.fail`
carrying the prompt id + reason.

#### Remarks

Runtime-verifies the resolved descriptor's `output.kind === 'free-text'`.
If the descriptor declares `'json'` output, rejects with a clear error
citing the prompt id and actual kind — the caller is using the wrong
method.

Per design §8 the library does not run output validation on free-text
in v0.1; the descriptor Converter already rejected free-text
descriptors that declare `outputValidations`, so there is no validator
chain to run here. The raw output is returned verbatim.

***

### resolveJsonOutput()

> **resolveJsonOutput**\<`K`\>(`req`, `rawOutput`, `expectedKind`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Extract`\<`TResponse`, \{ `kind`: `K`; \}\>\>\>

Resolves a prompt and validates the LLM's raw JSON output against the
descriptor's `'json'` output contract.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-k"></a> `K` *extends* `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | [`IPromptResolveRequest`](../interfaces/IPromptResolveRequest.md)\<`TQualifierNames`\> | The resolve request — id, scope chain, qualifier context, and optional substitutions. |
| `rawOutput` | `string` | The raw LLM response string. |
| `expectedKind` | `K` | The response-union discriminator the descriptor is expected to produce. `K` is inferred from the literal argument; the return type narrows to `Extract<TResponse, \{ kind: K \}>` automatically. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Extract`\<`TResponse`, \{ `kind`: `K`; \}\>\>\>

On success, the validated response narrowed to the
`TResponse` member discriminated by `K`. On failure, a `Result.fail`
carrying the prompt id + stage that failed.

#### Remarks

Runtime-verifies the resolved descriptor's `output.kind === 'json'`
AND that `descriptor.output.converterId`'s recorded producing kind
equals the supplied `expectedKind` literal. Either failure rejects
with a clear error citing the prompt id plus the actual-vs-expected
kinds — there is no caller-asserted `T` boundary on this method.

On success, the pipeline strips fences via
`AiAssist.fencedStringifiedJson` (from `@fgv/ts-extras`), parses JSON,
dispatches through the registered Converter looked up by
`(converterId, kind)`, and runs the descriptor's typed validator
chain. Per design §17.2.4 the chain enforces a belt-and-suspenders
kind check: the loader-side compatibility check rejected drift at
descriptor load (belt — invoked from `resolve` / `describe`); each
validator additionally re-checks `value.kind` against its `appliesTo`
at the point of invocation (suspenders).

***

### create()

> `static` **create**\<`TResponse`, `Q`\>(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PromptLibrary`\<`TResponse`, [`InferQualifiersFromCreate`](../type-aliases/InferQualifiersFromCreate.md)\<`Q`\>\>\>\>

Family-convention factory.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresponse-1"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) | [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |
| <a id="type-parameter-q"></a> `Q` *extends* [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| readonly (`string` \| [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs))[] | [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| readonly (`string` \| [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs))[] |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IPromptLibraryCreateParams`](../interfaces/IPromptLibraryCreateParams.md)\<`TResponse`, [`InferQualifiersFromCreate`](../type-aliases/InferQualifiersFromCreate.md)\<`Q`\>\> & `object` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PromptLibrary`\<`TResponse`, [`InferQualifiersFromCreate`](../type-aliases/InferQualifiersFromCreate.md)\<`Q`\>\>\>\>

#### Remarks

Two overloads:

1. **Decl-array inference**: when `qualifiers` is supplied as a
   `ReadonlyArray<string | IQualifierDecl>`, `TQualifierNames` is inferred
   from the array element types. Bare-string elements contribute
   their string-literal type directly; `IQualifierDecl` elements
   contribute their `name` literal. A call like
   `PromptLibrary.create(\{ qualifiers: ['language', 'tone'] \})`
   infers `TQualifierNames = 'language' | 'tone'` so the request side rejects
   `\{ tonr: 'formal' \}` at compile time.

2. **Pre-built collector**: when `qualifiers` is a
   `IReadOnlyQualifierCollector`, the collector type does not
   expose its axis-name union at the type level, so `TQualifierNames`
   defaults to `string`. Consumers wanting the typed benefit on
   this path can specify `TQualifierNames` explicitly.
