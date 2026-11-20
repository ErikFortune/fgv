[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ScoreResponse

# Interface: ScoreResponse\<T\>

An expected score with its rubric and probabilities.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`ScoreCriteria`](../type-aliases/ScoreCriteria.md) | [`ScoreCriteria`](../type-aliases/ScoreCriteria.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence` | `readonly` | `number` | Reported confidence in the score. |
| <a id="property-legend"></a> `legend` | `readonly` | [`ScoreLegend`](../type-aliases/ScoreLegend.md)\<`T`\> | Rubric descriptions keyed by score. |
| <a id="property-probabilities"></a> `probabilities` | `readonly` | \{ readonly \[score in number \| \`$\{number\}\`\]: number \} | Probabilities keyed by score. |
| <a id="property-score"></a> `score` | `readonly` | `number` | Expected score, which may fall between integer rubric levels. |
| <a id="property-type"></a> `type` | `readonly` | `"score"` | - |
