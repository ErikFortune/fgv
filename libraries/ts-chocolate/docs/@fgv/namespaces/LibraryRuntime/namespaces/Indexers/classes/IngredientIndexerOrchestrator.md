[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IngredientIndexerOrchestrator

# Class: IngredientIndexerOrchestrator

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts:82](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts#L82)

Orchestrator for ingredient indexers.

Encapsulates all ingredient-related indexers and provides a unified
find interface. The resolver is provided by the RuntimeContext
to enable ID-to-entity resolution.

## Extends

- [`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md)\<[`AnyIngredient`](../../../type-aliases/AnyIngredient.md), [`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

## Constructors

### Constructor

> **new IngredientIndexerOrchestrator**(`library`, `resolver`): `IngredientIndexerOrchestrator`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts:92](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts#L92)

Creates a new IngredientIndexerOrchestrator.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

The chocolate library to index

##### resolver

[`IngredientResolver`](../type-aliases/IngredientResolver.md)

Function to resolve ingredient IDs to entities

#### Returns

`IngredientIndexerOrchestrator`

#### Overrides

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`constructor`](BaseIndexerOrchestrator.md#constructor)

## Properties

### \_resolver

> `protected` `readonly` **\_resolver**: [`IEntityResolver`](../interfaces/IEntityResolver.md)\<[`AnyIngredient`](../../../type-aliases/AnyIngredient.md), [`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:48](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L48)

The entity resolver for converting IDs to entities.

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_resolver`](BaseIndexerOrchestrator.md#_resolver)

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:43](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L43)

The chocolate library being indexed.

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`library`](BaseIndexerOrchestrator.md#library)

## Accessors

### \_logger

#### Get Signature

> **get** `protected` **\_logger**(): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:53](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L53)

Logger for reporting indexer or orchestrator operations.

##### Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_logger`](BaseIndexerOrchestrator.md#_logger)

## Methods

### \_intersect()

> `protected` **\_intersect**(`sets`): `Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:75](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L75)

Computes intersection of multiple sets.

#### Parameters

##### sets

`Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>[]

Array of sets to intersect

#### Returns

`Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Set containing IDs present in all input sets

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_intersect`](BaseIndexerOrchestrator.md#_intersect)

***

### \_resolveToEntities()

> `protected` **\_resolveToEntities**(`ids`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`AnyIngredient`](../../../type-aliases/AnyIngredient.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L117)

Resolves a set of IDs to entities.

#### Parameters

##### ids

`Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Set of IDs to resolve

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`AnyIngredient`](../../../type-aliases/AnyIngredient.md)[]\>

Array of resolved entities, or Failure if any resolution fails

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_resolveToEntities`](BaseIndexerOrchestrator.md#_resolvetoentities)

***

### \_union()

> `protected` **\_union**(`sets`): `Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L102)

Computes union of multiple sets.

#### Parameters

##### sets

`Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>[]

Array of sets to union

#### Returns

`Set`\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Set containing IDs present in any input set

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_union`](BaseIndexerOrchestrator.md#_union)

***

### convertConfig()

> **convertConfig**(`json`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientQuerySpec`](../interfaces/IIngredientQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts:150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts#L150)

Converts a JSON query specification to a typed config.

#### Parameters

##### json

`unknown`

JSON object with indexer name strings as keys and config objects as values

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IIngredientQuerySpec`](../interfaces/IIngredientQuerySpec.md)\>

Typed query spec

***

### find()

> **find**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`AnyIngredient`](../../../type-aliases/AnyIngredient.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts:110](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts#L110)

Finds ingredients matching a query specification.

#### Parameters

##### spec

[`IIngredientQuerySpec`](../interfaces/IIngredientQuerySpec.md)

Query specification with configs keyed by indexer name

##### options?

[`IFindOptions`](../interfaces/IFindOptions.md)

Optional find options (aggregation mode)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`AnyIngredient`](../../../type-aliases/AnyIngredient.md)[]\>

Array of matching ingredients

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts:157](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts#L157)

Invalidates all indexer caches.

#### Returns

`void`

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts:164](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientIndexerOrchestrator.ts#L164)

Pre-warms all indexers.

#### Returns

`void`
