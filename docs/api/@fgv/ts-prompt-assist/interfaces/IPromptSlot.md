[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptSlot

# Interface: IPromptSlot

Declaration of a prompt slot.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-alloweddirectives"></a> `allowedDirectives?` | `readonly` | readonly [`SlotDirective`](../type-aliases/SlotDirective.md)[] | Default: any directive permitted. |
| <a id="property-cachestability"></a> `cacheStability?` | `readonly` | [`PromptCacheStability`](../type-aliases/PromptCacheStability.md) | Declared prompt-cache stability for this slot's value. Default `'per-request'` — absence never means "assume stable" (design.md §1, R-a). A resolve-time [IPromptResolveRequest.cacheStability](IPromptResolveRequest.md#property-cachestability) override for the same slot wins over this unconditionally. |
| <a id="property-defaultbinding"></a> `defaultBinding?` | `readonly` | [`SlotBinding`](../type-aliases/SlotBinding.md) | - |
| <a id="property-description"></a> `description` | `readonly` | `string` | - |
| <a id="property-kind"></a> `kind?` | `readonly` | `string` | Open string narrowed by the consumer's descriptor Converter. Default `'string'`. |
| <a id="property-maxlength"></a> `maxLength?` | `readonly` | `number` | - |
| <a id="property-name"></a> `name` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | - |
| <a id="property-required"></a> `required?` | `readonly` | `boolean` | Default `true`. |
| <a id="property-serializerid"></a> `serializerId?` | `readonly` | [`SerializerId`](../type-aliases/SerializerId.md) | - |
| <a id="property-source"></a> `source?` | `readonly` | `string` | Open string narrowed by the consumer's descriptor Converter. |
| <a id="property-writableby"></a> `writableBy?` | `readonly` | [`SlotWritability`](../type-aliases/SlotWritability.md) | Default `'any-scope'`. |
