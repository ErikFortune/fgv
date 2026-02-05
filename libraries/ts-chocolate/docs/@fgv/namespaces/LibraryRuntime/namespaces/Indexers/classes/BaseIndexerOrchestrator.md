[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / BaseIndexerOrchestrator

# Abstract Class: BaseIndexerOrchestrator\<TEntity, TId\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:39](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L39)

Base class for index orchestrators that provides common
set operations and entity resolution logic.

## Extended by

- [`FillingRecipeIndexerOrchestrator`](FillingRecipeIndexerOrchestrator.md)
- [`IngredientIndexerOrchestrator`](IngredientIndexerOrchestrator.md)

## Type Parameters

### TEntity

`TEntity`

The entity type (e.g., IRuntimeRecipe)

### TId

`TId`

The ID type (e.g., RecipeId)

## Constructors

### Constructor

> `protected` **new BaseIndexerOrchestrator**\<`TEntity`, `TId`\>(`library`, `resolver`): `BaseIndexerOrchestrator`\<`TEntity`, `TId`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:61](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L61)

Creates a new BaseIndexerOrchestrator.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

##### resolver

[`IEntityResolver`](../interfaces/IEntityResolver.md)\<`TEntity`, `TId`\>

The entity resolver

#### Returns

`BaseIndexerOrchestrator`\<`TEntity`, `TId`\>

## Properties

### \_resolver

> `protected` `readonly` **\_resolver**: [`IEntityResolver`](../interfaces/IEntityResolver.md)\<`TEntity`, `TId`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:48](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L48)

The entity resolver for converting IDs to entities.

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:43](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L43)

The chocolate library being indexed.

## Accessors

### \_logger

#### Get Signature

> **get** `protected` **\_logger**(): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:53](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L53)

Logger for reporting indexer or orchestrator operations.

##### Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

## Methods

### \_intersect()

> `protected` **\_intersect**(`sets`): `Set`\<`TId`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:75](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L75)

Computes intersection of multiple sets.

#### Parameters

##### sets

`Set`\<`TId`\>[]

Array of sets to intersect

#### Returns

`Set`\<`TId`\>

Set containing IDs present in all input sets

***

### \_resolveToEntities()

> `protected` **\_resolveToEntities**(`ids`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TEntity`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:117](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L117)

Resolves a set of IDs to entities.

#### Parameters

##### ids

`Set`\<`TId`\>

Set of IDs to resolve

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TEntity`[]\>

Array of resolved entities, or Failure if any resolution fails

***

### \_union()

> `protected` **\_union**(`sets`): `Set`\<`TId`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:102](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L102)

Computes union of multiple sets.

#### Parameters

##### sets

`Set`\<`TId`\>[]

Array of sets to union

#### Returns

`Set`\<`TId`\>

Set containing IDs present in any input set
