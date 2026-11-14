[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptLibraryCreateParams

# Interface: IPromptLibraryCreateParams\<TResponse, TQualifierNames\>

Parameters for [PromptLibrary.create](../classes/PromptLibrary.md#create).

## Remarks

`TResponse` is the consumer-extended response union. Defaults to the open
`\{ kind: string \}` lower bound for consumers who only use free-text
output.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](IPromptResponseBase.md) | [`IPromptResponseBase`](IPromptResponseBase.md) |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachelistener"></a> `cacheListener?` | `readonly` | [`IResourceResolverCacheListener`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Optional ts-res cache listener. Receives condition / conditionSet / decision cache hit/miss/error/clear events from the underlying `ResourceResolver`. When omitted, the library installs no listener. |
| <a id="property-logger"></a> `logger?` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Diagnostic logger. Defaults to `Logging.NoOpLogger`. B-1b wires the parameter but does not emit events yet; B-2 / B-4 will populate resource-binding entry/exit, cache events, and safeguard findings per design §4.1. |
| <a id="property-observers"></a> `observers?` | `readonly` | readonly [`IPromptObserver`](IPromptObserver.md)[] | Optional observers fired once per public `resolve` / `resolveJsonOutput` / `resolveFreeTextOutput` call (never for nested resource-binding resolves). Purely additive — when absent, no observation records are produced and existing behavior is unchanged. Observer errors never affect the resolve result; they are swallowed and logged to [logger](#property-logger) at `warn`. See [IPromptObserver](IPromptObserver.md) and [PromptObservationStore](../classes/PromptObservationStore.md). |
| <a id="property-qualifiers"></a> `qualifiers` | `readonly` | [`IPromptLibraryQualifiersInput`](../type-aliases/IPromptLibraryQualifiersInput.md)\<`TQualifierNames`\> | ts-res qualifier configuration. Accepts either a pre-built `IReadOnlyQualifierCollector` (when the consumer already maintains a ts-res qualifier set) or a mixed array of bare axis-name strings and / or `IQualifierDecl`s (the library builds the collector internally via ts-res's `Qualifiers.QualifierCollector.create`, which synthesizes `LiteralQualifierType`s for bare strings). REQUIRED per design §4.1. **Remarks** On the decl-array path, the `TQualifierNames` type parameter is inferred from the array element types via the static `PromptLibrary.create` factory — e.g. `\{ qualifiers: ['language', 'tone'] \}` infers `TQualifierNames = 'language' \| 'tone'` and tightens `IPromptResolveRequest.qualifiers` accordingly. On the pre-built-collector path, `TQualifierNames` falls back to `string`; consumers can specify it explicitly if they want the typed benefit on that path. |
| <a id="property-qualifiertypes"></a> `qualifierTypes?` | `readonly` | [`ReadOnlyQualifierTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Optional ts-res qualifier-type collector. When `qualifiers` is supplied as a pre-built `IReadOnlyQualifierCollector`, this is inferred from it. When `qualifiers` is supplied as decls and any element is an `IQualifierDecl`, `qualifierTypes` must supply the qualifier types referenced by those decls. Bare-string elements synthesize a `LiteralQualifierType` automatically. |
| <a id="property-registry"></a> `registry?` | `readonly` | [`IPromptRegistry`](IPromptRegistry.md)\<`TResponse`\> | Unified registry. Optional; defaults to an empty registry. |
| <a id="property-resourcebindingdepthlimit"></a> `resourceBindingDepthLimit?` | `readonly` | `number` | Default 5. Resource bindings exceeding this depth fail loudly in B-2. B-1b wires the parameter so consumers can pin the value before B-2 lands. |
| <a id="property-safetypolicy"></a> `safetyPolicy?` | `readonly` | [`IPromptSafetyPolicy`](IPromptSafetyPolicy.md) | Optional safety policy per design §4.4. When omitted, no global defaultMaxLength applies (per-slot and per-descriptor caps still do), no regex screening runs, and no anti-jailbreak preface is injected. |
| <a id="property-store"></a> `store` | `readonly` | [`IPromptStore`](IPromptStore.md) | Backing store. v0.1 ships `FileTreePromptStore`; consumers can implement custom adapters. |
| <a id="property-templatecachesize"></a> `templateCacheSize?` | `readonly` | `number` | Default 256. LRU cap on parsed Mustache templates. |
