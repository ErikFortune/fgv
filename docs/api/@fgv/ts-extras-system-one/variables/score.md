[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / score

# Variable: score

> `const` **score**: \<`T`\>(`instructions`, `criteria`) => [`ScoreQuestion`](../interfaces/ScoreQuestion.md)\<`T`\>

Create a score question using an ordered rubric.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-__typet"></a> `T` *extends* [`ScoreCriteria`](../type-aliases/ScoreCriteria.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `instructions` | [`EntryType`](../type-aliases/EntryType.md) | The question as text, a JSON object or array, or `null`. |
| `criteria` | `T` | At least two descriptions indexed by score from zero; entries may be `null`. |

## Returns

[`ScoreQuestion`](../interfaces/ScoreQuestion.md)\<`T`\>
