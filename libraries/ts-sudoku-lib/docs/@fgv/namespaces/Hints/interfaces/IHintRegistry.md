[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / IHintRegistry

# Interface: IHintRegistry

Interface for managing and coordinating multiple hint providers.

## Methods

### generateAllHints()

> **generateAllHints**(`puzzle`, `state`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](IHint.md)[]\>

Generates hints using all applicable providers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](IHint.md)[]\>

Result containing array of hints from all providers

***

### getBestHint()

> **getBestHint**(`puzzle`, `state`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHint`](IHint.md)\>

Gets the best available hint based on difficulty and confidence.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHint`](IHint.md)\>

Result containing the best hint, or failure if no hints available

***

### getProvider()

> **getProvider**(`techniqueId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHintProvider`](IHintProvider.md)\>

Gets a specific provider by technique ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The ID of the technique |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHintProvider`](IHintProvider.md)\>

Result containing the provider, or failure if not found

***

### getProviders()

> **getProviders**(`options?`): readonly [`IHintProvider`](IHintProvider.md)[]

Gets all registered providers, optionally filtered by criteria.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](IHintGenerationOptions.md) | Optional filtering options |

#### Returns

readonly [`IHintProvider`](IHintProvider.md)[]

Array of providers matching the criteria

***

### getRegisteredTechniques()

> **getRegisteredTechniques**(): readonly [`TechniqueId`](../type-aliases/TechniqueId.md)[]

Gets all registered technique IDs.

#### Returns

readonly [`TechniqueId`](../type-aliases/TechniqueId.md)[]

Array of technique IDs

***

### registerProvider()

> **registerProvider**(`provider`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Registers a new hint provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`IHintProvider`](IHintProvider.md) | The provider to register |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure of registration

***

### unregisterProvider()

> **unregisterProvider**(`techniqueId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Unregisters a hint provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The ID of the technique to unregister |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure of unregistration
