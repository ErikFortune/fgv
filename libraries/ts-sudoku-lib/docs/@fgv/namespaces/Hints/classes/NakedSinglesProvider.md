[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / NakedSinglesProvider

# Class: NakedSinglesProvider

Hint provider for the Naked Singles technique.

A Naked Single occurs when a cell has only one possible candidate value
based on the constraints of its row, column, and 3x3 box.

## Extends

- [`BaseHintProvider`](BaseHintProvider.md)

## Constructors

### Constructor

> **new NakedSinglesProvider**(): `NakedSinglesProvider`

Creates a new NakedSinglesProvider instance.

#### Returns

`NakedSinglesProvider`

#### Overrides

[`BaseHintProvider`](BaseHintProvider.md).[`constructor`](BaseHintProvider.md#constructor)

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

> **canProvideHints**(`puzzle`, `state`): `boolean`

Determines if this provider can potentially generate hints for the given puzzle.
Always returns true since naked singles can potentially exist in any incomplete puzzle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

`boolean`

true if there are empty cells that might have naked singles

#### Overrides

[`BaseHintProvider`](BaseHintProvider.md).[`canProvideHints`](BaseHintProvider.md#canprovidehints)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`createCellAction`](BaseHintProvider.md#createcellaction)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`createExplanation`](BaseHintProvider.md#createexplanation)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`createHint`](BaseHintProvider.md#createhint)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`createRelevantCells`](BaseHintProvider.md#createrelevantcells)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`filterHints`](BaseHintProvider.md#filterhints)

***

### generateHints()

> **generateHints**(`puzzle`, `state`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Generates all naked single hints for the given puzzle.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Result containing array of naked single hints

#### Overrides

[`BaseHintProvider`](BaseHintProvider.md).[`generateHints`](BaseHintProvider.md#generatehints)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`getCandidates`](BaseHintProvider.md#getcandidates)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`getEmptyCells`](BaseHintProvider.md#getemptycells)

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

#### Inherited from

[`BaseHintProvider`](BaseHintProvider.md).[`validateOptions`](BaseHintProvider.md#validateoptions)

***

### create()

> `static` **create**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`NakedSinglesProvider`\>

Static factory method to create a new NakedSinglesProvider.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`NakedSinglesProvider`\>

Result containing the new provider
