[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IResolvedPromptSlot

# Interface: IResolvedPromptSlot

Per-slot view of a resolved prompt, purpose-typed for horizontal composition
patterns. A stable, supported alternative view over `trace.mergedBindings` for
consumers that read per-slot values to compose a prompt externally — the same
data as the corresponding [IBindingTraceEntry](IBindingTraceEntry.md), projected with the slot
`name` and surfaced as a first-class primitive rather than a trace detail.

## Remarks

The `value` here is the resolved slot content (post-merge,
post-resource-binding, pre-Mustache-render) — the exact string fed into the
body template renderer for this slot during [PromptLibrary.resolve](../classes/PromptLibrary.md#resolve).

SAFETY: a consumer that reads these per-slot values and assembles a prompt
*externally* bypasses the `applySafeguards` pass that `resolve` runs over the
resolved whole, and **must independently screen the composed output against
its own safety policy.** The durable, safety-closed path is the in-fgv
[HorizontalComposer](../classes/HorizontalComposer.md), which consumes these slots and runs
`applySafeguards` against a first-class composed descriptor over the merged
slot map before returning a body — prefer it over a hand-rolled external
composer.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-directive"></a> `directive` | `readonly` | [`SlotDirective`](../type-aliases/SlotDirective.md) | Framing directive for the slot's winning binding. |
| <a id="property-name"></a> `name` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | Slot name (key into [IResolvedPrompt.slots](IResolvedPrompt.md#property-slots)). |
| <a id="property-source"></a> `source` | `readonly` | [`BindingTraceSource`](../type-aliases/BindingTraceSource.md) | Source of the winning binding. |
| <a id="property-value"></a> `value` | `readonly` | `string` | Resolved slot value string (post-merge, post-resource-binding, pre-Mustache-render) — the exact string fed into the body template renderer as this slot's substitution. Slot values are substituted literally; they are not themselves rendered through Mustache. |
| <a id="property-wasenforced"></a> `wasEnforced` | `readonly` | `boolean` | True iff the winning binding was enforced (caller substitutions were rejected). |
| <a id="property-winningscope"></a> `winningScope?` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Set when `source === 'binding'` — the scope whose `_bindings.yaml` won. |
