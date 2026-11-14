[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / noul

# Variable: noul

> `const` **noul**: (`instructions?`, `criteria?`) => [`NoulQuestion`](../interfaces/NoulQuestion.md)

Create a yes/no question with optional descriptions for either outcome.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `instructions?` | [`EntryType`](../type-aliases/EntryType.md) | The question as text, a JSON object or array; defaults to `null`. |
| `criteria?` | [`NoulQuestion`](../interfaces/NoulQuestion.md)\[`"criteria"`\] | Optional descriptions of the yes and no outcomes. |

## Returns

[`NoulQuestion`](../interfaces/NoulQuestion.md)
