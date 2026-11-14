[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ScoreQuestion

# Interface: ScoreQuestion\<T\>

A question that assigns a score using an ordered rubric.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`ScoreCriteria`](../type-aliases/ScoreCriteria.md) | [`ScoreCriteria`](../type-aliases/ScoreCriteria.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-criteria"></a> `criteria` | `T` | Descriptions of the available outcomes. |
| <a id="property-instructions"></a> `instructions?` | [`EntryType`](../type-aliases/EntryType.md) | The question as text, a JSON object, or an array; optional or `null`. |
| <a id="property-type"></a> `type` | `"score"` | - |
