[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / ILogicalSlotConfig

# Interface: ILogicalSlotConfig

Declaration of one logical slot in the composed prompt's slot space. An
explicit `(contributor, slotName)` map — not name-matching — turns every
implicit dependency into a checked reference validated at
[HorizontalComposer.create](../classes/HorizontalComposer.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-contributorslots"></a> `contributorSlots` | `readonly` | readonly `object`[] | Ordered list of `(contributor, slotName)` pairs contributing to this logical slot. The composer validates at construction time that each referenced contributor exists (matched by `contributorProvenance`) and that the referenced slot appears on that contributor's [IResolvedPrompt.slots](IResolvedPrompt.md#property-slots). **Remarks** Declared order is a stable tiebreaker among contributions of equal provenance; provenance is the primary order. |
| <a id="property-logicalslotname"></a> `logicalSlotName` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | Name of the logical slot in the composed prompt's slot space. |
| <a id="property-separator"></a> `separator?` | `readonly` | `string` | Separator for the `'concatenate'` strategy (and the constraint block). Default `'\n\n'`. |
| <a id="property-strategy"></a> `strategy` | `readonly` | [`LogicalSlotStrategy`](../type-aliases/LogicalSlotStrategy.md) | Merge strategy for the slot's non-constraint contributions. |
