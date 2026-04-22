[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / HintSystem

# Class: HintSystem

Main hint system that provides comprehensive hint generation and management.

## Constructors

### Constructor

> **new HintSystem**(`registry`, `applicator`, `config`): `HintSystem`

Creates a new HintSystem instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `registry` | [`IHintRegistry`](../interfaces/IHintRegistry.md) | The hint registry to use |
| `applicator` | [`IHintApplicator`](../interfaces/IHintApplicator.md) | The hint applicator to use |
| `config` | [`IHintSystemConfig`](../interfaces/IHintSystemConfig.md) | Configuration options |

#### Returns

`HintSystem`

## Accessors

### applicator

#### Get Signature

> **get** **applicator**(): [`IHintApplicator`](../interfaces/IHintApplicator.md)

Gets the hint applicator.

##### Returns

[`IHintApplicator`](../interfaces/IHintApplicator.md)

The hint applicator

***

### config

#### Get Signature

> **get** **config**(): [`IHintSystemConfig`](../interfaces/IHintSystemConfig.md)

Gets the system configuration.

##### Returns

[`IHintSystemConfig`](../interfaces/IHintSystemConfig.md)

The configuration

***

### registry

#### Get Signature

> **get** **registry**(): [`IHintRegistry`](../interfaces/IHintRegistry.md)

Gets the hint registry.

##### Returns

[`IHintRegistry`](../interfaces/IHintRegistry.md)

The hint registry

## Methods

### applyHint()

> **applyHint**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICellState`](../../../interfaces/ICellState.md)[]\>

Applies a hint to generate cell state updates.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to apply |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`ICellState`](../../../interfaces/ICellState.md)[]\>

Result containing the cell updates

***

### formatHintExplanation()

> **formatHintExplanation**(`hint`, `level?`): `string`

Formats a hint explanation for display.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to format |
| `level?` | [`ExplanationLevel`](../type-aliases/ExplanationLevel.md) | The explanation level to use (defaults to config default) |

#### Returns

`string`

Formatted explanation string

***

### generateHints()

> **generateHints**(`puzzle`, `state`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Generates all available hints for the current puzzle state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Result containing array of hints

***

### getBestHint()

> **getBestHint**(`puzzle`, `state`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IHint`](../interfaces/IHint.md)\>

Gets the best available hint for the current puzzle state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IHint`](../interfaces/IHint.md)\>

Result containing the best hint

***

### getHintStatistics()

> **getHintStatistics**(`puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `hintsByDifficulty`: `Map`\<`string`, `number`\>; `hintsByTechnique`: `Map`\<`string`, `number`\>; `totalHints`: `number`; \}\>

Gets statistics about available hints for the current state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `hintsByDifficulty`: `Map`\<`string`, `number`\>; `hintsByTechnique`: `Map`\<`string`, `number`\>; `totalHints`: `number`; \}\>

Result containing hint statistics

***

### getSystemSummary()

> **getSystemSummary**(): `string`

Gets a summary of the hint system capabilities.

#### Returns

`string`

System capabilities summary

***

### hasHints()

> **hasHints**(`puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Checks if the puzzle state has any available hints.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Result containing boolean indicating if hints are available

***

### validateHint()

> **validateHint**(`hint`, `puzzle`, `state`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>

Validates that a hint can be applied to the current state.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hint` | [`IHint`](../interfaces/IHint.md) | The hint to validate |
| `puzzle` | [`Puzzle`](../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../classes/PuzzleState.md) | The current puzzle state |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`void`\>

Result indicating validation success or failure

***

### create()

> `static` **create**(`config?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`HintSystem`\>

Creates a new HintSystem with default providers and configuration.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | [`IHintSystemConfig`](../interfaces/IHintSystemConfig.md) | Optional configuration options |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`HintSystem`\>

Result containing the new hint system
