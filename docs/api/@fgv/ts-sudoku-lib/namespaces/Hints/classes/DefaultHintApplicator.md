[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / DefaultHintApplicator

# Class: DefaultHintApplicator

Default hint applicator that converts hints to cell state updates.

## Implements

- [`IHintApplicator`](../interfaces/IHintApplicator.md)

## Constructors

### Constructor

> **new DefaultHintApplicator**(`logger?`): `DefaultHintApplicator`

Creates a new DefaultHintApplicator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger?` | [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\> | Optional logger for diagnostic output |

#### Returns

`DefaultHintApplicator`

## Methods

### applyHint()

> **applyHint**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICellState`](../../../interfaces/ICellState.md)[]\>

Applies a hint to the puzzle state, generating the necessary cell updates.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to apply |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICellState`](../../../interfaces/ICellState.md)[]\>

Result containing the cell state updates needed to apply the hint

#### Implementation of

[`IHintApplicator`](../interfaces/IHintApplicator.md).[`applyHint`](../interfaces/IHintApplicator.md#applyhint)

***

### canApplyHint()

> **canApplyHint**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>

Validates that a hint can be safely applied to the given state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to validate |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>

Result indicating validation success or failure with details

#### Implementation of

[`IHintApplicator`](../interfaces/IHintApplicator.md).[`canApplyHint`](../interfaces/IHintApplicator.md#canapplyhint)
