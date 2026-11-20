[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IResolvedPrompt

# Interface: IResolvedPrompt

Output of a successful [PromptLibrary.resolve](../classes/PromptLibrary.md#resolve) invocation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `string` | Final rendered body, post Mustache + post anti-jailbreak preface. |
| <a id="property-composition"></a> `composition?` | `readonly` | [`IPromptComposition`](IPromptComposition.md) | Section-by-section view of `body` — present only when the request supplied [IPromptResolveRequest.composition](IPromptResolveRequest.md#property-composition). See [IPromptComposition](IPromptComposition.md). |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IPromptDescriptor`](IPromptDescriptor.md) | Descriptor that drove the resolve. |
| <a id="property-id"></a> `id` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Prompt id from the request. |
| <a id="property-slots"></a> `slots` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`IResolvedPromptSlot`](IResolvedPromptSlot.md)\> | Per-slot resolved view, keyed by [SlotName](../type-aliases/SlotName.md) — a stable, supported projection of `trace.mergedBindings` purpose-typed for horizontal composition. Each entry is the resolved pre-Mustache-render value plus its framing/provenance metadata; see [IResolvedPromptSlot](IResolvedPromptSlot.md). **Remarks** SAFETY: reading these values to compose a prompt *externally* bypasses the `applySafeguards` pass `resolve` runs over the resolved whole — an external composer **must self-screen the composed output** against its own safety policy. The in-fgv [HorizontalComposer](../classes/HorizontalComposer.md) is the durable, safety-closed path: it consumes these slots and re-runs `applySafeguards` against a first-class composed descriptor over the merged slot map. |
| <a id="property-trace"></a> `trace` | `readonly` | [`IPromptResolveTrace`](IPromptResolveTrace.md) | Full resolve-time trace; see [IPromptResolveTrace](IPromptResolveTrace.md). |
