[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / NoulQuestion

# Interface: NoulQuestion

A yes/no question with optional descriptions for either outcome.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-criteria"></a> `criteria?` | \{ `false?`: [`EntryType`](../type-aliases/EntryType.md); `true?`: [`EntryType`](../type-aliases/EntryType.md); \} \| `null` | Optional descriptions of the yes and no outcomes. |
| <a id="property-instructions"></a> `instructions?` | [`EntryType`](../type-aliases/EntryType.md) | The question as text, a JSON object, or an array; optional or `null`. |
| <a id="property-type"></a> `type` | `"noul"` | - |
