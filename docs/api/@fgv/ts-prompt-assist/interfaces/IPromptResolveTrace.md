[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptResolveTrace

# Interface: IPromptResolveTrace

Full resolve-time trace.

## Remarks

Surfaces every decision the resolver made: which scope's record won, which
scopes were consulted, what each slot's merged value came from, which
candidates contributed body fragments, which safeguard findings fired, and
the recursive inner traces of any resource bindings.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidatematches"></a> `candidateMatches` | `readonly` | readonly [`ICandidateMatchTraceEntry`](ICandidateMatchTraceEntry.md)[] | Per-candidate match details, specificity-ascending. |
| <a id="property-mergedbindings"></a> `mergedBindings` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`IBindingTraceEntry`](IBindingTraceEntry.md)\> | Merged-binding map keyed by slot name. See [IBindingTraceEntry](IBindingTraceEntry.md). |
| <a id="property-resourcebindingresolutions"></a> `resourceBindingResolutions` | `readonly` | readonly [`IResourceBindingTraceEntry`](IResourceBindingTraceEntry.md)[] | One entry per resource-binding slot, with the inner resolve's full trace. |
| <a id="property-safeguardfindings"></a> `safeguardFindings` | `readonly` | readonly [`ISafeguardFinding`](ISafeguardFinding.md)[] | Warn / info safeguard findings: screener findings whose `disposition` is `'warn'` or `'info'` (e.g. `'suspicious-pattern'` warnings, `'screening-skipped'`) plus `'enforced-override-ignored'` from the binding merge. Reject paths (length-cap violations, any finding with `disposition: 'reject'`, or a screener returning `fail()`) fail the resolve before an `IResolvedPrompt` is constructed, so their details surface in the failure message rather than here. |
| <a id="property-scopesconsulted"></a> `scopesConsulted` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | Scopes consulted (most-specific first), up to and including the winner. |
| <a id="property-winningscope"></a> `winningScope` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Scope whose prompt record was selected (chain walker's win). |
