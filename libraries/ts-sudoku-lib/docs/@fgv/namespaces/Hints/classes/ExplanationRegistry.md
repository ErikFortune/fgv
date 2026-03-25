[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / ExplanationRegistry

# Class: ExplanationRegistry

Registry for managing hint explanation providers.

## Constructors

### Constructor

> **new ExplanationRegistry**(): `ExplanationRegistry`

Creates a new ExplanationRegistry instance.

#### Returns

`ExplanationRegistry`

## Methods

### getExplanationAtLevel()

> **getExplanationAtLevel**(`hint`, `level`, `puzzle`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHintExplanation`](../interfaces/IHintExplanation.md)\>

Gets a specific explanation at the requested level.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to explain |
| `level` | [`ExplanationLevel`](../type-aliases/ExplanationLevel.md) | The desired explanation level |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | - |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The puzzle state context |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHintExplanation`](../interfaces/IHintExplanation.md)\>

Result containing the explanation at the specified level

***

### getExplanations()

> **getExplanations**(`hint`, `puzzle`, `state`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHintExplanation`](../interfaces/IHintExplanation.md)[]\>

Gets explanations for a specific hint.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to explain |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The puzzle state context |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHintExplanation`](../interfaces/IHintExplanation.md)[]\>

Result containing the explanations

***

### registerProvider()

> **registerProvider**(`provider`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Registers a new explanation provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`IHintExplanationProvider`](../interfaces/IHintExplanationProvider.md) | The provider to register |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure of registration
