[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / ISlotProvenanceEntry

# Interface: ISlotProvenanceEntry

Per-logical-slot provenance entry: one contributor's contribution to a
logical slot, recorded in [IComposedPrompt.provenanceTrace](IComposedPrompt.md#property-provenancetrace) in the
order it was merged (ascending provenance; constraints first).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-contributorslotname"></a> `contributorSlotName` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | Name of the slot on the contributor that supplied this contribution. |
| <a id="property-directive"></a> `directive` | `readonly` | [`SlotDirective`](../type-aliases/SlotDirective.md) | The contribution's framing directive. |
| <a id="property-provenance"></a> `provenance` | `readonly` | `number` | Provenance of the contributing contributor. |
| <a id="property-value"></a> `value` | `readonly` | `string` | The contribution's resolved value. |
