[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ChoiceQuestion

# Interface: ChoiceQuestion\<T\>

A question that selects between named alternatives.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`ChoiceCriteria`](../type-aliases/ChoiceCriteria.md) | [`ChoiceCriteria`](../type-aliases/ChoiceCriteria.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-criteria"></a> `criteria` | `T` | Descriptions of the available outcomes. |
| <a id="property-instructions"></a> `instructions?` | [`EntryType`](../type-aliases/EntryType.md) | The question as text, a JSON object, or an array; optional or `null`. |
| <a id="property-type"></a> `type` | `"choice"` | - |
