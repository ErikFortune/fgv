[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / IHintProvider

# Interface: IHintProvider

Interface for classes that can provide hints using a specific solving technique.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="difficulty"></a> `difficulty` | `readonly` | [`DifficultyLevel`](../type-aliases/DifficultyLevel.md) |
| <a id="priority"></a> `priority` | `readonly` | `number` |
| <a id="techniqueid"></a> `techniqueId` | `readonly` | [`TechniqueId`](../type-aliases/TechniqueId.md) |
| <a id="techniquename"></a> `techniqueName` | `readonly` | `string` |

## Methods

### canProvideHints()

> **canProvideHints**(`puzzle`, `state`): `boolean`

Determines if this provider can potentially generate hints for the given puzzle.
This should be a fast check to avoid expensive hint generation when not applicable.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

`boolean`

true if this provider might be able to generate hints

***

### generateHints()

> **generateHints**(`puzzle`, `state`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IHint`](IHint.md)[]\>

Generates all possible hints using this technique for the given puzzle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IHint`](IHint.md)[]\>

Result containing array of hints, or failure if generation fails
