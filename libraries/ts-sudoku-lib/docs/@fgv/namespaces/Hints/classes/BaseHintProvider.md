[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / BaseHintProvider

# Abstract Class: BaseHintProvider

Abstract base class providing common functionality for hint providers.

## Extended by

- [`NakedSinglesProvider`](NakedSinglesProvider.md)
- [`HiddenSinglesProvider`](HiddenSinglesProvider.md)

## Implements

- [`IHintProvider`](../interfaces/IHintProvider.md)

## Constructors

### Constructor

> `protected` **new BaseHintProvider**(`config`): `BaseHintProvider`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`IBaseHintProviderConfig`](../interfaces/IBaseHintProviderConfig.md) |

#### Returns

`BaseHintProvider`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="defaultconfidence"></a> `defaultConfidence` | `readonly` | [`ConfidenceLevel`](../type-aliases/ConfidenceLevel.md) |
| <a id="difficulty"></a> `difficulty` | `readonly` | [`DifficultyLevel`](../type-aliases/DifficultyLevel.md) |
| <a id="priority"></a> `priority` | `readonly` | `number` |
| <a id="techniqueid"></a> `techniqueId` | `readonly` | [`TechniqueId`](../type-aliases/TechniqueId.md) |
| <a id="techniquename"></a> `techniqueName` | `readonly` | `string` |

## Methods

### canProvideHints()

> `abstract` **canProvideHints**(`puzzle`, `state`): `boolean`

Abstract method to be implemented by concrete providers.
Determines if this provider can potentially generate hints for the given puzzle.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) |

#### Returns

`boolean`

#### Implementation of

[`IHintProvider`](../interfaces/IHintProvider.md).[`canProvideHints`](../interfaces/IHintProvider.md#canprovidehints)

***

### createCellAction()

> `protected` **createCellAction**(`cellId`, `action`, `value?`, `reason?`): [`ICellAction`](../interfaces/ICellAction.md)

Utility method to create cell actions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cellId` | [`CellId`](../../../../type-aliases/CellId.md) | The ID of the cell to act upon |
| `action` | [`CellAction`](../type-aliases/CellAction.md) | The type of action to perform |
| `value?` | `number` | Optional value for set-value actions |
| `reason?` | `string` | Optional reason for the action |

#### Returns

[`ICellAction`](../interfaces/ICellAction.md)

A cell action object

***

### createExplanation()

> `protected` **createExplanation**(`level`, `title`, `description`, `steps?`, `tips?`): [`IHintExplanation`](../interfaces/IHintExplanation.md)

Utility method to create hint explanations.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`ExplanationLevel`](../type-aliases/ExplanationLevel.md) | The level of detail for the explanation |
| `title` | `string` | The title of the explanation |
| `description` | `string` | The main description |
| `steps?` | readonly `string`[] | Optional step-by-step instructions |
| `tips?` | readonly `string`[] | Optional tips for understanding the technique |

#### Returns

[`IHintExplanation`](../interfaces/IHintExplanation.md)

A hint explanation object

***

### createHint()

> `protected` **createHint**(`cellActions`, `relevantCells`, `explanations`, `confidence?`): [`IHint`](../interfaces/IHint.md)

Utility method to create a hint with consistent structure.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cellActions` | readonly [`ICellAction`](../interfaces/ICellAction.md)[] | The actions to be performed on cells |
| `relevantCells` | [`IRelevantCells`](../interfaces/IRelevantCells.md) | The cells relevant to understanding the hint |
| `explanations` | readonly [`IHintExplanation`](../interfaces/IHintExplanation.md)[] | The explanations for the hint |
| `confidence?` | [`ConfidenceLevel`](../type-aliases/ConfidenceLevel.md) | The confidence level for this hint |

#### Returns

[`IHint`](../interfaces/IHint.md)

A complete hint object

***

### createRelevantCells()

> `protected` **createRelevantCells**(`primary`, `secondary`, `affected`): [`IRelevantCells`](../interfaces/IRelevantCells.md)

Utility method to create relevant cells grouping.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `primary` | readonly [`CellId`](../../../../type-aliases/CellId.md)[] | `undefined` | Primary cells that are the focus of the hint |
| `secondary` | readonly [`CellId`](../../../../type-aliases/CellId.md)[] | `[]` | Secondary cells that provide context |
| `affected` | readonly [`CellId`](../../../../type-aliases/CellId.md)[] | `[]` | Cells that will be affected by applying the hint |

#### Returns

[`IRelevantCells`](../interfaces/IRelevantCells.md)

A relevant cells object

***

### filterHints()

> `protected` **filterHints**(`hints`, `options?`): readonly [`IHint`](../interfaces/IHint.md)[]

Filters hints based on generation options.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hints` | readonly [`IHint`](../interfaces/IHint.md)[] | The hints to filter |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | The filtering options |

#### Returns

readonly [`IHint`](../interfaces/IHint.md)[]

Filtered array of hints

***

### generateHints()

> `abstract` **generateHints**(`puzzle`, `state`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Abstract method to be implemented by concrete providers.
Generates all possible hints using this technique for the given puzzle.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

#### Implementation of

[`IHintProvider`](../interfaces/IHintProvider.md).[`generateHints`](../interfaces/IHintProvider.md#generatehints)

***

### getCandidates()

> `protected` **getCandidates**(`cellId`, `puzzle`, `state`): `number`[]

Gets the possible candidate values for a specific cell using cage-based constraints.
This implementation works with any puzzle variant by checking all applicable cages.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cellId` | [`CellId`](../../../../type-aliases/CellId.md) | The cell to analyze |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

`number`[]

Array of possible values for the cell

***

### getEmptyCells()

> `protected` **getEmptyCells**(`puzzle`, `state`): [`CellId`](../../../../type-aliases/CellId.md)[]

Gets all empty cells in the puzzle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The puzzle state to analyze |

#### Returns

[`CellId`](../../../../type-aliases/CellId.md)[]

Array of cell IDs that are empty

***

### validateOptions()

> `protected` **validateOptions**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Validates generation options for consistency.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | The options to validate |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating validation success or failure
