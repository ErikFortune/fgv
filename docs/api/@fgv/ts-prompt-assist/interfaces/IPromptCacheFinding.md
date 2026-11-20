[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptCacheFinding

# Interface: IPromptCacheFinding

One prompt-caching diagnostic finding.

## Remarks

Findings report problems, never successes — a resolve with a wholly
cacheable, well-ordered, above-threshold prefix produces no findings at
all. See `design.md` §9 for the checks (D1–D5) that produce these.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-claimed"></a> `claimed?` | `readonly` | [`IPromptCacheStabilityHint`](IPromptCacheStabilityHint.md) | For a refutation: the claim as made. |
| <a id="property-detail"></a> `detail` | `readonly` | `string` | - |
| <a id="property-downgradedto"></a> `downgradedTo?` | `readonly` | [`PromptCacheStability`](../type-aliases/PromptCacheStability.md) | For a refutation: the level the claim was lowered to. |
| <a id="property-kind"></a> `kind` | `readonly` | [`PromptCacheFindingKind`](../type-aliases/PromptCacheFindingKind.md) | - |
| <a id="property-slot"></a> `slot?` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | Slot this finding is about, when it is about one specific slot. |
