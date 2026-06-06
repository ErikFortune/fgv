[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / IHintExplanationProvider

# Interface: IHintExplanationProvider

Interface for hint explanation generation and formatting.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="techniqueid"></a> `techniqueId` | `readonly` | [`TechniqueId`](../type-aliases/TechniqueId.md) | Gets the technique ID this explanation provider supports. |

## Methods

### generateExplanations()

> **generateExplanations**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IHintExplanation`](IHintExplanation.md)[]\>

Generates explanations for a specific hint.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](IHint.md) | The hint to explain |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The puzzle state context |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IHintExplanation`](IHintExplanation.md)[]\>

Result containing array of explanations at different levels
