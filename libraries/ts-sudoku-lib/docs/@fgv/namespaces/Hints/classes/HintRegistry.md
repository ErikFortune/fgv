[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / HintRegistry

# Class: HintRegistry

Implementation of the hint registry that manages and coordinates multiple hint providers.

## Implements

- [`IHintRegistry`](../interfaces/IHintRegistry.md)

## Constructors

### Constructor

> **new HintRegistry**(): `HintRegistry`

Creates a new HintRegistry instance.

#### Returns

`HintRegistry`

## Accessors

### providerCount

#### Get Signature

> **get** **providerCount**(): `number`

Gets the number of registered providers.

##### Returns

`number`

The number of registered providers

## Methods

### clear()

> **clear**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Clears all registered providers.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success

***

### generateAllHints()

> **generateAllHints**(`puzzle`, `state`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Generates hints using all applicable providers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IHint`](../interfaces/IHint.md)[]\>

Result containing array of hints from all providers

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`generateAllHints`](../interfaces/IHintRegistry.md#generateallhints)

***

### getBestHint()

> **getBestHint**(`puzzle`, `state`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHint`](../interfaces/IHint.md)\>

Gets the best available hint based on difficulty and confidence.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle structure containing constraints |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | The current puzzle state |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional generation options |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHint`](../interfaces/IHint.md)\>

Result containing the best hint, or failure if no hints available

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`getBestHint`](../interfaces/IHintRegistry.md#getbesthint)

***

### getProvider()

> **getProvider**(`techniqueId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHintProvider`](../interfaces/IHintProvider.md)\>

Gets a specific provider by technique ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The ID of the technique |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IHintProvider`](../interfaces/IHintProvider.md)\>

Result containing the provider, or failure if not found

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`getProvider`](../interfaces/IHintRegistry.md#getprovider)

***

### getProviders()

> **getProviders**(`options?`): readonly [`IHintProvider`](../interfaces/IHintProvider.md)[]

Gets all registered providers, optionally filtered by criteria.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHintGenerationOptions`](../interfaces/IHintGenerationOptions.md) | Optional filtering options |

#### Returns

readonly [`IHintProvider`](../interfaces/IHintProvider.md)[]

Array of providers matching the criteria

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`getProviders`](../interfaces/IHintRegistry.md#getproviders)

***

### getProvidersByDifficulty()

> **getProvidersByDifficulty**(): `Map`\<[`DifficultyLevel`](../type-aliases/DifficultyLevel.md), readonly [`IHintProvider`](../interfaces/IHintProvider.md)[]\>

Gets providers grouped by difficulty level.

#### Returns

`Map`\<[`DifficultyLevel`](../type-aliases/DifficultyLevel.md), readonly [`IHintProvider`](../interfaces/IHintProvider.md)[]\>

Map of difficulty levels to providers

***

### getRegisteredTechniques()

> **getRegisteredTechniques**(): readonly [`TechniqueId`](../type-aliases/TechniqueId.md)[]

Gets all registered technique IDs.

#### Returns

readonly [`TechniqueId`](../type-aliases/TechniqueId.md)[]

Array of technique IDs

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`getRegisteredTechniques`](../interfaces/IHintRegistry.md#getregisteredtechniques)

***

### hasProvider()

> **hasProvider**(`techniqueId`): `boolean`

Checks if a specific technique is registered.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique ID to check |

#### Returns

`boolean`

true if the technique is registered

***

### registerProvider()

> **registerProvider**(`provider`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Registers a new hint provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`IHintProvider`](../interfaces/IHintProvider.md) | The provider to register |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure of registration

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`registerProvider`](../interfaces/IHintRegistry.md#registerprovider)

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

#### Implementation of

[`IHintRegistry`](../interfaces/IHintRegistry.md).[`unregisterProvider`](../interfaces/IHintRegistry.md#unregisterprovider)

***

### create()

> `static` **create**(`providers?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`HintRegistry`\>

Creates a new HintRegistry with the specified providers pre-registered.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `providers?` | readonly [`IHintProvider`](../interfaces/IHintProvider.md)[] | The providers to register |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`HintRegistry`\>

Result containing the new registry or failure if registration fails
