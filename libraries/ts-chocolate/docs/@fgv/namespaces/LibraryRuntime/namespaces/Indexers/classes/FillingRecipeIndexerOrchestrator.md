[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / FillingRecipeIndexerOrchestrator

# Class: FillingRecipeIndexerOrchestrator

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts:99](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts#L99)

Orchestrator for filling recipe indexers.

Encapsulates all filling recipe-related indexers and provides a unified
find interface. The resolver is provided by the RuntimeContext
to enable ID-to-entity resolution.

## Extends

- [`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md)\<[`FillingRecipe`](../../../classes/FillingRecipe.md), [`FillingId`](../../../../../../type-aliases/FillingId.md)\>

## Constructors

### Constructor

> **new FillingRecipeIndexerOrchestrator**(`library`, `resolver`): `FillingRecipeIndexerOrchestrator`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts:112](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts#L112)

Creates a new FillingRecipeIndexerOrchestrator.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

The chocolate library to index

##### resolver

[`FillingRecipeResolver`](../type-aliases/FillingRecipeResolver.md)

Function to resolve filling recipe IDs to entities

#### Returns

`FillingRecipeIndexerOrchestrator`

#### Overrides

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`constructor`](BaseIndexerOrchestrator.md#constructor)

## Properties

### \_resolver

> `protected` `readonly` **\_resolver**: [`IEntityResolver`](../interfaces/IEntityResolver.md)\<[`FillingRecipe`](../../../classes/FillingRecipe.md), [`FillingId`](../../../../../../type-aliases/FillingId.md)\>

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

> `protected` **\_intersect**(`sets`): `Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:75](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L75)

Computes intersection of multiple sets.

#### Parameters

##### sets

`Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>[]

Array of sets to intersect

#### Returns

`Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>

Set containing IDs present in all input sets

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_intersect`](BaseIndexerOrchestrator.md#_intersect)

***

### \_resolveToEntities()

> `protected` **\_resolveToEntities**(`ids`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingRecipe`](../../../classes/FillingRecipe.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L117)

Resolves a set of IDs to entities.

#### Parameters

##### ids

`Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>

Set of IDs to resolve

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingRecipe`](../../../classes/FillingRecipe.md)[]\>

Array of resolved entities, or Failure if any resolution fails

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_resolveToEntities`](BaseIndexerOrchestrator.md#_resolvetoentities)

***

### \_union()

> `protected` **\_union**(`sets`): `Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts:102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexerOrchestrator.ts#L102)

Computes union of multiple sets.

#### Parameters

##### sets

`Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>[]

Array of sets to union

#### Returns

`Set`\<[`FillingId`](../../../../../../type-aliases/FillingId.md)\>

Set containing IDs present in any input set

#### Inherited from

[`BaseIndexerOrchestrator`](BaseIndexerOrchestrator.md).[`_union`](BaseIndexerOrchestrator.md#_union)

***

### convertConfig()

> **convertConfig**(`json`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingRecipeQuerySpec`](../interfaces/IFillingRecipeQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts:196](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts#L196)

Converts a JSON query specification to a typed config.

#### Parameters

##### json

`unknown`

JSON object with indexer name strings as keys and config objects as values

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingRecipeQuerySpec`](../interfaces/IFillingRecipeQuerySpec.md)\>

Typed query spec

***

### find()

> **find**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingRecipe`](../../../classes/FillingRecipe.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts:132](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts#L132)

Finds recipes matching a query specification.

#### Parameters

##### spec

[`IFillingRecipeQuerySpec`](../interfaces/IFillingRecipeQuerySpec.md)

Query specification with configs keyed by indexer name

##### options?

[`IFindOptions`](../interfaces/IFindOptions.md)

Optional find options (aggregation mode)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingRecipe`](../../../classes/FillingRecipe.md)[]\>

Array of matching recipes

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts:203](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts#L203)

Invalidates all indexer caches.

#### Returns

`void`

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts:213](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipeIndexerOrchestrator.ts#L213)

Pre-warms all indexers.

#### Returns

`void`
