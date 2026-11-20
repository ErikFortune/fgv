[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IExpectedQualifierAxis

# Interface: IExpectedQualifierAxis

Description of an expected qualifier axis on an [IPromptDescriptor](IPromptDescriptor.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - |
| <a id="property-name"></a> `name` | `readonly` | [`AxisName`](../type-aliases/AxisName.md) | - |
| <a id="property-stability"></a> `stability?` | `readonly` | [`PromptCacheStability`](../type-aliases/PromptCacheStability.md) | How often this axis's value changes between requests. Defaults to `'per-request'` when omitted, so an undeclared axis is treated exactly as the prompt-cache diagnostics treated every axis before this field existed. **Remarks** Consulted by the conditional-body check (design.md §9, D2) in `analyzePromptCacheStability`: when a winning candidate matched on conditions, a stability claim on the body — a slot's `cacheStability`, a call-site override, or the derived `'frozen'` default of a `'template'` section — is refuted only when an axis that conditions the body is declared **less stable than the claim**. Those axes are the winning candidates' own, plus — once any winner is conditional — the axes of every other candidate in the record (those that lost this resolve, and those that won only as a `matchAsDefault` fallback), since a change in one of them can select a different body next time. A body conditioned solely on `'frozen'` axes is as stable as its text; one conditioned on a `'per-conversation'` axis is at most `'per-conversation'`. **This is not a way to make a claim survive the evidence against it.** Without it, the check cannot tell "conditioned on something that never changes" from "conditioned on something that changes every request", and must assume the latter. Declaring the axis supplies the missing fact that makes the evidence interpretable; it does not override the evidence — the check still refutes whenever a conditioning axis is declared less stable than the claim. It stops refuting only the case where the claim was true all along. That is why the declaration lives here, on the axis, rather than as a per-resolve map (two resolves could then disagree about the same axis) or as a call-site override that D2 would honor (which would turn a verified diagnostic into an unfalsifiable assertion). An axis declared more than once takes the least stable of its declarations, and an entry that omits `stability` counts as the `'per-request'` default. |
| <a id="property-suggestedvalues"></a> `suggestedValues?` | `readonly` | readonly `string`[] | - |
