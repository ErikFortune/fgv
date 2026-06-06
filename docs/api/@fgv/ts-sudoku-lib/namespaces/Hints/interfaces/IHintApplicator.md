[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / IHintApplicator

# Interface: IHintApplicator

Interface for hint application and validation.

## Methods

### applyHint()

> **applyHint**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICellState`](../../../interfaces/ICellState.md)[]\>

Applies a hint to the puzzle state, generating the necessary cell updates.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](IHint.md) | The hint to apply |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICellState`](../../../interfaces/ICellState.md)[]\>

Result containing the cell state updates needed to apply the hint

***

### canApplyHint()

> **canApplyHint**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>

Validates that a hint can be safely applied to the given state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](IHint.md) | The hint to validate |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>

Result indicating validation success or failure with details
