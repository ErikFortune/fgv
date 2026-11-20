[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPendingResourceBinding

# Interface: IPendingResourceBinding

A resource-binding entry that survives the synchronous binding merge with
an empty placeholder `value` and must be resolved asynchronously by the
caller (the recursive resource-binding resolver in `PromptLibrary`).

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-binding"></a> `binding` | `readonly` | [`IResourceSlotBinding`](IResourceSlotBinding.md) |
| <a id="property-slot"></a> `slot` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) |
