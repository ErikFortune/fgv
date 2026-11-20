[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptResolveRequest

# Interface: IPromptResolveRequest\<TQualifierNames\>

Resolve request supplied to [PromptLibrary.resolve](../classes/PromptLibrary.md#resolve),
[PromptLibrary.resolveJsonOutput](../classes/PromptLibrary.md#resolvejsonoutput), and
[PromptLibrary.resolveFreeTextOutput](../classes/PromptLibrary.md#resolvefreetextoutput).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachestability"></a> `cacheStability?` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`PromptCacheStability`](../type-aliases/PromptCacheStability.md)\> | Per-slot prompt-cache stability overrides for this resolve. Wins over any [IPromptSlot.cacheStability](IPromptSlot.md#property-cachestability) for the same slot, unconditionally — this is what rescues a caller-substituted value that is actually an app-held constant, invisible to the library at declaration time. Consulted only when [IPromptResolveRequest.composition](#property-composition) is also requested, since the diagnostics that use it (design.md §9) run alongside the section map. |
| <a id="property-chain"></a> `chain` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | Scope chain — most-specific to most-general. The walker uses the first scope with a record. |
| <a id="property-composition"></a> `composition?` | `readonly` | [`IPromptCompositionOptions`](IPromptCompositionOptions.md) | Request a [IPromptComposition](IPromptComposition.md) on the result — what is in the body, in what order, and how much of it each part is. Presence opts in; omitted, nothing extra is computed or retained. **Remarks** Opt-in because it costs a second render and an array per resolve, and observers retain resolutions in a bounded ring buffer — a cost most resolves should not pay for a diagnostic they are not reading. |
| <a id="property-id"></a> `id` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Prompt id to resolve. |
| <a id="property-qualifiers"></a> `qualifiers` | `readonly` | `Readonly`\<`Partial`\<`Record`\<`TQualifierNames`, `string`\>\>\> | Caller-supplied qualifier context, fed to ts-res's candidate selector. **Remarks** Defaults to the loose shape `Readonly<Partial<Record<string, string>>>` (identical to [IQualifierContext](../type-aliases/IQualifierContext.md)) so legacy callers compile unchanged. When `TQualifierNames` is narrowed (typically via inference on `PromptLibrary.create` with a string-literal decl array), this narrows to `Readonly<Partial<Record<TQualifierNames, string>>>`, surfacing misspelled qualifier-axis names at compile time. |
| <a id="property-substitutions"></a> `substitutions?` | `readonly` | `Readonly`\<`Record`\<`string`, `string` \| [`SlotBinding`](../type-aliases/SlotBinding.md)\>\> | Optional caller substitutions, applied to slots not locked by an `enforced` scope binding. |
