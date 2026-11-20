[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptCacheStabilityAnalysisParams

# Interface: IPromptCacheStabilityAnalysisParams

Inputs to [analyzePromptCacheStability](../functions/analyzePromptCacheStability.md), gathered from data a
`composition`-requesting resolve already holds.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-callsiteoverrides"></a> `callSiteOverrides?` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`PromptCacheStability`](../type-aliases/PromptCacheStability.md)\> | Per-slot stability overrides from the resolve request. Wins over an authored claim. |
| <a id="property-candidatematches"></a> `candidateMatches` | `readonly` | readonly [`ICandidateMatchTraceEntry`](ICandidateMatchTraceEntry.md)[] | The resolve's per-candidate match trace — [IPromptResolveTrace.candidateMatches](IPromptResolveTrace.md#property-candidatematches). |
| <a id="property-candidates"></a> `candidates?` | `readonly` | readonly [`IPromptCandidateRecord`](IPromptCandidateRecord.md)\<`string`\>[] | The winning record's candidates — [IStoredPromptRecord.candidates](IStoredPromptRecord.md#property-candidates). Joined to `candidateMatches` by `candidateIndex`, so the conditional-body check (D2) can name the qualifiers that conditioned each winning candidate from the declarations this package already holds. **Remarks** Omitted, or when a match's declaration cannot be found or names no qualifier, the match's conditioning axes are unknown and are treated as `'per-request'` — the least stable level, and exactly the behaviour this check had before it could attribute a match to its axes. |
| <a id="property-mergedbindings"></a> `mergedBindings` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`IBindingTraceEntry`](IBindingTraceEntry.md)\> | The resolve's merged bindings — [IPromptResolveTrace.mergedBindings](IPromptResolveTrace.md#property-mergedbindings). |
| <a id="property-options"></a> `options?` | `readonly` | [`IPromptCacheDiagnosticOptions`](IPromptCacheDiagnosticOptions.md) | - |
| <a id="property-prefacestability"></a> `prefaceStability?` | `readonly` | [`PromptCacheStability`](../type-aliases/PromptCacheStability.md) | Declared stability for a `'preface'` section — [IPromptSafetyPolicy.antiJailbreakPrefaceStability](IPromptSafetyPolicy.md#property-antijailbreakprefacestability). Defaults to `'frozen'` when omitted, matching this function's prior unconditional default. See design.md §15 (OQ-7) for why there is no refutation check for this claim, unlike D1/D2. |
| <a id="property-qualifiers"></a> `qualifiers?` | `readonly` | [`IPromptQualifierMetadata`](IPromptQualifierMetadata.md) | The descriptor's qualifier metadata — [IPromptDescriptor.qualifiers](IPromptDescriptor.md#property-qualifiers). Supplies each axis's declared [IExpectedQualifierAxis.stability](IExpectedQualifierAxis.md#property-stability); an axis with no declaration is `'per-request'`. |
| <a id="property-resourcebindingresolutions"></a> `resourceBindingResolutions` | `readonly` | readonly [`IResourceBindingTraceEntry`](IResourceBindingTraceEntry.md)[] | The resolve's resource-binding entries — [IPromptResolveTrace.resourceBindingResolutions](IPromptResolveTrace.md#property-resourcebindingresolutions). |
| <a id="property-sections"></a> `sections` | `readonly` | readonly [`IPromptSection`](IPromptSection.md)[] | Document-ordered, contiguous sections — [IPromptComposition.sections](IPromptComposition.md#property-sections). |
| <a id="property-slots"></a> `slots` | `readonly` | readonly [`IPromptSlot`](IPromptSlot.md)[] | The descriptor's slot declarations — [IPromptDescriptor.slots](IPromptDescriptor.md#property-slots). |
