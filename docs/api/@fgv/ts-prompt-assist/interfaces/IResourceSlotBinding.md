[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IResourceSlotBinding

# Interface: IResourceSlotBinding

Resource slot binding — references another prompt id; the library resolves
it recursively and substitutes the rendered body into the parent slot.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-directive"></a> `directive` | `readonly` | [`SlotDirective`](../type-aliases/SlotDirective.md) | - |
| <a id="property-enforced"></a> `enforced?` | `readonly` | `boolean` | When `true`, caller substitutions for this slot are ignored. |
| <a id="property-kind"></a> `kind` | `readonly` | `"resource"` | Discriminator for the slot-binding union. |
| <a id="property-qualifiers"></a> `qualifiers?` | `readonly` | `Readonly`\<`Partial`\<`Record`\<`string`, `string`\>\>\> | - |
| <a id="property-resourceid"></a> `resourceId` | `readonly` | [`ResourceId`](../type-aliases/ResourceId.md) | - |
| <a id="property-scopeoverride"></a> `scopeOverride?` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | - |
| <a id="property-substitutions"></a> `substitutions?` | `readonly` | `Readonly`\<`Record`\<`string`, `string` \| [`SlotBinding`](../type-aliases/SlotBinding.md)\>\> | When supplied, replaces (does NOT layer over) the parent's substitution map for the inner resolve. See OQ-2. |
