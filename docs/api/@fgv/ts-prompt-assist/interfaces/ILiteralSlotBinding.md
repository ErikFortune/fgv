[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / ILiteralSlotBinding

# Interface: ILiteralSlotBinding

Literal slot binding — a fixed string value framed by a directive.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-directive"></a> `directive` | `readonly` | [`SlotDirective`](../type-aliases/SlotDirective.md) | - |
| <a id="property-enforced"></a> `enforced?` | `readonly` | `boolean` | When `true`, caller substitutions for this slot are ignored. |
| <a id="property-kind"></a> `kind` | `readonly` | `"literal"` | Discriminator for the slot-binding union. |
| <a id="property-value"></a> `value` | `readonly` | `string` | - |
