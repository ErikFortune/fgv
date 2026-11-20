[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / choice

# Variable: choice

> `const` **choice**: \<`T`\>(`instructions`, `criteria`) => [`ChoiceQuestion`](../interfaces/ChoiceQuestion.md)\<`T`\>

Create a question that selects between named alternatives.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-__typet"></a> `T` *extends* [`ChoiceCriteria`](../type-aliases/ChoiceCriteria.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `instructions` | [`EntryType`](../type-aliases/EntryType.md) | The question as text, a JSON object or array, or `null`. |
| `criteria` | `T` | Labels mapped to descriptions, or `null` for undescribed labels. |

## Returns

[`ChoiceQuestion`](../interfaces/ChoiceQuestion.md)\<`T`\>
