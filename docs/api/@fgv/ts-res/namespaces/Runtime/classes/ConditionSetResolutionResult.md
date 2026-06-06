[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ConditionSetResolutionResult

# Class: ConditionSetResolutionResult

Represents the result of resolving a condition set.
Contains either a failure indicator or a list of condition priority/score tuples sorted by priority then score.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="matches"></a> `matches` | `readonly` | readonly [`IConditionMatchResult`](../interfaces/IConditionMatchResult.md)[] |
| <a id="matchtype"></a> `matchType` | `readonly` | [`ConditionMatchType`](../type-aliases/ConditionMatchType.md) |

## Accessors

### maxPriority

#### Get Signature

> **get** **maxPriority**(): [`ConditionPriority`](../../../type-aliases/ConditionPriority.md)

Gets the highest priority among all condition matches.

##### Returns

[`ConditionPriority`](../../../type-aliases/ConditionPriority.md)

The highest priority, or 0 if no matches.

***

### totalScore

#### Get Signature

> **get** **totalScore**(): [`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

Gets the total score by summing all condition match scores.

##### Returns

[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

The total score, or 0 if no matches.

## Methods

### compare()

> `static` **compare**(`a`, `b`): `number`

Compares two condition set resolution results for sorting purposes.
The priority of a condition set result cannot be boiled down to a single number -
we have to examine each condition result in turn.

Comparison logic:
- If priority differs, return the higher priority
- If priority matches but score is different, return the higher score
- If priority and score both match, proceed to the next condition
- Failed results are considered lower priority than successful results

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `a` | `ConditionSetResolutionResult` | The first condition set resolution result to compare. |
| `b` | `ConditionSetResolutionResult` | The second condition set resolution result to compare. |

#### Returns

`number`

A negative number if a should come before b, a positive number if a should
come after b, or zero if they are equivalent.

***

### create()

> `static` **create**(`matchType`, `matches`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ConditionSetResolutionResult`\>

Creates a new condition set resolution result.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `matchType` | [`ConditionMatchType`](../type-aliases/ConditionMatchType.md) | The type of match. |
| `matches` | readonly [`IConditionMatchResult`](../interfaces/IConditionMatchResult.md)[] | Array of condition match results. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ConditionSetResolutionResult`\>

A new ConditionSetResolutionResult.
