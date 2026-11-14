[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / ISafeguardFinding

# Interface: ISafeguardFinding

Safeguard finding surfaced in the trace.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-detail"></a> `detail` | `readonly` | `string` | - |
| <a id="property-disposition"></a> `disposition` | `readonly` | [`SafeguardDisposition`](../type-aliases/SafeguardDisposition.md) | - |
| <a id="property-kind"></a> `kind` | `readonly` | [`SafeguardFindingKind`](../type-aliases/SafeguardFindingKind.md) | - |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\<`string`, `unknown`\>\> | Optional structured per-finding data — e.g. a classifier's per-label scores — that would otherwise have to be stringified into `detail`. |
| <a id="property-screener"></a> `screener?` | `readonly` | `string` | Name of the emitting [IScreener](IScreener.md), when the finding came from one. |
| <a id="property-slot"></a> `slot` | `readonly` | [`SlotName`](../type-aliases/SlotName.md) | - |
