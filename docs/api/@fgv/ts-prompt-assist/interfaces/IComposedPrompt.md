[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IComposedPrompt

# Interface: IComposedPrompt

Result of a successful [HorizontalComposer.compose](../classes/HorizontalComposer.md#compose), mirroring
[IResolvedPrompt](IResolvedPrompt.md)'s shape for the composed whole.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `string` | Final rendered body of the composed prompt (Mustache render of `composedBody`). |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IPromptDescriptor`](IPromptDescriptor.md) | The composed descriptor that drove the merge + safeguard pass. |
| <a id="property-mergedslots"></a> `mergedSlots` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`IResolvedPromptSlot`](IResolvedPromptSlot.md)\> | Merged per-logical-slot values, keyed by `logicalSlotName`. |
| <a id="property-provenancetrace"></a> `provenanceTrace` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), readonly [`ISlotProvenanceEntry`](ISlotProvenanceEntry.md)[]\> | Per-logical-slot contribution provenance, keyed by `logicalSlotName`. |
| <a id="property-safeguardfindings"></a> `safeguardFindings` | `readonly` | readonly [`ISafeguardFinding`](ISafeguardFinding.md)[] | Warn / info safeguard findings surfaced over the merged slot values. |
