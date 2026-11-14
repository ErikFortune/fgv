[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptSection

# Interface: IPromptSection

One contiguous run of a resolved prompt's body, attributed to what produced it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chars"></a> `chars` | `readonly` | `number` | Length in UTF-16 code units. May be `0` for a slot that resolved to an empty value. |
| <a id="property-directive"></a> `directive?` | `readonly` | [`SlotDirective`](../type-aliases/SlotDirective.md) | Framing directive for a `'slot'` section. |
| <a id="property-effectivestability"></a> `effectiveStability?` | `readonly` | [`PromptCacheStability`](../type-aliases/PromptCacheStability.md) | This section's effective prompt-cache stability, as computed by `analyzePromptCacheStability` (design.md §9) alongside `cacheFindings` — the same value the D1–D5 checks reason over, including any refutation downgrade. Exposed so a consumer building a cache-breakpoint plan (see `toCacheRequest`) does not have to recompute it from the trace. |
| <a id="property-kind"></a> `kind` | `readonly` | `"slot"` \| `"template"` \| `"preface"` | `'preface'` for the anti-jailbreak preface, `'template'` for literal body text, `'slot'` for a substituted slot value. |
| <a id="property-measured"></a> `measured?` | `readonly` | `number` | Result of [IPromptCompositionOptions.measure](IPromptCompositionOptions.md#property-measure), when one was supplied. |
| <a id="property-slot"></a> `slot?` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | Slot name, when `kind` is `'slot'`. |
| <a id="property-source"></a> `source?` | `readonly` | [`BindingTraceSource`](../type-aliases/BindingTraceSource.md) | Provenance of the winning binding, for a `'slot'` section — mirrors [IResolvedPromptSlot](IResolvedPromptSlot.md). |
| <a id="property-start"></a> `start` | `readonly` | `number` | Offset into [IResolvedPrompt.body](IResolvedPrompt.md#property-body), in UTF-16 code units. |
| <a id="property-wasenforced"></a> `wasEnforced?` | `readonly` | `boolean` | True iff the slot's winning binding was enforced. |
| <a id="property-winningscope"></a> `winningScope?` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Scope whose binding won, when the section's source is `'binding'`. |
