[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IngredientsByTagIndexer

# Class: IngredientsByTagIndexer

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts:73](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts#L73)

Indexer that finds ingredients with a specific tag.
Tag matching is case-insensitive.

## Extends

- [`BaseIndexer`](BaseIndexer.md)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md), [`IIngredientsByTagConfig`](../interfaces/IIngredientsByTagConfig.md)\>

## Constructors

### Constructor

> **new IngredientsByTagIndexer**(`library`): `IngredientsByTagIndexer`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts:81](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts#L81)

Creates a new IngredientsByTagIndexer.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

The chocolate library to index

#### Returns

`IngredientsByTagIndexer`

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`constructor`](BaseIndexer.md#constructor)

## Properties

### \_isBuilt

> `protected` **\_isBuilt**: `boolean` = `false`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:48](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L48)

Flag indicating if the index has been built.

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_isBuilt`](BaseIndexer.md#_isbuilt)

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:43](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L43)

The chocolate library being indexed.

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`library`](BaseIndexer.md#library)

## Accessors

### \_indexerName

#### Get Signature

> **get** `protected` **\_indexerName**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:106](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L106)

Returns the name of this indexer for logging purposes.
Subclasses should override to provide a meaningful name.

##### Returns

`string`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_indexerName`](BaseIndexer.md#_indexername)

***

### \_logger

#### Get Signature

> **get** `protected` **\_logger**(): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:53](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L53)

Logger for reporting index operations.

##### Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_logger`](BaseIndexer.md#_logger)

## Methods

### \_addToSetIndex()

> `protected` **\_addToSetIndex**\<`TKey`, `TValue`\>(`index`, `key`, `value`): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:136](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L136)

Helper to add a value to a Set-based index.

#### Type Parameters

##### TKey

`TKey`

##### TValue

`TValue`

#### Parameters

##### index

`Map`\<`TKey`, `Set`\<`TValue`\>\>

##### key

`TKey`

##### value

`TValue`

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_addToSetIndex`](BaseIndexer.md#_addtosetindex)

***

### \_buildIndex()

> `protected` **\_buildIndex**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts:96](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts#L96)

Builds the internal index structure.
Called lazily on first query or explicitly via warmUp().

#### Returns

`void`

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`_buildIndex`](BaseIndexer.md#_buildindex)

***

### \_clearIndex()

> `protected` **\_clearIndex**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts:110](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts#L110)

Clears the internal index structure.
Called when invalidating the index.

#### Returns

`void`

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`_clearIndex`](BaseIndexer.md#_clearindex)

***

### \_emptyResult()

> `protected` **\_emptyResult**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IngredientId`](../../../../../../type-aliases/IngredientId.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:156](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L156)

Helper to return an empty success result.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IngredientId`](../../../../../../type-aliases/IngredientId.md)[]\>

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_emptyResult`](BaseIndexer.md#_emptyresult)

***

### \_ensureBuilt()

> `protected` **\_ensureBuilt**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:92](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L92)

Ensures the index is built before querying.

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_ensureBuilt`](BaseIndexer.md#_ensurebuilt)

***

### \_findInternal()

> `protected` **\_findInternal**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IngredientId`](../../../../../../type-aliases/IngredientId.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts:115](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts#L115)

Executes the query against the built index.

#### Parameters

##### config

[`IIngredientsByTagConfig`](../interfaces/IIngredientsByTagConfig.md)

The query configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IngredientId`](../../../../../../type-aliases/IngredientId.md)[]\>

Array of matching IDs

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`_findInternal`](BaseIndexer.md#_findinternal)

***

### \_getFromSetIndex()

> `protected` **\_getFromSetIndex**\<`TKey`, `TValue`\>(`index`, `key`): readonly `TValue`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:148](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L148)

Helper to get values from a Set-based index as an array.

#### Type Parameters

##### TKey

`TKey`

##### TValue

`TValue`

#### Parameters

##### index

`Map`\<`TKey`, `Set`\<`TValue`\>\>

##### key

`TKey`

#### Returns

readonly `TValue`[]

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_getFromSetIndex`](BaseIndexer.md#_getfromsetindex)

***

### find()

> **find**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IngredientId`](../../../../../../type-aliases/IngredientId.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:70](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L70)

Finds IDs matching the given configuration.

#### Parameters

##### config

[`IIngredientsByTagConfig`](../interfaces/IIngredientsByTagConfig.md)

The indexer-specific configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IngredientId`](../../../../../../type-aliases/IngredientId.md)[]\>

Array of IDs, or Failure on error

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`find`](BaseIndexer.md#find)

***

### getAllTags()

> **getAllTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts:90](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/ingredientsByTagIndexer.ts#L90)

Gets all unique tags used across ingredients.
Note: Forces index build if not already built.

#### Returns

readonly `string`[]

Array of lowercase tags

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:79](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L79)

Invalidates any cached index data.
Called when underlying library data changes.

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`invalidate`](BaseIndexer.md#invalidate)

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:85](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L85)

Pre-builds the index for efficient queries.
Called during warmup.

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`warmUp`](BaseIndexer.md#warmup)
